import { Router } from 'express';
import { errorCodeQuerySchema, createErrorCodeSchema, updateErrorCodeSchema } from '../schemas/error.schemas';
import { createSolutionSchema } from '../schemas/solution.schemas';
import { validateRequest, validateQuery } from '../middleware/validation.middleware';
import { authenticateToken, AuthenticatedRequest, optionalAuth, requireAdmin } from '../middleware/auth.middleware';
import prisma from '../services/database.service';
import { logger } from '../utils/logger';

const router = Router();

// Search error codes with optional filtering and pagination
router.get('/', validateQuery(errorCodeQuerySchema), async (req, res) => {
  try {
    const query = req.query as any;
    const applicationId = query.applicationId as string | undefined;
    const search = query.search as string | undefined;
    const severity = query.severity as string | undefined;
    const sort = query.sort as string | undefined;
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 20;

    const where: any = {};

    if (applicationId) {
      where.applicationId = applicationId;
    }

    if (severity) {
      where.severity = severity;
    }

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Determine orderBy based on sort parameter
    let orderBy: any = { createdAt: 'desc' };
    
    if (sort === 'views') {
      orderBy = { viewCount: 'desc' };
    } else if (sort === 'title') {
      orderBy = { title: 'asc' };
    }

    const [errorCodes, total] = await Promise.all([
      prisma.errorCode.findMany({
        where,
        include: {
          application: {
            select: {
              id: true,
              name: true,
              slug: true,
              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                }
              }
            }
          },
          _count: {
            select: {
              solutions: true,
            }
          }
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.errorCode.count({ where }),
    ]);

// Transform data to include solutionCount
  const errorCodesWithCount = errorCodes.map((errorCode: any) => ({
    ...errorCode,
    solutionCount: errorCode._count.solutions,
    _count: undefined
  }));

    const totalPages = Math.ceil(total / limit);

    return res.json({
      success: true,
      data: {
        errors: errorCodesWithCount,
      },
      extreme: {
        pagination: {
          page,
          limit,
          total,
          pages: totalPages,
        }
      }
    });
  } catch (error) {
    logger.error('Search error codes error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to search error codes'
      }
    });
  }
});

// Get error code detail with solutions
router.get('/:id', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    // Increment view count
    await prisma.errorCode.update({
      where: { id: id as string },
      data: {
        viewCount: { increment: 1 }
      }
    });

    const errorCode = await prisma.errorCode.findUnique({
      where: { id: id as string },
      include: {
        application: {
          select: {
            id: true,
            name: true,
            slug: true,
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              }
            }
          }
        },
      }
    });

    if (!errorCode) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Error code not found'
        }
      });
    }

    // Get solutions with vote information
    const solutions = await prisma.solution.findMany({
      where: { errorId: id as string },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
          }
        },
        votes: req.user ? {
          where: { userId: req.user.id },
          select: { voteType: true }
        } : false,
      },
      orderBy: [
        { isVerified: 'desc' },
        { score: 'desc' },
        { createdAt: 'desc' }
      ]
    });

// Transform solutions to include userVote
  const solutionsWithVote = solutions.map((solution: any) => {
    const userVote = solution.votes && Array.isArray(solution.votes) && solution.votes.length > 0
      ? solution.votes[0]?.voteType || null
      : null;

      return {
        id: solution.id,
        solutionText: solution.solutionText,
        author: solution.author,
        upvotes: solution.upvotes,
        downvotes: solution.downvotes,
        score: solution.score,
        isVerified: solution.isVerified,
        userVote,
        createdAt: solution.createdAt,
        updatedAt: solution.updatedAt
      };
    });

    return res.json({
      success: true,
      data: {
        error: errorCode,
        solutions: solutionsWithVote
      }
    });
  } catch (error) {
    logger.error('Get error code detail error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to fetch error code details'
      }
    });
  }
});

// Create error code
router.post('/', authenticateToken, validateRequest(createErrorCodeSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const errorCodeData = req.body;

    // Check if error code with same code and application already exists
    const existingErrorCode = await prisma.errorCode.findUnique({
      where: {
        code_applicationId: {
          code: errorCodeData.code,
          applicationId: errorCodeData.applicationId
        }
      }
    });

    if (existingErrorCode) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'ERROR_CODE_EXISTS',
          message: 'Error code already exists for this application'
        }
      });
    }

    const errorCode = await prisma.errorCode.create({
      data: errorCodeData,
      include: {
        application: {
          select: {
            id: true,
            name: true,
            slug: true,
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              }
            }
          }
        }
      }
    });

    return res.status(201).json({
      success: true,
      data: {
        error: errorCode
      }
    });
  } catch (error) {
    logger.error('Create error code error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to create error code'
      }
    });
  }
});

// Update error code (Admin only)
router.put('/:id', authenticateToken, requireAdmin, validateRequest(updateErrorCodeSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if error code exists
    const existingErrorCode = await prisma.errorCode.findUnique({
      where: { id: id as string }
    });

    if (!existingErrorCode) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Error code not found'
        }
      });
    }

    // Check for code/application conflicts if code or applicationId is being updated
    if (updateData.code || updateData.applicationId) {
      const code = updateData.code || existingErrorCode.code;
      const applicationId = updateData.applicationId || existingErrorCode.applicationId;

      const conflictingErrorCode = await prisma.errorCode.findFirst({
        where: {
          id: { not: id as string },
          code,
          applicationId
        }
      });

      if (conflictingErrorCode) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'ERROR_CODE_EXISTS',
            message: 'Another error code with this code already exists for the application'
          }
        });
      }
    }

    const errorCode = await prisma.errorCode.update({
      where: { id: id as string },
      data: updateData,
      include: {
        application: {
          select: {
            id: true,
            name: true,
            slug: true,
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              }
            }
          }
        }
      }
    });

    return res.json({
      success: true,
      data: {
        error: errorCode
      }
    });
  } catch (error) {
    logger.error('Update error code error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to update error code'
      }
    });
  }
});

// Add solution to error code
router.post('/:errorId/solutions', authenticateToken, validateRequest(createSolutionSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const { errorId } = req.params;
    const { solutionText } = req.body;

    // Check if error code exists
    const errorCode = await prisma.errorCode.findUnique({
      where: { id: errorId as string }
    });

    if (!errorCode) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Error code not found'
        }
      });
    }

    // Create solution
    const solution = await prisma.solution.create({
      data: {
        errorId: errorId as string,
        authorId: req.user!.id,
        solutionText,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
          }
        }
      }
    });

    return res.status(201).json({
      success: true,
      data: {
        solution: {
          ...solution,
          upvotes: 0,
          downvotes: 0,
          score: 0,
          isVerified: false,
          userVote: null
        }
      }
    });
  } catch (error) {
    logger.error('Add solution error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to add solution'
      }
    });
  }
});

export default router;