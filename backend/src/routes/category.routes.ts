import { Router } from 'express';
import { categoryQuerySchema, createCategorySchema, updateCategorySchema } from '../schemas/category.schemas';
import { validateRequest, validateQuery } from '../middleware/validation.middleware';
import { authenticateToken, AuthenticatedRequest, requireAdmin } from '../middleware/auth.middleware';
import prisma from '../services/database.service';
import { logger } from '../utils/logger';

const router = Router();

// Get all categories with optional filtering and hierarchy support
router.get('/', validateQuery(categoryQuerySchema), async (req, res) => {
  try {
    const query = req.query as any;
    const parentId = query.parentId as string | undefined;
    const includeChildren = query.includeChildren as boolean | undefined;
    const search = query.search as string | undefined;
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 20;

    const where: any = {};

    if (parentId) {
      where.parentId = parentId;
    } else if (includeChildren === false) {
      where.parentId = null; // Only root categories
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get categories with optional children inclusion
    const findManyOptions: any = {
      where,
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' }
      ],
      skip: (page - 1) * limit,
      take: limit,
    };

    if (includeChildren) {
      findManyOptions.include = {
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            icon: true,
            sortOrder: true,
          },
          orderBy: { sortOrder: 'asc' }
        }
      };
    }

    const categories = await prisma.category.findMany(findManyOptions);

    const total = await prisma.category.count({ where });

    // Get application counts for the fetched categories
    const applicationCounts = await prisma.application.groupBy({
      by: ['categoryId'],
      _count: {
        _all: true,
      },
      where: {
        categoryId: {
          in: categories.map((cat: any) => cat.id)
        }
      }
    });

    // Create a map of categoryId to application count
    const applicationCountMap = new Map();
    applicationCounts.forEach((item: any) => {
      applicationCountMap.set(item.categoryId, item._count._all);
    });

    // Transform data to include applicationCount and optionally children with their counts
    const categoriesWithCounts = categories.map((category: any) => {
      const baseCategory = {
        ...category,
        applicationCount: applicationCountMap.get(category.id) || 0
      };

      if (includeChildren && category.children) {
        return {
          ...baseCategory,
          children: category.children.map((child: any) => ({
            ...child,
            applicationCount: applicationCountMap.get(child.id) || 0
          }))
        };
      }

      return baseCategory;
    });

    const totalPages = Math.ceil(total / limit);

    return res.json({
      success: true,
      data: {
        categories: categoriesWithCounts,
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
    logger.error('Get categories error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to fetch categories'
      }
    });
  }
});

// Get category by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        },
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            icon: true,
            sortOrder: true,
          },
          orderBy: { sortOrder: 'asc' }
        }
      }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Category not found'
        }
      });
    }

    // Get application count
    const applicationCount = await prisma.application.count({
      where: { categoryId: category.id }
    });

    const categoryWithCount = {
      ...category,
      applicationCount
    };

    return res.json({
      success: true,
      data: {
        category: categoryWithCount
      }
    });
  } catch (error) {
    logger.error('Get category by ID error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to fetch category'
      }
    });
  }
});

// Create category (Admin only)
router.post('/', authenticateToken, requireAdmin, validateRequest(createCategorySchema), async (req: AuthenticatedRequest, res) => {
  try {
    const categoryData = req.body;

    // Check if category with same name or slug already exists
    const existingCategory = await prisma.category.findFirst({
      where: {
        OR: [
          { name: categoryData.name },
          { slug: categoryData.slug }
        ]
      }
    });

    if (existingCategory) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CATEGORY_EXISTS',
          message: existingCategory.name === categoryData.name 
            ? 'Category with this name already exists' 
            : 'Category with this slug already exists'
        }
      });
    }

    // Validate parent category exists if provided
    if (categoryData.parentId) {
      const parentCategory = await prisma.category.findUnique({
        where: { id: categoryData.parentId }
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

    const category = await prisma.category.create({
      data: categoryData,
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

    return res.status(201).json({
      success: true,
      data: {
        category: {
          ...category,
          applicationCount: 0
        }
      }
    });
  } catch (error) {
    logger.error('Create category error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to create category'
      }
    });
  }
});

// Update category (Admin only)
router.put('/:id', authenticateToken, requireAdmin, validateRequest(updateCategorySchema), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id: id as string }
    });

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Category not found'
        }
      });
    }

    // Check for conflicts with other categories
    if (updateData.name || updateData.slug) {
      const conflictingCategory = await prisma.category.findFirst({
        where: {
          id: { not: id as string },
          OR: [
            ...(updateData.name ? [{ name: updateData.name }] : []),
            ...(updateData.slug ? [{ slug: updateData.slug }] : [])
          ]
        }
      });

      if (conflictingCategory) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'CATEGORY_EXISTS',
            message: 'Another category with this name or slug already exists'
          }
        });
      }
    }

    // Validate parent category exists if provided
    if (updateData.parentId !== undefined) {
      if (updateData.parentId === id) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARENT',
            message: 'Category cannot be its own parent'
          }
        });
      }

      if (updateData.parentId) {
        const parentCategory = await prisma.category.findUnique({
          where: { id: updateData.parentId }
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
    }

    const category = await prisma.category.update({
      where: { id: id as string },
      data: updateData,
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        },
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            icon: true,
            sortOrder: true,
          },
          orderBy: { sortOrder: 'asc' }
        }
      }
    });

    // Get application count
    const applicationCount = await prisma.application.count({
      where: { categoryId: category.id }
    });

    const categoryWithCount = {
      ...category,
      applicationCount
    };

    return res.json({
      success: true,
      data: {
        category: categoryWithCount
      }
    });
  } catch (error) {
    logger.error('Update category error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to update category'
      }
    });
  }
});

// Delete category (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: id as string },
      include: {
        _count: {
          select: {
            applications: true,
            children: true
          }
        }
      }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Category not found'
        }
      });
    }

    // Check if category has applications or children
    if (category._count.applications > 0 || category._count.children > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CATEGORY_IN_USE',
          message: 'Cannot delete category that has applications or subcategories'
        }
      });
    }

    await prisma.category.delete({
      where: { id: id as string }
    });

    return res.json({
      success: true,
      data: {
        message: 'Category deleted successfully'
      }
    });
  } catch (error) {
    logger.error('Delete category error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to delete category'
      }
    });
  }
});

// Get applications for a specific category
router.get('/:id/applications', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: id as string }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Category not found'
        }
      });
    }

    const applications = await prisma.application.findMany({
      where: { categoryId: id as string },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        },
      },
      orderBy: { name: 'asc' }
    });

    // Get error counts for each application
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

    return res.json({
      success: true,
      data: {
        category: {
          id: category.id,
          name: category.name,
          slug: category.slug,
        },
        applications: applicationsWithCount
      }
    });
  } catch (error) {
    logger.error('Get category applications error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to fetch category applications'
      }
    });
  }
});

export default router;