import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Environment variables schema
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),
  
  // Redis
  REDIS_URL: z.string().url().optional(),
  
  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  
  // Server
  PORT: z.string().transform(Number).default('3010'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // CORS
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  
  // Rate limiting
  RATE_LIMIT_MAX: z.string().transform(Number).default('1000'),

  // Database connection pool settings
  DATABASE_POOL_MIN: z.string().transform(Number).default('2'),
  DATABASE_POOL_MAX: z.string().transform(Number).default('10'),
  DATABASE_CONNECTION_TIMEOUT: z.string().transform(Number).default('60000'),
  DATABASE_IDLE_TIMEOUT: z.string().transform(Number).default('10000'),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  // Sentry
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ENVIRONMENT: z.string().default('development'),
});

// Validate environment variables
const env = envSchema.safeParse(process.env);

if (!env.success) {
  console.error('❌ Invalid environment variables:', env.error.format());
  process.exit(1);
}

// Export validated configuration
export const config = {
  database: {
    url: env.data.DATABASE_URL,
    poolMin: env.data.DATABASE_POOL_MIN,
    poolMax: env.data.DATABASE_POOL_MAX,
    connectionTimeout: env.data.DATABASE_CONNECTION_TIMEOUT,
    idleTimeout: env.data.DATABASE_IDLE_TIMEOUT,
  },
  redis: {
    url: env.data.REDIS_URL,
  },
  jwt: {
    secret: env.data.JWT_SECRET,
    refreshSecret: env.data.JWT_REFRESH_SECRET,
  },
  port: env.data.PORT,
  nodeEnv: env.data.NODE_ENV,
  frontendUrl: env.data.FRONTEND_URL,
  rateLimit: {
    max: env.data.RATE_LIMIT_MAX,
  },
  logLevel: env.data.LOG_LEVEL,
  sentry: {
    dsn: env.data.SENTRY_DSN,
    environment: env.data.SENTRY_ENVIRONMENT,
  },
};

export type Config = typeof config;