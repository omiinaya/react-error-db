import { Router } from 'express';
import { updateProfileSchema, updateThemePreferenceSchema } from '../schemas/auth.schemas';
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

    return res.json({
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
    return res.status(500).json({
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

    return res.json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    logger.error('Update user profile error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to update profile'
      }
    });
  }
});

// Get all users (Admin only)
router.get('/', authenticateToken, requireAdmin, async (_req: AuthenticatedRequest, res) => {
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

const usersWithStats = users.map((user: any) => ({
    ...user,
    solutionsCount: user._count.solutions,
    _count: undefined
  }));

    return res.json({
      success: true,
      data: {
        users: usersWithStats
      }
    });
  } catch (error) {
    logger.error('Get all users error:', error);
    return res.status(500).json({
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

    return res.json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    logger.error('Update user role error:', error);
    return res.status(500).json({
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

    return res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    logger.error('Delete user error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to delete user'
      }
    });
  }
});

// Get current user's theme preference
router.get('/me/theme', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    logger.info('Theme preference request received');
    
    if (!req.user?.id) {
      logger.error('No user ID found in request');
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User ID not found in token'
        }
      });
    }

    logger.info(`Fetching theme preference for user ID: ${req.user.id}`);

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        themePreference: true,
      }
    });

    if (!user) {
      logger.error(`User not found with ID: ${req.user.id}`);
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    logger.info(`Theme preference fetched successfully: ${user.themePreference}`);
    return res.json({
      success: true,
      data: {
        themePreference: user.themePreference
      }
    });
  } catch (error) {
    logger.error('Get theme preference error:', error);
    logger.error(`Error details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    logger.error(`Error stack: ${error instanceof Error ? error.stack : 'No stack trace'}`);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to fetch theme preference'
      }
    });
  }
});

// Update current user's theme preference
router.put('/me/theme', authenticateToken, validateRequest(updateThemePreferenceSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const { themePreference } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { themePreference },
      select: {
        themePreference: true,
      }
    });

    return res.json({
      success: true,
      data: {
        themePreference: user.themePreference
      }
    });
  } catch (error) {
    logger.error('Update theme preference error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to update theme preference'
      }
    });
  }
});

export default router;