import { Router } from 'express';
import { 
  createCategoryRequestSchema, 
  updateCategoryRequestStatusSchema, 
  categoryRequestQuerySchema 
} from '../schemas/category-request.schemas';
import { validateRequest, validateQuery } from '../middleware/validation.middleware';
import { authenticateToken, AuthenticatedRequest, requireAdmin } from '../middleware/auth.middleware';
import prisma from '../services/database.service';
import { logger } from '../utils/logger';

const router = Router();

// Submit a new category request
router.post('/', authenticateToken, validateRequest(createCategoryRequestSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const categoryRequestData = req.body;
    const userId = req.user!.id;

    // Check if category with same name or slug already exists
    const existingCategory = await prisma.category.findFirst({
      where: {
        OR: [
          { name: categoryRequestData.name },
          { slug: categoryRequestData.slug }
        ]
      }
    });

    if (existingCategory) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CATEGORY_EXISTS',
          message: existingCategory.name === categoryRequestData.name 
            ? 'Category with this name already exists' 
            : 'Category with this slug already exists'
        }
      });
    }

    // Check if there's already a pending request for the same name/slug
    const existingRequest = await prisma.categoryRequest.findFirst({
      where: {
        status: 'pending',
        OR: [
          { name: categoryRequestData.name },
          { slug: categoryRequestData.slug }
        ]
      }
    });

    if (existingRequest) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'REQUEST_EXISTS',
          message: 'A pending request for this category already exists'
        }
      });
    }

    // Validate parent category exists if provided
    if (categoryRequestData.parentId) {
      const parentCategory = await prisma.category.findUnique({
        where: { id: categoryRequestData.parentId }
      });

      if (!parentCategory) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARENT',
            message: 'Parent category does not exist'
          }
        });
      }
    }

    const categoryRequest = await prisma.categoryRequest.create({
      data: {
        ...categoryRequestData,
        requestedById: userId
      },
      include: {
        requestedBy: {
          select: {
            id: true,
            username: true,
            displayName: true,
          }
        },
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        }
      }
    });

    return res.status(201).json({
      success: true,
      data: {
        categoryRequest
      }
    });
  } catch (error) {
    logger.error('Create category request error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to create category request'
      }
    });
  }
});

// Get all category requests (Admin only)
router.get('/', authenticateToken, requireAdmin, validateQuery(categoryRequestQuerySchema), async (req: AuthenticatedRequest, res) => {
  try {
    const query = req.query as any;
    const status = query.status as string | undefined;
    const userId = query.userId as string | undefined;
    const search = query.search as string | undefined;
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 20;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (userId) {
      where.requestedById = userId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const categoryRequests = await prisma.categoryRequest.findMany({
      where,
      include: {
        requestedBy: {
          select: {
            id: true,
            username: true,
            displayName: true,
          }
        },
        reviewedBy: {
          select: {
            id: true,
            username: true,
            displayName: true,
          }
        },
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        }
      },
      orderBy: [
        { status: 'asc' }, // pending first
        { createdAt: 'desc' }
      ],
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await prisma.categoryRequest.count({ where });

    const totalPages = Math.ceil(total / limit);

    return res.json({
      success: true,
      data: {
        categoryRequests,
      },
      meta: {
        pagination: {
          page,
          limit,
          total,
          pages: totalPages,
        }
      }
    });
  } catch (error) {
    logger.error('Get category requests error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to fetch category requests'
      }
    });
  }
});

// Get user's own category requests
router.get('/user', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;

    const categoryRequests = await prisma.categoryRequest.findMany({
      where: {
        requestedById: userId
      },
      include: {
        reviewedBy: {
          select: {
            id: true,
            username: true,
            displayName: true,
          }
        },
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({
      success: true,
      data: {
        categoryRequests,
      }
    });
  } catch (error) {
    logger.error('Get user category requests error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to fetch user category requests'
      }
    });
  }
});

// Get category request by ID
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const categoryRequest = await prisma.categoryRequest.findUnique({
      where: { id: id as string },
      include: {
        requestedBy: {
          select: {
            id: true,
            username: true,
            displayName: true,
          }
        },
        reviewedBy: {
          select: {
            id: true,
            username: true,
            displayName: true,
          }
        },
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        }
      }
    });

    if (!categoryRequest) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Category request not found'
        }
      });
    }

    // Users can only see their own requests unless they're admin
    if (categoryRequest.requestedById !== userId && !req.user!.isAdmin) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied'
        }
      });
    }

    return res.json({
      success: true,
      data: {
        categoryRequest
      }
    });
  } catch (error) {
    logger.error('Get category request error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to fetch category request'
      }
    });
  }
});

// Approve or reject category request (Admin only)
router.put('/:id/status', authenticateToken, requireAdmin, validateRequest(updateCategoryRequestStatusSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    const reviewerId = req.user!.id;

    const categoryRequest = await prisma.categoryRequest.findUnique({
      where: { id: id as string }
    });

    if (!categoryRequest) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Category request not found'
        }
      });
    }

    if (categoryRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: 'Category request is not pending'
        }
      });
    }

    if (status === 'rejected' && !reason?.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'REASON_REQUIRED',
          message: 'Reason is required when rejecting a request'
        }
      });
    }

    let createdCategory = null;

    if (status === 'approved') {
      // Create the actual category
      createdCategory = await prisma.category.create({
        data: {
          name: categoryRequest.name,
          slug: categoryRequest.slug,
          description: categoryRequest.description,
          icon: categoryRequest.icon,
          parentId: categoryRequest.parentId,
        },
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              slug: true,
            }
          }
        }
      });
    }

    const updatedRequest = await prisma.categoryRequest.update({
      where: { id: id as string },
      data: {
        status,
        reason: status === 'rejected' ? reason : null,
        reviewedById: reviewerId,
        reviewedAt: new Date(),
      },
      include: {
        requestedBy: {
          select: {
            id: true,
            username: true,
            displayName: true,
          }
        },
        reviewedBy: {
          select: {
            id: true,
            username: true,
            displayName: true,
          }
        },
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        }
      }
    });

    return res.json({
      success: true,
      data: {
        categoryRequest: updatedRequest,
        createdCategory
      }
    });
  } catch (error) {
    logger.error('Update category request status error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to update category request status'
      }
    });
  }
});

export default router;