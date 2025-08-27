import { Router } from 'express';
import { applicationQuerySchema, createApplicationSchema, updateApplicationSchema } from '../schemas/application.schemas';
import { validateRequest } from '../middleware/validation.middleware';
import { authenticateToken, AuthenticatedRequest, requireAdmin } from '../middleware/auth.middleware';
import prisma from '../services/database.service';
import { logger } from '../utils/logger';

const router = Router();

// Get all applications with optional filtering and pagination
router.get('/', validateRequest(applicationQuerySchema), async (req, res) => {
  try {
    const query = req.query as any;
    const categoryId = query.categoryId as string | undefined;
    const search = query.search as string | undefined;
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 20;

    const where: any = {};

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get applications first
    const applications = await prisma.application.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        },
      },
      orderBy: { name: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await prisma.application.count({ where });

    // Get error counts for the fetched applications
    const errorCounts = await prisma.errorCode.groupBy({
      by: ['applicationId'],
      _count: {
        _all: true,
      },
      where: {
        applicationId: {
          in: applications.map((app: any) => app.id)
        }
      }
    });

    // Create a map of applicationId to error count
    const errorCountMap = new Map();
    errorCounts.forEach((item: any) => {
      errorCountMap.set(item.applicationId, item._count._all);
    });

    // Transform data to include errorCount
    const applicationsWithCount = applications.map((app: any) => ({
      ...app,
      errorCount: errorCountMap.get(app.id) || 0
    }));

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        applications: applicationsWithCount,
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
    logger.error('Get applications error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to fetch applications'
      }
    });
  }
});

// Get application by slug
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const application = await prisma.application.findUnique({
      where: { slug },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        },
      }
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Application not found'
        }
      });
    }

    // Get error count separately
    const errorCount = await prisma.errorCode.count({
      where: { applicationId: application.id }
    });

    const applicationWithCount = {
      ...application,
      errorCount
    };

    res.json({
      success: true,
      data: {
        application: applicationWithCount
      }
    });
  } catch (error) {
    logger.error('Get application by slug error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to fetch application'
      }
    });
  }
});

// Create application (Admin only)
router.post('/', authenticateToken, requireAdmin, validateRequest(createApplicationSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const applicationData = req.body;

    // Check if application with same name or slug already exists
    const existingApplication = await prisma.application.findFirst({
      where: {
        OR: [
          { name: applicationData.name },
          { slug: applicationData.slug }
        ]
      }
    });

    if (existingApplication) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'APPLICATION_EXISTS',
          message: existingApplication.name === applicationData.name 
            ? 'Application with this name already exists' 
            : 'Application with this slug already exists'
        }
      });
    }

    const application = await prisma.application.create({
      data: applicationData,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: {
        application: {
          ...application,
          errorCount: 0
        }
      }
    });
  } catch (error) {
    logger.error('Create application error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to create application'
      }
    });
  }
});

// Update application (Admin only)
router.put('/:id', authenticateToken, requireAdmin, validateRequest(updateApplicationSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if application exists
    const existingApplication = await prisma.application.findUnique({
      where: { id: id as string }
    });

    if (!existingApplication) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Application not found'
        }
      });
    }

    // Check for conflicts with other applications
    if (updateData.name || updateData.slug) {
      const conflictingApplication = await prisma.application.findFirst({
        where: {
          id: { not: id as string },
          OR: [
            ...(updateData.name ? [{ name: updateData.name }] : []),
            ...(updateData.slug ? [{ slug: updateData.slug }] : [])
          ]
        }
      });

      if (conflictingApplication) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'APPLICATION_EXISTS',
            message: 'Another application with this name or slug already exists'
          }
        });
      }
    }

    const application = await prisma.application.update({
      where: { id: id as string },
      data: updateData,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        },
      }
    });

    // Get error count separately
    const errorCount = await prisma.errorCode.count({
      where: { applicationId: application.id }
    });

    const applicationWithCount = {
      ...application,
      errorCount
    };

    res.json({
      success: true,
      data: {
        application: applicationWithCount
      }
    });
  } catch (error) {
    logger.error('Update application error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to update application'
      }
    });
  }
});

export default router;