import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { secretManager, Secrets } from '../utils/secrets';
import { z } from 'zod';
import { logger } from '../utils/logger';

const router = Router();

// Apply authentication and admin middleware to all routes
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * @route GET /api/secrets
 * @description Get list of all secret keys (metadata only)
 * @access Admin only
 */
router.get('/', (_req, res) => {
  try {
    const keys = secretManager.getAllSecretKeys();
    const metadata = keys.map(key => ({
      key,
      ...secretManager.getSecretMetadata(key),
    }));

    return res.status(200).json({
      success: true,
      data: metadata,
    });
  } catch (error) {
    logger.error('Failed to get secret keys:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve secret keys',
    });
  }
});

/**
 * @route GET /api/secrets/:key
 * @description Get secret value (masked for security)
 * @access Admin only
 */
router.get('/:key', 
  validateRequest(z.object({
    params: z.object({
      key: z.string().min(1),
    }),
  })),
  (req, res) => {
    try {
      const { key } = req.params as { key: string };
      const metadata = secretManager.getSecretMetadata(key);
      
      if (!metadata) {
        return res.status(404).json({
          success: false,
          error: 'Secret not found',
        });
      }

      // Return metadata only, not the actual secret value
      return res.status(200).json({
        success: true,
        data: metadata,
      });
    } catch (error) {
      logger.error('Failed to get secret metadata:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve secret metadata',
      });
    }
  }
);

/**
 * @route POST /api/secrets/:key/rotate
 * @description Rotate a specific secret
 * @access Admin only
 */
router.post('/:key/rotate',
  validateRequest(z.object({
    params: z.object({
      key: z.string().min(1),
    }),
    body: z.object({
      newValue: z.string().min(16).optional(),
    }).optional(),
  })),
  async (req, res) => {
    try {
      const { key } = req.params as { key: string };
      const { newValue } = req.body || {};

      const success = await secretManager.rotateSecret(key, newValue);

      if (!success) {
        return res.status(404).json({
          success: false,
          error: 'Secret not found or rotation failed',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Secret rotated successfully',
        data: {
          key,
          rotatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Failed to rotate secret:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to rotate secret',
      });
    }
  }
);

/**
 * @route POST /api/secrets/rotate-all
 * @description Rotate all secrets that need rotation
 * @access Admin only
 */
router.post('/rotate-all', async (_req, res) => {
  try {
    const results = await Secrets.rotateAllNeeded();

    return res.status(200).json({
      success: true,
      message: 'Secret rotation completed',
      data: results,
    });
  } catch (error) {
    logger.error('Failed to rotate all secrets:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to rotate secrets',
    });
  }
});

/**
 * @route POST /api/secrets/:key
 * @description Create or update a secret
 * @access Admin only
 */
router.post('/:key',
  validateRequest(z.object({
    params: z.object({
      key: z.string().min(1),
    }),
    body: z.object({
      value: z.string().min(16),
      expiresInDays: z.number().min(1).max(365).optional(),
    }),
  })),
  (req, res) => {
    try {
      const { key } = req.params as { key: string };
      const { value, expiresInDays } = req.body;

      // Validate secret strength
      const validation = secretManager.validateSecretStrength(value);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid secret strength',
          details: validation.reasons,
        });
      }

      const expiresInMs = expiresInDays ? expiresInDays * 24 * 60 * 60 * 1000 : undefined;
      secretManager.setSecret(key, value, expiresInMs);

      return res.status(200).json({
        success: true,
        message: 'Secret set successfully',
        data: {
          key,
          expiresInDays,
          strength: validation,
        },
      });
    } catch (error) {
      logger.error('Failed to set secret:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to set secret',
      });
    }
  }
);

/**
 * @route DELETE /api/secrets/:key
 * @description Delete a secret
 * @access Admin only
 */
router.delete('/:key',
  validateRequest(z.object({
    params: z.object({
      key: z.string().min(1),
    }),
  })),
  (req, res) => {
    try {
      const { key } = req.params as { key: string };
      const success = secretManager.removeSecret(key);

      if (!success) {
        return res.status(404).json({
          success: false,
          error: 'Secret not found',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Secret deleted successfully',
      });
    } catch (error) {
      logger.error('Failed to delete secret:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete secret',
      });
    }
  }
);

/**
 * @route GET /api/secrets/health/rotation
 * @description Get secrets that need rotation
 * @access Admin only
 */
router.get('/health/rotation', (_req, res) => {
  try {
    const needsRotation = secretManager.getSecretsNeedingRotation();
    const rotationStatus = needsRotation.map(key => ({
      key,
      ...secretManager.getSecretMetadata(key),
    }));

    return res.status(200).json({
      success: true,
      data: {
        needsRotation: rotationStatus,
        total: rotationStatus.length,
        nextRotationCheck: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
      },
    });
  } catch (error) {
    logger.error('Failed to get rotation status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get rotation status',
    });
  }
});

/**
 * @route POST /api/secrets/validate
 * @description Validate secret strength
 * @access Admin only
 */
router.post('/validate',
  validateRequest(z.object({
    body: z.object({
      secret: z.string().min(1),
      minLength: z.number().min(8).max(128).optional().default(16),
    }),
  })),
  (req, res) => {
    try {
      const { secret, minLength } = req.body;
      const validation = secretManager.validateSecretStrength(secret, minLength);

      return res.status(200).json({
        success: true,
        data: validation,
      });
    } catch (error) {
      logger.error('Failed to validate secret:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to validate secret',
      });
    }
  }
);

/**
 * @route POST /api/secrets/generate
 * @description Generate a random secret
 * @access Admin only
 */
router.post('/generate',
  validateRequest(z.object({
    body: z.object({
      length: z.number().min(16).max(128).optional().default(32),
    }),
  })),
  (req, res) => {
    try {
      const { length } = req.body;
      const secret = secretManager.generateRandomSecret(length);
      const validation = secretManager.validateSecretStrength(secret, length);

      return res.status(200).json({
        success: true,
        data: {
          secret,
          length,
          strength: validation,
        },
      });
    } catch (error) {
      logger.error('Failed to generate secret:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to generate secret',
      });
    }
  }
);

/**
 * @route POST /api/secrets/export
 * @description Export all secrets (encrypted)
 * @access Admin only
 */
router.post('/export',
  validateRequest(z.object({
    body: z.object({
      encryptionKey: z.string().min(32),
    }),
  })),
  (req, res) => {
    try {
      const { encryptionKey } = req.body;
      const encryptedData = secretManager.exportSecrets(encryptionKey);

      return res.status(200).json({
        success: true,
        data: {
          encryptedData,
          exportTime: new Date().toISOString(),
          totalSecrets: secretManager.getAllSecretKeys().length,
        },
      });
    } catch (error) {
      logger.error('Failed to export secrets:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to export secrets',
      });
    }
  }
);

/**
 * @route POST /api/secrets/import
 * @description Import secrets from backup
 * @access Admin only
 */
router.post('/import',
  validateRequest(z.object({
    body: z.object({
      encryptedData: z.string().min(1),
      decryptionKey: z.string().min(32),
    }),
  })),
  (req, res) => {
    try {
      const { encryptedData, decryptionKey } = req.body;
      const success = secretManager.importSecrets(encryptedData, decryptionKey);

      if (!success) {
        return res.status(400).json({
          success: false,
          error: 'Failed to import secrets - invalid data or key',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Secrets imported successfully',
        data: {
          importTime: new Date().toISOString(),
          totalSecrets: secretManager.getAllSecretKeys().length,
        },
      });
    } catch (error) {
      logger.error('Failed to import secrets:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to import secrets',
      });
    }
  }
);

export default router;