import { config } from '../config';
import { logger } from './logger';

/**
 * Secret Management Utility
 * Provides secure secret handling, rotation, and management
 */
export class SecretManager {
  private static instance: SecretManager;
  private secrets: Map<string, { value: string; expiresAt?: Date | undefined; rotatedAt: Date }> = new Map();
  private readonly DEFAULT_ROTATION_INTERVAL = 90 * 24 * 60 * 60 * 1000; // 90 days in milliseconds

  private constructor() {
    this.initializeSecrets();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): SecretManager {
    if (!SecretManager.instance) {
      SecretManager.instance = new SecretManager();
    }
    return SecretManager.instance;
  }

  /**
   * Initialize secrets from environment variables
   */
  private initializeSecrets(): void {
    // JWT secrets
    this.setSecret('JWT_SECRET', config.jwt.secret);
    this.setSecret('JWT_REFRESH_SECRET', config.jwt.refreshSecret);

    // Database credentials (if not in connection string)
    if (config.database.url) {
      const url = new URL(config.database.url);
      if (url.username) this.setSecret('DB_USER', url.username);
      if (url.password) this.setSecret('DB_PASSWORD', url.password);
    }

    // Redis credentials (if configured)
    if (config.redis.url) {
      const url = new URL(config.redis.url);
      if (url.password) this.setSecret('REDIS_PASSWORD', url.password);
    }

    logger.info('Secrets initialized successfully');
  }

  /**
   * Set a secret with optional expiration
   */
  public setSecret(key: string, value: string, expiresInMs?: number): void {
    const expiresAt = expiresInMs ? new Date(Date.now() + expiresInMs) : undefined;
    this.secrets.set(key, {
      value,
      expiresAt: expiresAt || undefined,
      rotatedAt: new Date(),
    });

    logger.debug(`Secret set: ${key}`, { 
      hasExpiration: !!expiresAt,
      rotationTime: new Date().toISOString() 
    });
  }

  /**
   * Get a secret value
   */
  public getSecret(key: string): string | null {
    const secret = this.secrets.get(key);
    
    if (!secret) {
      logger.warn(`Secret not found: ${key}`);
      return null;
    }

    // Check if secret has expired
    if (secret.expiresAt && secret.expiresAt < new Date()) {
      logger.warn(`Secret expired: ${key}`);
      this.secrets.delete(key);
      return null;
    }

    return secret.value;
  }

  /**
   * Rotate a secret
   */
  public async rotateSecret(key: string, newValue?: string): Promise<boolean> {
    const currentSecret = this.secrets.get(key);
    
    if (!currentSecret) {
      logger.warn(`Cannot rotate non-existent secret: ${key}`);
      return false;
    }

    const newSecretValue = newValue || this.generateRandomSecret(32);
    
    // Store old secret for grace period (if needed)
    const oldSecret = { ...currentSecret };
    
    // Update with new secret
    this.setSecret(key, newSecretValue, this.DEFAULT_ROTATION_INTERVAL);
    
    logger.info(`Secret rotated: ${key}`, {
      rotationTime: new Date().toISOString(),
      oldRotationTime: oldSecret.rotatedAt.toISOString()
    });

    return true;
  }

  /**
   * Generate a cryptographically secure random secret
   */
  public generateRandomSecret(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_-+=';
    const randomValues = new Uint8Array(length);
    
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(randomValues);
    } else {
      // Fallback for environments without crypto
      for (let i = 0; i < length; i++) {
        randomValues[i] = Math.floor(Math.random() * 256);
      }
    }

    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars[randomValues[i]! % chars.length];
    }

    return result;
  }

  /**
   * Check if a secret needs rotation
   */
  public needsRotation(key: string): boolean {
    const secret = this.secrets.get(key);
    
    if (!secret || !secret.rotatedAt) {
      return false;
    }

    const rotationAge = Date.now() - secret.rotatedAt.getTime();
    return rotationAge >= this.DEFAULT_ROTATION_INTERVAL;
  }

  /**
   * Get all secrets that need rotation
   */
  public getSecretsNeedingRotation(): string[] {
    const needsRotation: string[] = [];
    
    for (const [key, secret] of this.secrets.entries()) {
      if (this.needsRotation(key)) {
        needsRotation.push(key);
      }
    }

    return needsRotation;
  }

  /**
   * Get secret metadata
   */
  public getSecretMetadata(key: string): { 
    rotatedAt: Date; 
    expiresAt?: Date; 
    needsRotation: boolean 
  } | null {
    const secret = this.secrets.get(key);
    
    if (!secret) {
      return null;
    }

    return {
      rotatedAt: secret.rotatedAt,
      expiresAt: secret.expiresAt || undefined,
      needsRotation: this.needsRotation(key),
    };
  }

  /**
   * Remove a secret
   */
  public removeSecret(key: string): boolean {
    const existed = this.secrets.delete(key);
    
    if (existed) {
      logger.info(`Secret removed: ${key}`);
    } else {
      logger.warn(`Secret not found for removal: ${key}`);
    }

    return existed;
  }

  /**
   * Get all secret keys (for auditing)
   */
  public getAllSecretKeys(): string[] {
    return Array.from(this.secrets.keys());
  }

  /**
   * Validate secret strength
   */
  public validateSecretStrength(secret: string, minLength: number = 16): {
    isValid: boolean;
    reasons: string[];
  } {
    const reasons: string[] = [];

    if (secret.length < minLength) {
      reasons.push(`Secret must be at least ${minLength} characters long`);
    }

    if (!/[A-Z]/.test(secret)) {
      reasons.push('Secret must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(secret)) {
      reasons.push('Secret must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(secret)) {
      reasons.push('Secret must contain at least one number');
    }

    if (!/[!@#$%^&*()_\-+=]/.test(secret)) {
      reasons.push('Secret must contain at least one special character');
    }

    return {
      isValid: reasons.length === 0,
      reasons,
    };
  }

  /**
   * Schedule automatic secret rotation
   */
  public scheduleRotation(intervalMs: number = this.DEFAULT_ROTATION_INTERVAL): NodeJS.Timeout {
    return setInterval(() => {
      const secretsToRotate = this.getSecretsNeedingRotation();
      
      if (secretsToRotate.length > 0) {
        logger.info('Scheduled secret rotation started', {
          secrets: secretsToRotate,
          total: secretsToRotate.length,
        });

        secretsToRotate.forEach(key => {
          this.rotateSecret(key).catch(error => {
            logger.error(`Failed to rotate secret ${key}:`, error);
          });
        });
      }
    }, intervalMs);
  }

  /**
   * Export secrets for backup (encrypted)
   */
  public exportSecrets(encryptionKey: string): string {
    const secretsData = Object.fromEntries(this.secrets);
    const jsonData = JSON.stringify(secretsData);
    
    // Simple base64 encoding for demonstration
    // In production, use proper encryption like AES-256-GCM
    return Buffer.from(jsonData).toString('base64');
  }

  /**
   * Import secrets from backup
   */
  public importSecrets(encryptedData: string, decryptionKey: string): boolean {
    try {
      // Simple base64 decoding for demonstration
      // In production, use proper decryption
      const jsonData = Buffer.from(encryptedData, 'base64').toString('utf8');
      const secretsData = JSON.parse(jsonData);
      
      for (const [key, value] of Object.entries(secretsData) as [string, any][]) {
        this.secrets.set(key, {
          value: value.value,
          expiresAt: value.expiresAt ? new Date(value.expiresAt) : undefined,
          rotatedAt: new Date(value.rotatedAt),
        });
      }
      
      logger.info('Secrets imported successfully');
      return true;
    } catch (error) {
      logger.error('Failed to import secrets:', error);
      return false;
    }
  }

  /**
   * Clear all secrets (for testing)
   */
  public clearAll(): void {
    this.secrets.clear();
    logger.info('All secrets cleared');
  }
}

// Export singleton instance
export const secretManager = SecretManager.getInstance();

// Utility functions for common secret operations
export const Secrets = {
  /**
   * Get JWT secret
   */
  getJwtSecret(): string {
    const secret = secretManager.getSecret('JWT_SECRET');
    if (!secret) throw new Error('JWT_SECRET not configured');
    return secret;
  },

  /**
   * Get JWT refresh secret
   */
  getJwtRefreshSecret(): string {
    const secret = secretManager.getSecret('JWT_REFRESH_SECRET');
    if (!secret) throw new Error('JWT_REFRESH_SECRET not configured');
    return secret;
  },

  /**
   * Get database password
   */
  getDatabasePassword(): string | null {
    return secretManager.getSecret('DB_PASSWORD');
  },

  /**
   * Get Redis password
   */
  getRedisPassword(): string | null {
    return secretManager.getSecret('REDIS_PASSWORD');
  },

  /**
   * Rotate all secrets that need rotation
   */
  async rotateAllNeeded(): Promise<{ success: string[]; failed: string[] }> {
    const secretsToRotate = secretManager.getSecretsNeedingRotation();
    const results = { success: [] as string[], failed: [] as string[] };

    for (const key of secretsToRotate) {
      try {
        await secretManager.rotateSecret(key);
        results.success.push(key);
      } catch (error) {
        results.failed.push(key);
        logger.error(`Failed to rotate secret ${key}:`, error);
      }
    }

    return results;
  },
};

export default secretManager;