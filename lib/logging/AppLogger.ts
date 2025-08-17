/**
 * Comprehensive logging system for Shopify Order Printer app
 * Provides structured logging with different levels and contexts
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  shop?: string;
  userId?: string;
  requestId?: string;
  stack?: string;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  enableRemote: boolean;
  remoteEndpoint?: string;
  maxLogSize: number;
  rotateInterval: number;
}

class AppLogger {
  private static instance: AppLogger;
  private config: LoggerConfig;
  private logBuffer: LogEntry[] = [];
  private readonly maxBufferSize = 1000;

  private constructor() {
    this.config = {
      level: this.getLogLevelFromEnv(),
      enableConsole: true,
      enableFile: process.env.NODE_ENV === 'production',
      enableRemote: !!process.env.REMOTE_LOGGING_ENDPOINT,
      remoteEndpoint: process.env.REMOTE_LOGGING_ENDPOINT,
      maxLogSize: 10 * 1024 * 1024, // 10MB
      rotateInterval: 24 * 60 * 60 * 1000, // 24 hours
    };

    // Set up periodic log flushing
    if (typeof window === 'undefined') {
      setInterval(() => this.flushLogs(), 30000); // Flush every 30 seconds
    }
  }

  public static getInstance(): AppLogger {
    if (!AppLogger.instance) {
      AppLogger.instance = new AppLogger();
    }
    return AppLogger.instance;
  }

  private getLogLevelFromEnv(): LogLevel {
    const level = process.env.LOG_LEVEL?.toLowerCase();
    switch (level) {
      case 'error':
        return LogLevel.ERROR;
      case 'warn':
        return LogLevel.WARN;
      case 'info':
        return LogLevel.INFO;
      case 'debug':
        return LogLevel.DEBUG;
      default:
        return process.env.NODE_ENV === 'production' ? LogLevel.WARN : LogLevel.INFO;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.config.level;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      shop: context?.shop,
      userId: context?.userId,
      requestId: context?.requestId,
      stack: error?.stack,
    };
  }

  private formatLogEntry(entry: LogEntry): string {
    const levelName = LogLevel[entry.level];
    const contextStr = entry.context ? ` | Context: ${JSON.stringify(entry.context)}` : '';
    const shopStr = entry.shop ? ` | Shop: ${entry.shop}` : '';
    const userStr = entry.userId ? ` | User: ${entry.userId}` : '';
    const requestStr = entry.requestId ? ` | Request: ${entry.requestId}` : '';
    
    return `[${entry.timestamp}] ${levelName}: ${entry.message}${shopStr}${userStr}${requestStr}${contextStr}`;
  }

  private async writeLog(entry: LogEntry): Promise<void> {
    // Add to buffer
    this.logBuffer.push(entry);
    
    // Prevent buffer overflow
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer = this.logBuffer.slice(-this.maxBufferSize / 2);
    }

    // Console logging
    if (this.config.enableConsole) {
      const formatted = this.formatLogEntry(entry);
      switch (entry.level) {
        case LogLevel.ERROR:
          console.error(formatted);
          if (entry.stack) console.error(entry.stack);
          break;
        case LogLevel.WARN:
          console.warn(formatted);
          break;
        case LogLevel.INFO:
          console.info(formatted);
          break;
        case LogLevel.DEBUG:
          console.debug(formatted);
          break;
      }
    }

    // File logging (server-side only)
    if (this.config.enableFile && typeof window === 'undefined') {
      try {
        const fs = await import('fs/promises');
        const path = await import('path');
        
        const logDir = path.join(process.cwd(), 'logs');
        const logFile = path.join(logDir, `app-${new Date().toISOString().split('T')[0]}.log`);
        
        // Ensure log directory exists
        try {
          await fs.access(logDir);
        } catch {
          await fs.mkdir(logDir, { recursive: true });
        }
        
        const logLine = this.formatLogEntry(entry) + '\n';
        await fs.appendFile(logFile, logLine);
      } catch (error) {
        console.error('Failed to write to log file:', error);
      }
    }

    // Remote logging
    if (this.config.enableRemote && this.config.remoteEndpoint) {
      try {
        await fetch(this.config.remoteEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(entry),
        });
      } catch (error) {
        console.error('Failed to send log to remote endpoint:', error);
      }
    }
  }

  private async flushLogs(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    // Send buffered logs to remote endpoint if configured
    if (this.config.enableRemote && this.config.remoteEndpoint) {
      try {
        await fetch(`${this.config.remoteEndpoint}/batch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ logs: this.logBuffer }),
        });
        
        // Clear buffer after successful send
        this.logBuffer = [];
      } catch (error) {
        console.error('Failed to flush logs to remote endpoint:', error);
      }
    }
  }

  public error(message: string, context?: Record<string, any>, error?: Error): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    
    const entry = this.createLogEntry(LogLevel.ERROR, message, context, error);
    this.writeLog(entry);
  }

  public warn(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    
    const entry = this.createLogEntry(LogLevel.WARN, message, context);
    this.writeLog(entry);
  }

  public info(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    const entry = this.createLogEntry(LogLevel.INFO, message, context);
    this.writeLog(entry);
  }

  public debug(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    
    const entry = this.createLogEntry(LogLevel.DEBUG, message, context);
    this.writeLog(entry);
  }

  public logApiRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    context?: Record<string, any>
  ): void {
    const message = `API ${method} ${url} - ${statusCode} (${duration}ms)`;
    const logContext = {
      ...context,
      method,
      url,
      statusCode,
      duration,
      type: 'api_request',
    };

    if (statusCode >= 500) {
      this.error(message, logContext);
    } else if (statusCode >= 400) {
      this.warn(message, logContext);
    } else if (duration > 5000) {
      this.warn(`Slow API request: ${message}`, logContext);
    } else {
      this.info(message, logContext);
    }
  }

  public logShopifyWebhook(
    topic: string,
    shop: string,
    success: boolean,
    processingTime: number,
    context?: Record<string, any>
  ): void {
    const message = `Shopify webhook ${topic} from ${shop} - ${success ? 'SUCCESS' : 'FAILED'} (${processingTime}ms)`;
    const logContext = {
      ...context,
      topic,
      shop,
      success,
      processingTime,
      type: 'shopify_webhook',
    };

    if (success) {
      this.info(message, logContext);
    } else {
      this.error(message, logContext);
    }
  }

  public logUserAction(
    action: string,
    userId: string,
    shop: string,
    context?: Record<string, any>
  ): void {
    const message = `User action: ${action}`;
    const logContext = {
      ...context,
      action,
      userId,
      shop,
      type: 'user_action',
    };

    this.info(message, logContext);
  }

  public logBusinessMetric(
    metric: string,
    value: number,
    shop: string,
    context?: Record<string, any>
  ): void {
    const message = `Business metric: ${metric} = ${value}`;
    const logContext = {
      ...context,
      metric,
      value,
      shop,
      type: 'business_metric',
    };

    this.info(message, logContext);
  }

  public getRecentLogs(count: number = 100): LogEntry[] {
    return this.logBuffer.slice(-count);
  }

  public getLogsByLevel(level: LogLevel, count: number = 100): LogEntry[] {
    return this.logBuffer
      .filter(entry => entry.level === level)
      .slice(-count);
  }

  public getLogsByShop(shop: string, count: number = 100): LogEntry[] {
    return this.logBuffer
      .filter(entry => entry.shop === shop)
      .slice(-count);
  }

  public clearLogs(): void {
    this.logBuffer = [];
  }

  public updateConfig(newConfig: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public getConfig(): LoggerConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const logger = AppLogger.getInstance();

// Export convenience functions
export const logError = (message: string, context?: Record<string, any>, error?: Error) => 
  logger.error(message, context, error);

export const logWarn = (message: string, context?: Record<string, any>) => 
  logger.warn(message, context);

export const logInfo = (message: string, context?: Record<string, any>) => 
  logger.info(message, context);

export const logDebug = (message: string, context?: Record<string, any>) => 
  logger.debug(message, context);

// Export types
export type { LogEntry, LoggerConfig };