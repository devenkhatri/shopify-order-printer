/**
 * Production monitoring and logging configuration
 * Handles error tracking, performance monitoring, and health checks
 */

import { NextRequest, NextResponse } from 'next/server';

// Types for monitoring
interface ErrorLog {
  timestamp: string;
  level: 'error' | 'warn' | 'info';
  message: string;
  stack?: string;
  context?: Record<string, any>;
  shop?: string;
  userId?: string;
}

interface PerformanceMetric {
  timestamp: string;
  endpoint: string;
  method: string;
  duration: number;
  statusCode: number;
  shop?: string;
}

interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  checks: {
    database: boolean;
    shopifyApi: boolean;
    fileSystem: boolean;
    memory: boolean;
  };
  uptime: number;
  version: string;
}

class ProductionMonitor {
  private static instance: ProductionMonitor;
  private startTime: number;

  private constructor() {
    this.startTime = Date.now();
  }

  public static getInstance(): ProductionMonitor {
    if (!ProductionMonitor.instance) {
      ProductionMonitor.instance = new ProductionMonitor();
    }
    return ProductionMonitor.instance;
  }

  /**
   * Log error with context
   */
  public logError(error: Error, context?: Record<string, any>): void {
    const errorLog: ErrorLog = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message: error.message,
      stack: error.stack,
      context,
      shop: context?.shop,
      userId: context?.userId,
    };

    // Log to console in production (will be captured by hosting platform)
    console.error('Production Error:', JSON.stringify(errorLog, null, 2));

    // Send to external monitoring service if configured
    this.sendToMonitoringService(errorLog);
  }

  /**
   * Log warning with context
   */
  public logWarning(message: string, context?: Record<string, any>): void {
    const warningLog: ErrorLog = {
      timestamp: new Date().toISOString(),
      level: 'warn',
      message,
      context,
      shop: context?.shop,
      userId: context?.userId,
    };

    console.warn('Production Warning:', JSON.stringify(warningLog, null, 2));
    this.sendToMonitoringService(warningLog);
  }

  /**
   * Log info with context
   */
  public logInfo(message: string, context?: Record<string, any>): void {
    if (process.env.LOG_LEVEL === 'info') {
      const infoLog: ErrorLog = {
        timestamp: new Date().toISOString(),
        level: 'info',
        message,
        context,
        shop: context?.shop,
        userId: context?.userId,
      };

      console.info('Production Info:', JSON.stringify(infoLog, null, 2));
    }
  }

  /**
   * Track performance metrics
   */
  public trackPerformance(
    endpoint: string,
    method: string,
    duration: number,
    statusCode: number,
    shop?: string
  ): void {
    const metric: PerformanceMetric = {
      timestamp: new Date().toISOString(),
      endpoint,
      method,
      duration,
      statusCode,
      shop,
    };

    // Log slow requests
    if (duration > 5000) {
      console.warn('Slow Request:', JSON.stringify(metric, null, 2));
    }

    // Send to monitoring service
    this.sendMetricToMonitoringService(metric);
  }

  /**
   * Perform health check
   */
  public async performHealthCheck(): Promise<HealthCheckResult> {
    const checks = {
      database: await this.checkDatabase(),
      shopifyApi: await this.checkShopifyApi(),
      fileSystem: await this.checkFileSystem(),
      memory: this.checkMemoryUsage(),
    };

    const result: HealthCheckResult = {
      status: Object.values(checks).every(check => check) ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks,
      uptime: Date.now() - this.startTime,
      version: process.env.npm_package_version || '1.0.0',
    };

    if (result.status === 'unhealthy') {
      this.logError(new Error('Health check failed'), { checks });
    }

    return result;
  }

  /**
   * Check database connectivity
   */
  private async checkDatabase(): Promise<boolean> {
    try {
      // Simple database connectivity check
      // This would depend on your database implementation
      return true;
    } catch (error) {
      this.logError(error as Error, { check: 'database' });
      return false;
    }
  }

  /**
   * Check Shopify API connectivity
   */
  private async checkShopifyApi(): Promise<boolean> {
    try {
      // Simple API connectivity check
      const response = await fetch('https://shopify.dev/api/admin-rest', {
        method: 'HEAD',
        timeout: 5000,
      } as any);
      return response.ok;
    } catch (error) {
      this.logError(error as Error, { check: 'shopifyApi' });
      return false;
    }
  }

  /**
   * Check file system access
   */
  private async checkFileSystem(): Promise<boolean> {
    try {
      const fs = await import('fs/promises');
      await fs.access('./uploads');
      return true;
    } catch (error) {
      this.logError(error as Error, { check: 'fileSystem' });
      return false;
    }
  }

  /**
   * Check memory usage
   */
  private checkMemoryUsage(): boolean {
    const memUsage = process.memoryUsage();
    const maxMemory = 512 * 1024 * 1024; // 512MB limit
    
    if (memUsage.heapUsed > maxMemory) {
      this.logWarning('High memory usage detected', {
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        maxMemory,
      });
      return false;
    }
    
    return true;
  }

  /**
   * Send error/warning to external monitoring service
   */
  private sendToMonitoringService(log: ErrorLog): void {
    // Implement integration with monitoring services like Sentry, DataDog, etc.
    if (process.env.SENTRY_DSN) {
      // Send to Sentry
      // This would require Sentry SDK integration
    }

    if (process.env.WEBHOOK_MONITORING_URL) {
      // Send to webhook monitoring service
      fetch(process.env.WEBHOOK_MONITORING_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log),
      }).catch(error => {
        console.error('Failed to send log to monitoring service:', error);
      });
    }
  }

  /**
   * Send performance metric to monitoring service
   */
  private sendMetricToMonitoringService(metric: PerformanceMetric): void {
    if (process.env.METRICS_WEBHOOK_URL) {
      fetch(process.env.METRICS_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metric),
      }).catch(error => {
        console.error('Failed to send metric to monitoring service:', error);
      });
    }
  }
}

/**
 * Middleware for request monitoring
 */
export function withMonitoring(handler: Function) {
  return async (req: NextRequest, ...args: any[]) => {
    const monitor = ProductionMonitor.getInstance();
    const startTime = Date.now();
    
    try {
      const response = await handler(req, ...args);
      const duration = Date.now() - startTime;
      
      monitor.trackPerformance(
        req.nextUrl.pathname,
        req.method,
        duration,
        response.status || 200,
        req.headers.get('x-shopify-shop-domain') || undefined
      );
      
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      monitor.logError(error as Error, {
        endpoint: req.nextUrl.pathname,
        method: req.method,
        shop: req.headers.get('x-shopify-shop-domain'),
        duration,
      });
      
      monitor.trackPerformance(
        req.nextUrl.pathname,
        req.method,
        duration,
        500,
        req.headers.get('x-shopify-shop-domain') || undefined
      );
      
      throw error;
    }
  };
}

/**
 * Health check endpoint handler
 */
export async function healthCheckHandler(): Promise<NextResponse> {
  const monitor = ProductionMonitor.getInstance();
  const healthCheck = await monitor.performHealthCheck();
  
  return NextResponse.json(healthCheck, {
    status: healthCheck.status === 'healthy' ? 200 : 503,
  });
}

// Export singleton instance
export const monitor = ProductionMonitor.getInstance();

// Export types
export type { ErrorLog, PerformanceMetric, HealthCheckResult };