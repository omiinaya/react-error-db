import { createLogger, format, transports } from 'winston';
import 'winston-daily-rotate-file';
import { config } from '../config';

const { combine, timestamp, printf, colorize, errors } = format;

// JSON log format for structured logging
const jsonFormat = printf(({ level, message, timestamp, ...metadata }) => {
  return JSON.stringify({
    timestamp,
    level,
    message,
    ...metadata,
    environment: config.nodeEnv,
    service: 'error-database-backend',
  });
});

// Human-readable format
const humanFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

// Create structured logger for log aggregation
export const structuredLogger = createLogger({
  level: config.logLevel,
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    jsonFormat
  ),
  transports: [
    // Console transport (human-readable in development)
    new transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        humanFormat
      ),
    }),
    // JSON file transport for log aggregation
    new transports.DailyRotateFile({
      filename: 'logs/structured-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d',
      format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        jsonFormat
      ),
    }),
    // Error-specific JSON logs
    new transports.DailyRotateFile({
      filename: 'logs/error-structured-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d',
      level: 'error',
      format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        jsonFormat
      ),
    }),
  ],
  exceptionHandlers: [
    new transports.DailyRotateFile({
      filename: 'logs/exceptions-structured-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d',
      format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        jsonFormat
      ),
    }),
  ],
  rejectionHandlers: [
    new transports.DailyRotateFile({
      filename: 'logs/rejections-structured-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d',
      format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        jsonFormat
      ),
    }),
  ],
});

// Log aggregation transport for external services
export interface LogAggregationTransport {
  sendLog: (log: any) => Promise<void>;
  flush: () => Promise<void>;
}

// Example: Elasticsearch transport (placeholder implementation)
class ElasticsearchTransport implements LogAggregationTransport {
  private buffer: any[] = [];
  private readonly maxBufferSize = 100;
  private readonly flushInterval = 5000; // 5 seconds
  private intervalId: NodeJS.Timeout | null = null;

  constructor(private readonly endpoint: string) {
    this.startFlushInterval();
  }

  async sendLog(log: any): Promise<void> {
    this.buffer.push(log);
    
    if (this.buffer.length >= this.maxBufferSize) {
      await this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const logsToSend = [...this.buffer];
    this.buffer = [];

    try {
      // In a real implementation, this would send logs to Elasticsearch
      console.log(`[Elasticsearch] Would send ${logsToSend.length} logs to ${this.endpoint}`);
      // await fetch(this.endpoint, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(logsToSend),
      // });
    } catch (error) {
      console.error('Failed to send logs to Elasticsearch:', error);
    }
  }

  private startFlushInterval(): void {
    this.intervalId = setInterval(() => {
      this.flush().catch(console.error);
    }, this.flushInterval);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.flush().catch(console.error);
  }
}

// Example: Loki transport (placeholder implementation)
class LokiTransport implements LogAggregationTransport {
  constructor(private readonly endpoint: string) {}

  async sendLog(_log: any): Promise<void> {
    try {
      // In a real implementation, this would send logs to Loki
      console.log(`[Loki] Would send log to ${this.endpoint}`);
      // await fetch(this.endpoint, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     streams: [{
      //       stream: { service: 'error-database-backend', environment: config.nodeEnv },
      //       values: [[Date.now().toString(), JSON.stringify(log)]]
      //     }]
      //   }),
      // });
    } catch (error) {
      console.error('Failed to send logs to Loki:', error);
    }
  }

  async flush(): Promise<void> {
    // Loki typically doesn't require batching for individual logs
  }
}

// Centralized log aggregation manager
export class LogAggregationManager {
  private transports: LogAggregationTransport[] = [];

  constructor() {
    this.initializeTransports();
  }

  private initializeTransports(): void {
    // Initialize based on environment variables
    if (process.env.ELASTICSEARCH_URL) {
      this.transports.push(new ElasticsearchTransport(process.env.ELASTICSEARCH_URL));
    }

    if (process.env.LOKI_URL) {
      this.transports.push(new LokiTransport(process.env.LOKI_URL));
    }

    // Add more transports as needed (Datadog, Splunk, etc.)
  }

  async sendLog(log: any): Promise<void> {
    const promises = this.transports.map(transport => 
      transport.sendLog(log).catch(error => {
        console.error('Failed to send log to transport:', error);
        console.error('Failed to send log to transport:', error);
      })
    );

    await Promise.all(promises);
  }

  async flushAll(): Promise<void> {
    const promises = this.transports.map(transport => 
      transport.flush().catch(error => {
        console.error('Failed to flush transport:', error);
        console.error('Failed to flush transport:', error);
      })
    );

    await Promise.all(promises);
  }

  addTransport(transport: LogAggregationTransport): void {
    this.transports.push(transport);
  }

  removeTransport(transport: LogAggregationTransport): void {
    const index = this.transports.indexOf(transport);
    if (index > -1) {
      this.transports.splice(index, 1);
    }
  }

  getTransportCount(): number {
    return this.transports.length;
  }
}

// Global log aggregation instance
export const logAggregation = new LogAggregationManager();

// Enhanced logger that also sends to aggregation services
export const aggregatedLogger = {
  info: (message: string, meta?: any) => {
    structuredLogger.info(message, meta);
    const logEntry = {
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...meta,
      environment: config.nodeEnv,
      service: 'error-database-backend',
    };
    logAggregation.sendLog(logEntry).catch(console.error);
  },
  
  error: (message: string, meta?: any) => {
    structuredLogger.error(message, meta);
    const logEntry = {
      level: 'error',
      message,
      timestamp: new Date().toISOString(),
      ...meta,
      environment: config.nodeEnv,
      service: 'error-database-backend',
    };
    logAggregation.sendLog(logEntry).catch(console.error);
  },
  
  warn: (message: string, meta?: any) => {
    structuredLogger.warn(message, meta);
    const logEntry = {
      level: 'warn',
      message,
      timestamp: new Date().toISOString(),
      ...meta,
      environment: config.nodeEnv,
      service: 'error-database-backend',
    };
    logAggregation.sendLog(logEntry).catch(console.error);
  },
  
  debug: (message: string, meta?: any) => {
    structuredLogger.debug(message, meta);
    const logEntry = {
      level: 'debug',
      message,
      timestamp: new Date().toISOString(),
      ...meta,
      environment: config.nodeEnv,
      service: 'error-database-backend',
    };
    logAggregation.sendLog(logEntry).catch(console.error);
  },
};

// Middleware to add request context to logs
export const addRequestContext = (req: any, _res: any, next: any) => {
  const requestId = req.headers['x-request-id'] || Math.random().toString(36).substring(7);
  
  structuredLogger.defaultMeta = {
    requestId,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  };

  next();
};

// Graceful shutdown for log aggregation
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, flushing logs...');
  await logAggregation.flushAll();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, flushing logs...');
  await logAggregation.flushAll();
  process.exit(0);
});

export default {
  structuredLogger,
  logAggregation,
  aggregatedLogger,
  addRequestContext,
  ElasticsearchTransport,
  LokiTransport,
};