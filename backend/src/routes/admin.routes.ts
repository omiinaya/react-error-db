import { Router } from 'express';
import { authenticateToken, AuthenticatedRequest, requireAdmin } from '../middleware/auth.middleware';
import prisma from '../services/database.service';
import { logger } from '../utils/logger';

const router = Router();

// Admin Dashboard Statistics
router.get('/dashboard/stats', authenticateToken, requireAdmin, async (_req: AuthenticatedRequest, res) => {
  try {
    const [
      totalUsers,
      totalApplications,
      totalErrorCodes,
      totalSolutions,
      unverifiedSolutions,
      activeUsersLast24h,
      newUsersLast24h,
      _systemHealth
    ] = await Promise.all([
      prisma.user.count(),
      prisma.application.count(),
      prisma.errorCode.count(),
      prisma.solution.count(),
      prisma.solution.count({ where: { isVerified: false } }),
      prisma.userSession.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      }),
      // Basic system health check
      prisma.$queryRaw`SELECT 1 as status`
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalApplications,
          totalErrorCodes,
          totalSolutions,
          unverifiedSolutions,
          activeUsersLast24h,
          newUsersLast24h,
          systemHealth: { status: 'healthy' }
        }
      }
    });
  } catch (error) {
    logger.error('Admin dashboard stats error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to fetch dashboard statistics'
      }
    });
  }
});

// Get all users with pagination and filtering
router.get('/users', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search as string, mode: 'insensitive' } },
        { username: { contains: search as string, mode: 'insensitive' } },
        { displayName: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (role) {
      where.isAdmin = role === 'admin';
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where, // nosemgrep: javascript.express.security.audit.mongodb.nosql.express-mongo-nosqli
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          isVerified: true,
          isAdmin: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              solutions: true,
              votes: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take
      }),
      prisma.user.count({ where })
    ]);

const usersWithStats = users.map((user: any) => ({
    ...user,
    solutionsCount: user._count.solutions,
    votesCount: user._count.votes,
    _count: undefined
  }));

    res.json({
      success: true,
      data: {
        users: usersWithStats,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    logger.error('Admin get users error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to fetch users'
      }
    });
  }
});

// Get solutions for moderation
router.get('/solutions/moderation', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { page = 1, limit = 20, status = 'pending' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = {};

    if (status === 'pending') {
      where.isVerified = false;
    } else if (status === 'verified') {
      where.isVerified = true;
    } else if (status === 'reported') {
      // You can add reported solutions logic later
      where.isVerified = false;
    }

    const [solutions, total] = await Promise.all([
      prisma.solution.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true
            }
          },
          error: {
            include: {
              application: {
                select: {
                  name: true,
                  slug: true
                }
              }
            }
          },
          verifiedBy: {
            select: {
              id: true,
              username: true,
              displayName: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take
      }),
      prisma.solution.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        solutions,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    logger.error('Admin get solutions for moderation error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to fetch solutions for moderation'
      }
    });
  }
});

// Bulk solution moderation
router.post('/solutions/bulk-moderation', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { solutionIds, action } = req.body;

    if (!Array.isArray(solutionIds) || solutionIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Solution IDs array is required'
        }
      });
    }

    if (solutionIds.some(id => typeof id !== 'string' || id.length !== 36)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Solution IDs must be valid UUID strings'
        }
      });
    }

    if (!['verify', 'reject', 'delete'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Action must be one of: verify, reject, delete'
        }
      });
    }

    let result;
    if (action === 'verify') {
      result = await prisma.solution.updateMany({
        where: { // nosemgrep: javascript.express.security.audit.mongodb.nosql.express-mongo-nosqli
          id: { in: solutionIds }
        },
        data: {
          isVerified: true,
          verifiedById: req.user!.id,
          verifiedAt: new Date()
        }
      });
    } else if (action === 'reject') {
      result = await prisma.solution.updateMany({
        where: { // nosemgrep: javascript.express.security.audit.mongodb.nosql.express-mongo-nosqli
          id: { in: solutionIds }
        },
        data: {
          isVerified: false,
          verifiedById: null,
          verifiedAt: null
        }
      });
    } else if (action === 'delete') {
      result = await prisma.solution.deleteMany({
        where: { // nosemgrep: javascript.express.security.audit.mongodb.nosql.express-mongo-nosqli
          id: { in: solutionIds }
        }
      });
    } else {
      // Handle unexpected action
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid action'
        }
      });
    }

    return res.json({
      success: true,
      data: {
        action,
        count: result?.count || 0,
        message: `${action} action completed successfully`
      }
    });
  } catch (error) {
    logger.error('Admin bulk moderation error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to perform bulk moderation'
      }
    });
  }
});

// Get system logs (placeholder - integrate with your logging system)
router.get('/system/logs', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    
    // This is a placeholder - you should integrate with your actual logging system
    const logs: any[] = [];
    const total = 0;

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    logger.error('Admin get system logs error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to fetch system logs'
      }
    });
  }
});

// Get application statistics
router.get('/applications/stats', authenticateToken, requireAdmin, async (_req: AuthenticatedRequest, res) => {
  try {
    const applications = await prisma.application.findMany({
      include: {
        category: {
          select: {
            name: true,
            slug: true
          }
        },
        _count: {
          select: {
            errorCodes: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

const applicationsWithStats = applications.map((app: any) => ({
    ...app,
    errorCount: app._count.errorCodes,
    _count: undefined
  }));

    res.json({
      success: true,
      data: {
        applications: applicationsWithStats
      }
    });
  } catch (error) {
    logger.error('Admin get applications stats error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to fetch application statistics'
      }
    });
  }
});

// Export data
router.get('/export/:type', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { type } = req.params;
    const { format = 'json' } = req.query;

    let data: any;

    switch (type) {
      case 'users':
        data = await prisma.user.findMany({
          select: {
            id: true,
            email: true,
            username: true,
            displayName: true,
            isVerified: true,
            isAdmin: true,
            createdAt: true,
            updatedAt: true
          }
        });
        break;
      case 'solutions':
        data = await prisma.solution.findMany({
          include: {
            author: {
              select: {
                username: true,
                displayName: true
              }
            },
            error: {
              include: {
                application: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        });
        break;
      case 'errors':
        data = await prisma.errorCode.findMany({
          include: {
            application: {
              select: {
                name: true
              }
            }
          }
        });
        break;
      default:
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_TYPE',
            message: 'Invalid export type. Must be: users, solutions, or errors'
          }
        });
    }

    if (format === 'csv') {
      // Simple CSV conversion (you might want to use a library for complex data)
      const headers = Object.keys(data[0] || {}).join(',');
      const rows = data.map((item: any) =>
        Object.values(item).map(val =>
          typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
        ).join(',')
      ).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${type}-export-${Date.now()}.csv`);
      res.send(`${headers}\n${rows}`);
      return;
    }

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    logger.error('Admin export error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to export data'
      }
    });
  }
});

export default router;