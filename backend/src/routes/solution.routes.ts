import { Router } from 'express';
import { updateSolutionSchema, voteSchema } from '../schemas/solution.schemas';
import { validateRequest } from '../middleware/validation.middleware';
import { authenticateToken, AuthenticatedRequest, requireAdmin } from '../middleware/auth.middleware';
import prisma from '../services/database.service';
import { logger } from '../utils/logger';

const router = Router();


// Vote on solution
router.post('/:solutionId/vote', authenticateToken, validateRequest(voteSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const { solutionId } = req.params;
    const { voteType } = req.body;

    // Check if solution exists
    const solution = await prisma.solution.findUnique({
      where: { id: solutionId as string }
    });

    if (!solution) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Solution not found'
        }
      });
    }

    // Check if user has already voted
    const existingVote = await prisma.vote.findUnique({
      where: {
        solutionId_userId: {
          solutionId: solutionId as string,
          userId: req.user!.id
        }
      }
    });

    let updatedSolution;

    if (existingVote) {
      // User has already voted, update the vote
      if (existingVote.voteType === voteType) {
        // Same vote type, remove the vote
        await prisma.$transaction([
          prisma.vote.delete({
            where: {
              solutionId_userId: {
                solutionId: solutionId as string,
                userId: req.user!.id
              }
            }
          }),
          prisma.solution.update({
            where: { id: solutionId as string },
            data: {
              ...(voteType === 'upvote' ? { upvotes: { decrement: 1 } } : {}),
              ...(voteType === 'downvote' ? { downvotes: { decrement: 1 } } : {}),
            }
          })
        ]);

        updatedSolution = await prisma.solution.findUnique({
          where: { id: solutionId as string },
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
      } else {
        // Different vote type, update the vote
        await prisma.$transaction([
          prisma.vote.update({
            where: {
              solutionId_userId: {
                solutionId: solutionId as string,
                userId: req.user!.id
              }
            },
            data: { voteType }
          }),
          prisma.solution.update({
            where: { id: solutionId as string },
            data: {
              ...(voteType === 'upvote'
                ? { upvotes: { increment: 1 }, downvotes: { decrement: 1 } }
                : { upvotes: { decrement: 1 }, downvotes: { increment: 1 } }
              ),
            }
          })
        ]);

        updatedSolution = await prisma.solution.findUnique({
          where: { id: solutionId as string },
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
      }
    } else {
      // New vote
      await prisma.$transaction([
        prisma.vote.create({
          data: {
            solutionId: solutionId as string,
            userId: req.user!.id,
            voteType
          }
        }),
        prisma.solution.update({
          where: { id: solutionId as string },
          data: {
            ...(voteType === 'upvote' ? { upvotes: { increment: 1 } } : {}),
            ...(voteType === 'downvote' ? { downvotes: { increment: 1 } } : {}),
          }
        })
      ]);

      updatedSolution = await prisma.solution.findUnique({
        where: { id: solutionId as string },
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
    }

    return res.json({
      success: true,
      data: {
        solution: {
          ...updatedSolution,
          userVote: voteType
        }
      }
    });
  } catch (error) {
    logger.error('Vote on solution error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to vote on solution'
      }
    });
  }
});

// Update solution (Owner or Admin)
router.put('/:solutionId', authenticateToken, validateRequest(updateSolutionSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const { solutionId } = req.params;
    const { solutionText } = req.body;

    // Check if solution exists and user has permission
    const solution = await prisma.solution.findUnique({
      where: { id: solutionId as string },
      include: {
        author: true
      }
    });

    if (!solution) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Solution not found'
        }
      });
    }

    // Check if user is owner or admin
    const isOwner = solution.authorId === req.user!.id;
    const isAdmin = req.user!.isAdmin;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You can only update your own solutions'
        }
      });
    }

    // Check if solution is verified and user is not admin
    if (solution.isVerified && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'SOLUTION_VERIFIED',
          message: 'Cannot edit verified solutions. Only administrators can edit verified solutions.'
        }
      });
    }

    // Prepare update data
    const updateData: any = {
      solutionText,
      editCount: (solution.editCount || 0) + 1,
      lastEditedAt: new Date(),
      lastEditedById: req.user!.id
    };

    // Reset verification status if solution was previously verified and is being edited by admin
    if (solution.isVerified && isAdmin) {
      updateData.isVerified = false;
      updateData.verifiedById = null;
      updateData.verifiedAt = null;
    }

    const updatedSolution = await prisma.solution.update({
      where: { id: solutionId as string },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
          }
        },
        lastEditedBy: {
          select: {
            id: true,
            username: true,
            displayName: true,
          }
        }
      }
    });

    return res.json({
      success: true,
      data: {
        solution: updatedSolution
      }
    });
  } catch (error) {
    logger.error('Update solution error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to update solution'
      }
    });
  }
});

// Delete solution (Owner or Admin)
router.delete('/:solutionId', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { solutionId } = req.params;

    // Check if solution exists and user has permission
    const solution = await prisma.solution.findUnique({
      where: { id: solutionId as string }
    });

    if (!solution) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Solution not found'
        }
      });
    }

    // Check if user is owner or admin
    if (solution.authorId !== req.user!.id && !req.user!.isAdmin) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You can only delete your own solutions'
        }
      });
    }

    await prisma.solution.delete({
      where: { id: solutionId as string }
    });

    return res.json({
      success: true,
      message: 'Solution deleted successfully'
    });
  } catch (error) {
    logger.error('Delete solution error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to delete solution'
      }
    });
  }
});

// Verify solution (Admin only)
router.post('/:solutionId/verify', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { solutionId } = req.params;

    const solution = await prisma.solution.update({
      where: { id: solutionId as string },
      data: {
        isVerified: true,
        verifiedById: req.user!.id,
        verifiedAt: new Date()
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

    return res.json({
      success: true,
      data: {
        solution
      }
    });
  } catch (error) {
    logger.error('Verify solution error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to verify solution'
      }
    });
  }
});

export default router;