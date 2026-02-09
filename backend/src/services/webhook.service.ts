import prisma from './database.service';
import crypto from 'crypto';
import { logger } from '../utils/logger';

export interface WebhookEvent {
  event: string;
  data: any;
  timestamp: string;
}

export class WebhookService {
  async createWebhook(userId: string, url: string, events: string[], secret: string) {
    return await prisma.webhook.create({
      data: {
        userId,
        url,
        events: events as any,
        secret,
        isActive: true,
        failureCount: 0,
      },
    });
  }

  async getUserWebhooks(userId: string) {
    return await prisma.webhook.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateWebhook(userId: string, webhookId: string, data: { url?: string; events?: string[]; isActive?: boolean }) {
    const webhook = await prisma.webhook.findFirst({
      where: { id: webhookId, userId },
    });

    if (!webhook) {
      throw new Error('Webhook not found');
    }

    return await prisma.webhook.update({
      where: { id: webhookId },
      data: {
        ...(data.url && { url: data.url }),
        ...(data.events && { events: data.events as any }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        updatedAt: new Date(),
      },
    });
  }

  async deleteWebhook(userId: string, webhookId: string) {
    const webhook = await prisma.webhook.findFirst({
      where: { id: webhookId, userId },
    });

    if (!webhook) {
      throw new Error('Webhook not found');
    }

    await prisma.webhook.delete({
      where: { id: webhookId },
    });

    return { success: true };
  }

  async triggerEvent(eventType: string, data: any) {
    const webhooks = await prisma.webhook.findMany({
      where: {
        isActive: true,
        events: {
          has: eventType,
        },
      },
    });

    const event: WebhookEvent = {
      event: eventType,
      data,
      timestamp: new Date().toISOString(),
    };

    for (const webhook of webhooks) {
      await this.deliverWebhook(webhook.id, webhook.url, webhook.secret, event);
    }
  }

  private async deliverWebhook(webhookId: string, url: string, secret: string, event: WebhookEvent) {
    const payload = JSON.stringify(event);
    const signature = this.generateSignature(payload, secret);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': event.event,
          'X-Webhook-Timestamp': event.timestamp,
        },
        body: payload,
        timeout: 30000, // 30 second timeout
      });

      const success = response.ok;
      const responseBody = success ? await response.text() : null;

      await this.logDelivery(webhookId, event.event, payload, response.status, responseBody, success);

      if (success) {
        await this.updateWebhookStatus(webhookId, new Date(), 'success', 0);
      } else {
        await this.handleDeliveryFailure(webhookId);
      }
    } catch (error) {
      logger.error(`Webhook delivery failed for ${webhookId}:`, error);
      await this.logDelivery(webhookId, event.event, payload, null, null, false, (error as Error).message);
      await this.handleDeliveryFailure(webhookId);
    }
  }

  private generateSignature(payload: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  private async logDelivery(
    webhookId: string,
    event: string,
    payload: string,
    responseStatus: number | null,
    responseBody: string | null,
    success: boolean,
    errorMessage?: string
  ) {
    try {
      await prisma.webhookDelivery.create({
        data: {
          webhookId,
          event,
          payload: JSON.parse(payload),
          responseStatus,
          responseBody,
          success,
          errorMessage,
        },
      });
    } catch (error) {
      logger.error('Failed to log webhook delivery:', error);
    }
  }

  private async updateWebhookStatus(webhookId: string, deliveredAt: Date, status: string, failureCount: number) {
    await prisma.webhook.update({
      where: { id: webhookId },
      data: {
        lastDeliveryAt: deliveredAt,
        lastDeliveryStatus: status,
        failureCount,
      },
    });
  }

  private async handleDeliveryFailure(webhookId: string) {
    const webhook = await prisma.webhook.findUnique({
      where: { id: webhookId },
    });

    if (!webhook) return;

    const newFailureCount = webhook.failureCount + 1;

    // Disable webhook after 5 consecutive failures
    if (newFailureCount >= 5) {
      await prisma.webhook.update({
        where: { id: webhookId },
        data: {
          isActive: false,
          failureCount: newFailureCount,
        },
      });
      logger.warn(`Webhook ${webhookId} disabled after ${newFailureCount} consecutive failures`);
    } else {
      await prisma.webhook.update({
        where: { id: webhookId },
        data: {
          failureCount: newFailureCount,
        },
      });
    }
  }

  async getWebhookDeliveries(webhookId: string, userId: string, limit: number = 50) {
    const webhook = await prisma.webhook.findFirst({
      where: { id: webhookId, userId },
    });

    if (!webhook) {
      throw new Error('Webhook not found');
    }

    return await prisma.webhookDelivery.findMany({
      where: { webhookId },
      orderBy: { deliveredAt: 'desc' },
      take: limit,
    });
  }

  async regenerateSecret(userId: string, webhookId: string): Promise<string> {
    const webhook = await prisma.webhook.findFirst({
      where: { id: webhookId, userId },
    });

    if (!webhook) {
      throw new Error('Webhook not found');
    }

    const newSecret = crypto.randomBytes(32).toString('hex');

    await prisma.webhook.update({
      where: { id: webhookId },
      data: {
        secret: newSecret,
        updatedAt: new Date(),
      },
    });

    return newSecret;
  }
}

export const webhookService = new WebhookService();

// Event types
export const WebhookEvents = {
  ERROR_CREATED: 'error.created',
  ERROR_UPDATED: 'error.updated',
  SOLUTION_CREATED: 'solution.created',
  SOLUTION_VERIFIED: 'solution.verified',
  SOLUTION_UPVOTED: 'solution.upvoted',
  USER_REGISTERED: 'user.registered',
  CATEGORY_CREATED: 'category.created',
  APPLICATION_CREATED: 'application.created',
} as const;
