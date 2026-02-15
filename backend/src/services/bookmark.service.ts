import prisma from './database.service';
import { notificationService } from './notification.service';

export class BookmarkService {
  async createBookmark(userId: string, solutionId: string, note?: string) {
    // Check if bookmark already exists
    const existingBookmark = await prisma.bookmark.findUnique({
      where: {
        userId_solutionId: {
          userId,
          solutionId,
        },
      },
    });

    if (existingBookmark) {
      throw new Error('Bookmark already exists');
    }

    const bookmark = await prisma.bookmark.create({
      data: {
        userId,
        solutionId,
        note: note ?? null,
      },
      include: {
        solution: {
          include: {
            error: {
              include: {
                application: true,
              },
            },
            author: {
              select: {
                id: true,
                username: true,
                displayName: true,
              },
            },
          },
        },
      },
    });

    // Notify solution author (if not bookmarking own solution)
    if (bookmark.solution && bookmark.solution.authorId !== userId) {
      await notificationService.createNotification({
        userId: bookmark.solution.authorId,
        type: 'new_follower',
        title: 'Solution Bookmarked',
        message: `Someone bookmarked your solution for ${bookmark.solution.error.application.name}: ${bookmark.solution.error.code}`,
        resourceType: 'solution',
        resourceId: solutionId,
      });
    }

    return bookmark;
  }

  async deleteBookmark(userId: string, bookmarkId: string) {
    const bookmark = await prisma.bookmark.findFirst({
      where: {
        id: bookmarkId,
        userId,
      },
    });

    if (!bookmark) {
      throw new Error('Bookmark not found');
    }

    await prisma.bookmark.delete({
      where: { id: bookmarkId },
    });

    return { success: true };
  }

  async getUserBookmarks(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [bookmarks, totalCount] = await Promise.all([
      prisma.bookmark.findMany({
        where: { userId },
        include: {
          solution: {
            include: {
              error: {
                include: {
                  application: {
                    include: {
                      category: true,
                    },
                  },
                },
              },
              author: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                },
              },
              _count: {
                select: {
                  votes: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.bookmark.count({
        where: { userId },
      }),
    ]);

    return {
      bookmarks,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    };
  }

  async updateBookmarkNote(userId: string, bookmarkId: string, note: string) {
    const bookmark = await prisma.bookmark.findFirst({
      where: {
        id: bookmarkId,
        userId,
      },
    });

    if (!bookmark) {
      throw new Error('Bookmark not found');
    }

    return await prisma.bookmark.update({
      where: { id: bookmarkId },
      data: { note },
      include: {
        solution: {
          include: {
            error: {
              include: {
                application: true,
              },
            },
          },
        },
      },
    });
  }

  async isBookmarked(userId: string, solutionId: string): Promise<boolean> {
    const bookmark = await prisma.bookmark.findUnique({
      where: {
        userId_solutionId: {
          userId,
          solutionId,
        },
      },
    });

    return !!bookmark;
  }

  async getBookmarkCount(solutionId: string): Promise<number> {
    return await prisma.bookmark.count({
      where: { solutionId },
    });
  }
}

export const bookmarkService = new BookmarkService();
