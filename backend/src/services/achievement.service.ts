import prisma from './database.service';
import { notificationService } from './notification.service';

// Define BadgeTier locally until Prisma generates it
export enum BadgeTier {
  bronze = 'bronze',
  silver = 'silver',
  gold = 'gold',
  platinum = 'platinum',
}

export interface BadgeCriteria {
  type: 'solution_count' | 'verified_count' | 'upvote_count' | 'contribution_days' | 'first_solution';
  threshold: number;
}

export class AchievementService {
  // Initialize default badges
  async initializeBadges() {
    const defaultBadges = [
      {
        name: 'First Solution',
        description: 'Submitted your first solution',
        icon: '📝',
        criteria: { type: 'solution_count', threshold: 1 } as BadgeCriteria,
        tier: BadgeTier.bronze,
        points: 10,
      },
      {
        name: 'Solution Novice',
        description: 'Submitted 10 solutions',
        icon: '📚',
        criteria: { type: 'solution_count', threshold: 10 } as BadgeCriteria,
        tier: BadgeTier.bronze,
        points: 25,
      },
      {
        name: 'Solution Expert',
        description: 'Submitted 50 solutions',
        icon: '🏆',
        criteria: { type: 'solution_count', threshold: 50 } as BadgeCriteria,
        tier: BadgeTier.silver,
        points: 100,
      },
      {
        name: 'Solution Master',
        description: 'Submitted 100 solutions',
        icon: '👑',
        criteria: { type: 'solution_count', threshold: 100 } as BadgeCriteria,
        tier: BadgeTier.gold,
        points: 250,
      },
      {
        name: 'Verified Contributor',
        description: 'Had 5 solutions verified',
        icon: '✅',
        criteria: { type: 'verified_count', threshold: 5 } as BadgeCriteria,
        tier: BadgeTier.bronze,
        points: 50,
      },
      {
        name: 'Expert Verified',
        description: 'Had 25 solutions verified',
        icon: '🌟',
        criteria: { type: 'verified_count', threshold: 25 } as BadgeCriteria,
        tier: BadgeTier.silver,
        points: 150,
      },
      {
        name: 'Community Favorite',
        description: 'Received 100 upvotes',
        icon: '❤️',
        criteria: { type: 'upvote_count', threshold: 100 } as BadgeCriteria,
        tier: BadgeTier.silver,
        points: 200,
      },
      {
        name: 'Weekly Warrior',
        description: 'Contributed for 7 consecutive days',
        icon: '🔥',
        criteria: { type: 'contribution_days', threshold: 7 } as BadgeCriteria,
        tier: BadgeTier.bronze,
        points: 75,
      },
    ];

for (const badge of defaultBadges) {
    await prisma.badge.upsert({
      where: { name: badge.name },
      update: {},
      create: {
        ...badge,
        criteria: badge.criteria as any,
      },
    });
  }
  }

  // Check and award badges for a user
  async checkAndAwardBadges(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        achievements: {
          include: {
            badge: true,
          },
        },
        solutions: {
          where: {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        },
      },
    });

    if (!user) return;

    const earnedBadgeIds = new Set(user.achievements.map(a => a.badgeId));
    const allBadges = await prisma.badge.findMany();

for (const badge of allBadges) {
    if (earnedBadgeIds.has(badge.id)) continue;

    const criteria = (badge.criteria as unknown) as BadgeCriteria;
    if (!criteria || !criteria.type) continue;
    
    let shouldAward = false;

      switch (criteria.type) {
        case 'solution_count':
          shouldAward = user.solutionCount >= criteria.threshold;
          break;
        case 'verified_count':
          shouldAward = user.verifiedSolutionCount >= criteria.threshold;
          break;
        case 'upvote_count':
          shouldAward = user.upvoteReceivedCount >= criteria.threshold;
          break;
        case 'contribution_days':
          shouldAward = user.solutions.length >= criteria.threshold;
          break;
        case 'first_solution':
          shouldAward = user.solutionCount >= 1;
          break;
      }

      if (shouldAward) {
        await this.awardBadge(userId, badge.id);
      }
    }
  }

  // Award a badge to a user
  async awardBadge(userId: string, badgeId: string) {
    const achievement = await prisma.achievement.create({
      data: {
        userId,
        badgeId,
      },
      include: {
        badge: true,
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
    });

    // Update user reputation
    await prisma.user.update({
      where: { id: userId },
      data: {
        reputation: {
          increment: achievement.badge.points,
        },
      },
    });

    // Send notification
    await notificationService.createNotification({
      userId,
      type: 'achievement_unlocked',
      title: 'Achievement Unlocked!',
      message: `You've earned the "${achievement.badge.name}" badge!`,
      resourceType: 'badge',
      resourceId: achievement.badge.id,
    });

    return achievement;
  }

  // Get user's achievements
  async getUserAchievements(userId: string) {
    const achievements = await prisma.achievement.findMany({
      where: { userId },
      include: {
        badge: true,
      },
      orderBy: {
        earnedAt: 'desc',
      },
    });

    const totalPoints = achievements.reduce((sum: number, a: typeof achievements[0]) => sum + a.badge.points, 0);

    return {
      achievements,
      totalPoints,
      badgeCount: achievements.length,
    };
  }

  // Get all available badges
  async getAllBadges() {
    return await prisma.badge.findMany({
      orderBy: [
        { tier: 'asc' },
        { points: 'desc' },
      ],
    });
  }

  // Get user stats for profile
  async getUserStats(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        reputation: true,
        solutionCount: true,
        verifiedSolutionCount: true,
        upvoteReceivedCount: true,
        createdAt: true,
        _count: {
          select: {
            solutions: true,
            bookmarks: true,
            following: true,
            followers: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const achievements = await this.getUserAchievements(userId);

    return {
      ...user,
      ...achievements,
    };
  }
}

export const achievementService = new AchievementService();
