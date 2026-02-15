import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { bookmarkService } from '../services/bookmark.service';

const router = Router();

// Get user's bookmarks
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    
    const bookmarks = await bookmarkService.getUserBookmarks(userId, page, limit);

    res.json({
      success: true,
      data: bookmarks,
    });
  } catch (error) {
    next(error);
  }
});

// Create a bookmark
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { solutionId, note } = req.body;
    
    const bookmark = await bookmarkService.createBookmark(userId, solutionId, note);

    res.status(201).json({
      success: true,
      data: bookmark,
    });
  } catch (error) {
    next(error);
  }
});

// Delete a bookmark
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const bookmarkId = req.params.id;
    
    if (!bookmarkId) {
      return res.status(400).json({
        success: false,
        message: 'Bookmark ID is required',
      });
    }
    
    await bookmarkService.deleteBookmark(userId, bookmarkId);

    return res.json({
      success: true,
      message: 'Bookmark deleted',
    });
  } catch (error) {
    return next(error);
  }
});

// Update bookmark note
router.patch('/:id', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const bookmarkId = req.params.id;
    const { note } = req.body;
    
    if (!bookmarkId) {
      return res.status(400).json({
        success: false,
        message: 'Bookmark ID is required',
      });
    }
    
    const bookmark = await bookmarkService.updateBookmarkNote(userId, bookmarkId, note);

    return res.json({
      success: true,
      data: bookmark,
    });
  } catch (error) {
    return next(error);
  }
});

// Check if solution is bookmarked
router.get('/check/:solutionId', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const solutionId = req.params.solutionId;
    
    if (!solutionId) {
      return res.status(400).json({
        success: false,
        message: 'Solution ID is required',
      });
    }
    
    const isBookmarked = await bookmarkService.isBookmarked(userId, solutionId);

    return res.json({
      success: true,
      data: { isBookmarked },
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
