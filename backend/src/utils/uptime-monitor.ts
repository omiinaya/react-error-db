import { logger } from './logger';

export interface UptimeMetrics {
  startTime: Date;
  totalUptime: number;
  lastRestart: Date;
  restarts: number;
  requestCount: number;
  errorCount: number;
  averageResponseTime: number;
  memoryUsage: NodeJS.MemoryUsage;
}

export interface UptimeAlert {
  type: 'high_memory' | 'high_cpu' | 'frequent_restarts' | 'high_error_rate';
  message: string;
  severity: 'warning' | 'critical';
  timestamp: Date;
  data: any;
}

export class UptimeMonitor {
  private startTime: Date;
  private lastRestart: Date;
  private restarts: number = 0;
  private requestCount: number = 0;
  private errorCount: number = 0;
  private responseTimes: number[] = [];
  private alerts: UptimeAlert[] = [];
  private readonly memoryThreshold = 0.8; // 80% memory usage
  private readonly errorRateThreshold = 0.1; // 10% error rate
  private readonly restartThreshold = 3; // 3 restarts per hour

  constructor() {
    this.startTime = new Date();
    this.lastRestart = new Date();
    this.startMonitoring();
  }

  /**
   * Start monitoring system metrics
   */
  private startMonitoring(): void {
    // Monitor memory usage every 30 seconds
    setInterval(() => this.checkMemoryUsage(), 30000);
    
    // Monitor error rates every minute
    setInterval(() => this.checkErrorRate(), 60000);
    
    // Monitor restarts every hour
    setInterval(() => this.checkRestarts(), 3600000);
    
    logger.info('Uptime monitoring started');
  }

  /**
   * Record a successful request
   */
  recordRequest(responseTime: number): void {
    this.requestCount++;
    this.responseTimes.push(responseTime);
    
    // Keep only the last 1000 response times for average calculation
    if (this.responseTimes.length > 1000) {
      this.responseTimes.shift();
    }
  }

  /**
   * Record an error
   */
  recordError(): void {
    this.errorCount++;
  }

  /**
   * Record application restart
   */
  recordRestart(): void {
    this.restarts++;
    this.lastRestart = new Date();
  }

  /**
   * Check memory usage and trigger alerts if necessary
   */
  private checkMemoryUsage(): void {
    const memoryUsage = process.memoryUsage();
    const usedMemory = memoryUsage.heapUsed / memoryUsage.heapTotal;
    
    if (usedMemory > this.memoryThreshold) {
      const alert: UptimeAlert = {
        type: 'high_memory',
        message: `High memory usage detected: ${(usedMemory * 100).toFixed(2)}%`,
        severity: usedMemory > 0.9 ? 'critical' : 'warning',
        timestamp: new Date(),
        data: { memoryUsage, usedMemory: usedMemory * 100 }
      };
      
      this.addAlert(alert);
    }
  }

  /**
   * Check error rate and trigger alerts if necessary
   */
  private checkErrorRate(): void {
    if (this.requestCount === 0) return;
    
    const errorRate = this.errorCount / this.requestCount;
    
    if (errorRate > this.errorRateThreshold) {
      const alert: UptimeAlert = {
        type: 'high_error_rate',
        message: `High error rate detected: ${(errorRate * 100).toFixed(2)}%`,
        severity: errorRate > 0.2 ? 'critical' : 'warning',
        timestamp: new Date(),
        data: { errorRate: errorRate * 100, requestCount: this.requestCount, errorCount: this.errorCount }
      };
      
      this.addAlert(alert);
    }
    
    // Reset counters for next period
    this.requestCount = 0;
    this.errorCount = 0;
  }

  /**
   * Check restart frequency and trigger alerts if necessary
   */
  private checkRestarts(): void {
    if (this.restarts > this.restartThreshold) {
      const alert: UptimeAlert = {
        type: 'frequent_restarts',
        message: `Frequent restarts detected: ${this.restarts} restarts in the last hour`,
        severity: 'critical',
        timestamp: new Date(),
        data: { restarts: this.restarts, threshold: this.restartThreshold }
      };
      
      this.addAlert(alert);
    }
    
    // Reset restart counter for next period
    this.restarts = 0;
  }

  /**
   * Add alert to the alert history
   */
  private addAlert(alert: UptimeAlert): void {
    this.alerts.push(alert);
    
    // Keep only the last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts.shift();
    }
    
    logger.warn(`Uptime alert: ${alert.message}`, alert.data);
  }

  /**
   * Get current uptime metrics
   */
  getMetrics(): UptimeMetrics {
    const memoryUsage = process.memoryUsage();
    const averageResponseTime = this.responseTimes.length > 0 
      ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length 
      : 0;

    return {
      startTime: this.startTime,
      totalUptime: process.uptime(),
      lastRestart: this.lastRestart,
      restarts: this.restarts,
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      averageResponseTime,
      memoryUsage,
    };
  }

  /**
   * Get recent alerts
   */
  getAlerts(limit: number = 10): UptimeAlert[] {
    return this.alerts.slice(-limit).reverse();
  }

  /**
   * Get current system status
   */
  getStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    message: string;
    metrics: UptimeMetrics;
  } {
    const metrics = this.getMetrics();
    const memoryUsage = metrics.memoryUsage.heapUsed / metrics.memoryUsage.heapTotal;
    const errorRate = metrics.requestCount > 0 ? metrics.errorCount / metrics.requestCount : 0;

    if (memoryUsage > 0.9 || errorRate > 0.2 || this.restarts > this.restartThreshold) {
      return {
        status: 'unhealthy',
        message: 'System is unhealthy - critical issues detected',
        metrics,
      };
    } else if (memoryUsage > 0.8 || errorRate > 0.1) {
      return {
        status: 'degraded',
        message: 'System performance is degraded',
        metrics,
      };
    } else {
      return {
        status: 'healthy',
        message: 'System is healthy',
        metrics,
      };
    }
  }

  /**
   * Reset all metrics (for testing purposes)
   */
  reset(): void {
    this.startTime = new Date();
    this.lastRestart = new Date();
    this.restarts = 0;
    this.requestCount = 0;
    this.errorCount = 0;
    this.responseTimes = [];
    this.alerts = [];
  }
}

// Global uptime monitor instance
export const uptimeMonitor = new UptimeMonitor();

// Middleware to track request metrics
export const uptimeMiddleware = (_req: any, res: any, next: any) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    uptimeMonitor.recordRequest(responseTime);
    
    if (res.statusCode >= 400) {
      uptimeMonitor.recordError();
    }
  });
  
  next();
};

// Export for use in other modules
export default {
  UptimeMonitor,
  uptimeMonitor,
  uptimeMiddleware,
};