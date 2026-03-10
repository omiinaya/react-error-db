import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { webhookService, WebhookEvents } from '../services/webhook.service';
import crypto from 'crypto';

const router = Router();

// Get user's webhooks
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const webhooks = await webhookService.getUserWebhooks(userId);

res.json({
    success: true,
    data: webhooks.map((w: any) => ({
      ...w,
      secret: undefined, // Don't expose secret
    })),
  });
  } catch (error) {
    next(error);
  }
});

// Create webhook
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { url, events } = req.body;

    if (!url || !events || !Array.isArray(events) || events.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'URL and at least one event type are required',
      });
    }

    // Generate a random secret
    const secret = crypto.randomBytes(32).toString('hex');

    const webhook = await webhookService.createWebhook(userId, url as string, events as string[], secret);

    return res.status(201).json({
      success: true,
      data: {
        ...webhook,
        secret, // Show secret only on creation
      },
    });
  } catch (error) {
    return next(error);
  }
});

// Update webhook
router.patch('/:id', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user?.id as string;
    const webhookId = req.params.id as string;
    const { url, events, isActive } = req.body;

    if (!webhookId) {
      return res.status(400).json({
        success: false,
        message: 'Webhook ID is required',
      });
    }

    const updateData: { url?: string; events?: string[]; isActive?: boolean } = {};
    if (url !== undefined) updateData.url = url as string;
    if (events !== undefined) updateData.events = events as string[];
    if (isActive !== undefined) updateData.isActive = isActive as boolean;
    
    const webhook = await webhookService.updateWebhook(userId, webhookId, updateData);

    return res.json({
      success: true,
      data: {
        ...webhook,
        secret: undefined,
      },
    });
  } catch (error) {
    return next(error);
  }
});

// Delete webhook
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const webhookId = req.params.id;

    if (!webhookId) {
      return res.status(400).json({
        success: false,
        message: 'Webhook ID is required',
      });
    }

    await webhookService.deleteWebhook(userId, webhookId as string);

    return res.json({
      success: true,
      message: 'Webhook deleted',
    });
  } catch (error) {
    return next(error);
  }
});

// Regenerate webhook secret
router.post('/:id/regenerate-secret', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const webhookId = req.params.id;

    if (!webhookId) {
      return res.status(400).json({
        success: false,
        message: 'Webhook ID is required',
      });
    }

    const newSecret = await webhookService.regenerateSecret(userId, webhookId as string);

    return res.json({
      success: true,
      data: { secret: newSecret },
    });
  } catch (error) {
    return next(error);
  }
});

// Get webhook delivery history
router.get('/:id/deliveries', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const webhookId = req.params.id;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    if (!webhookId) {
      return res.status(400).json({
        success: false,
        message: 'Webhook ID is required',
      });
    }

    const deliveries = await webhookService.getWebhookDeliveries(webhookId, userId, limit);

    return res.json({
      success: true,
      data: deliveries,
    });
  } catch (error) {
    return next(error);
  }
});

// Get available event types
router.get('/events/types', authenticateToken, async (_req, res) => {
  res.json({
    success: true,
    data: Object.entries(WebhookEvents).map(([key, value]) => ({
      key,
      value,
      description: getEventDescription(value),
    })),
  });
});

function getEventDescription(event: string): string {
  const descriptions: Record<string, string> = {
    [WebhookEvents.ERROR_CREATED]: 'Triggered when a new error code is created',
    [WebhookEvents.ERROR_UPDATED]: 'Triggered when an error code is updated',
    [WebhookEvents.SOLUTION_CREATED]: 'Triggered when a new solution is submitted',
    [WebhookEvents.SOLUTION_VERIFIED]: 'Triggered when a solution is verified',
    [WebhookEvents.SOLUTION_UPVOTED]: 'Triggered when a solution receives an upvote',
    [WebhookEvents.USER_REGISTERED]: 'Triggered when a new user registers',
    [WebhookEvents.CATEGORY_CREATED]: 'Triggered when a new category is created',
    [WebhookEvents.APPLICATION_CREATED]: 'Triggered when a new application is created',
  };
  return descriptions[event] || 'No description available';
}

export default router;
