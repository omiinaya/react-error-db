import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { searchService } from '../services/search.service';
import { validateQuery } from '../middleware/validation.middleware';
import { z } from 'zod';

const router = Router();

// Search errors with advanced filtering
const searchSchema = z.object({
  query: z.string().min(1).max(200),
  applicationId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  hasSolutions: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
  sortBy: z.enum(['relevance', 'newest', 'popular', 'solutions']).optional(),
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
});

router.get('/', validateQuery(searchSchema), async (req, res, next) => {
  try {
    const { query, ...filters } = req.query as any;
    const userId = req.user?.id;

    const results = await searchService.search(query, {
      applicationId: filters.applicationId,
      categoryId: filters.categoryId,
      severity: filters.severity,
      hasSolutions: filters.hasSolutions,
      sortBy: filters.sortBy,
      page: filters.page || 1,
      limit: filters.limit || 20,
    }, userId);

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    next(error);
  }
});

// Get search suggestions/autocomplete
router.get('/suggestions', async (req, res, next) => {
  try {
    const { query, limit } = req.query;
    
    if (!query || typeof query !== 'string' || query.length < 2) {
      return res.json({
        success: true,
        data: [],
      });
    }

    const suggestions = await searchService.getSuggestions(
      query,
      limit ? parseInt(limit as string) : 5
    );

    return res.json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    return next(error);
  }
});

// Get user's search history
router.get('/history', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    const history = await searchService.getSearchHistory(userId, limit);

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    next(error);
  }
});

// Delete a search history item
router.delete('/history/:id', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const searchId = req.params.id;
    
    if (!searchId) {
      return res.status(400).json({
        success: false,
        message: 'Search history ID is required',
      });
    }
    
    await searchService.deleteSearchHistory(userId, searchId);

    return res.json({
      success: true,
      message: 'Search history deleted',
    });
  } catch (error) {
    return next(error);
  }
});

// Clear all search history
router.delete('/history', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    
    await searchService.clearSearchHistory(userId);

    res.json({
      success: true,
      message: 'Search history cleared',
    });
  } catch (error) {
    next(error);
  }
});

// Get search trends (admin only)
router.get('/trends', authenticateToken, async (req, res, next) => {
  try {
    // Check if user is admin
    if (!req.user!.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
    }

    const days = req.query.days ? parseInt(req.query.days as string) : 7;
    const trends = await searchService.getSearchTrends(days);

    return res.json({
      success: true,
      data: trends,
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
