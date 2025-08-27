import { Router } from 'express';
import { updateProfileSchema } from '../schemas/auth.schemas';
import { validateRequest } from '../middleware/validation.middleware';
import { authenticateToken, AuthenticatedRequest, requireAdmin } from '../middleware/auth.middleware';
import prisma from '../services/database.service';
import { logger } from '../utils/logger';

const router = Router();

// Get user profile
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId as string },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        isVerified: true,
        isAdmin: true,
        createdAt: true,
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    // Get user stats
    const [solutionsSubmitted, solutionsVerified, totalUpvotes, totalDownvotes, recentSolutions, topSolutions] = await Promise.all([
      prisma.solution.count({
        where: { authorId: userId as string }
      }),
      prisma.solution.count({
        where: { 
          authorId: userId as string,
          isVerified: true 
        }
      }),
      prisma.solution.aggregate({
        where: { authorId: userId as string },
        _sum: { upvotes: true }
      }),
      prisma.solution.aggregate({
        where: { authorId: userId as string },
        _sum: { downvotes: true }
      }),
      prisma.solution.findMany({
        where: { authorId: userId as string },
        include: {
          error: {
            include: {
              application: {
                select: {
                  name: true,
                  slug: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      prisma.solution.findMany({
        where: { authorId: userId as string },
        orderBy: { score: 'desc' },
        take: 5
      })
    ]);

    res.json({
      success: true,
      data: {
        user: {
          ...user,
          stats: {
            solutionsSubmitted,
            solutionsVerified,
            totalUpvotes: totalUpvotes._sum.upvotes || 0,
            totalDownvotes: totalDownvotes._sum.downvotes || 0,
          }
        },
        recentSolutions,
        topSolutions
      }
    });
  } catch (error) {
    logger.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to fetch user profile'
      }
    });
  }
});

// Update user profile
router.put('/me', authenticateToken, validateRequest(updateProfileSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const updateData = req.body;

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        isVerified: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    logger.error('Update user profile error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to update profile'
      }
    });
  }
});

// Get all users (Admin only)
router.get('/', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        isVerified: true,
        isAdmin: true,
        createdAt: true,
        _count: {
          select: {
            solutions: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const usersWithStats = users.map(user => ({
      ...user,
      solutionsCount: user._count.solutions,
      _count: undefined
    }));

    res.json({
      success: true,
      data: {
        users: usersWithStats
      }
    });
  } catch (error) {
    logger.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to fetch users'
      }
    });
  }
});

// Update user role (Admin only)
router.put('/:userId/role', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId } = req.params;
    const { isAdmin } = req.body;

    const user = await prisma.user.update({
      where: { id: userId as string },
      data: { isAdmin: Boolean(isAdmin) },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        isVerified: true,
        isAdmin: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    logger.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to update user role'
      }
    });
  }
});

// Delete user (Admin only)
router.delete('/:userId', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId } = req.params;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId as string }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    // Prevent deleting own account
    if (user.id === req.user!.id) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CANNOT_DELETE_SELF',
          message: 'Cannot delete your own account'
        }
      });
    }

    await prisma.user.delete({
      where: { id: userId as string }
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    logger.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to delete user'
      }
    });
  }
});

export default router;