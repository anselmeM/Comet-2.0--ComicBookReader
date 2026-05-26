/**
 * @file Structured JSON Logger for Production/Development.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogPayload {
  timestamp: string;
  level: LogLevel;
  message: string;
  meta?: Record<string, any>;
  error?: {
    message: string;
    stack?: string;
  };
}

class Logger {
  private formatLog(level: LogLevel, message: string, meta?: Record<string, any>, err?: Error): string {
    const payload: LogPayload = {
      timestamp: new Date().toISOString(),
      level,
      message,
    };

    if (meta) {
      payload.meta = meta;
    }

    if (err) {
      payload.error = {
        message: err.message,
        stack: err.stack,
      };
    }

    // Standard JSON output for production cloud logging (Datadog, GCP, AWS CloudWatch, Vercel)
    if (process.env.NODE_ENV === 'production') {
      return JSON.stringify(payload);
    }

    // Clean human-readable terminal output for development
    const colors = {
      info: '\x1b[36m', // Cyan
      warn: '\x1b[33m', // Yellow
      error: '\x1b[31m', // Red
      debug: '\x1b[90m', // Gray
      reset: '\x1b[0m',
    };
    const color = colors[level];
    const resetColor = colors.reset;

    const errStr = err ? `\n${err.stack || err.message}` : '';
    const metaStr = meta ? ` | Meta: ${JSON.stringify(meta)}` : '';
    return `${color}[${payload.timestamp}] [${level.toUpperCase()}]${resetColor} ${message}${metaStr}${errStr}`;
  }

  info(message: string, meta?: Record<string, any>) {
    console.log(this.formatLog('info', message, meta));
  }

  warn(message: string, meta?: Record<string, any>, err?: Error) {
    console.warn(this.formatLog('warn', message, meta, err));
  }

  error(message: string, meta?: Record<string, any>, err?: Error) {
    console.error(this.formatLog('error', message, meta, err));
  }

  debug(message: string, meta?: Record<string, any>) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(this.formatLog('debug', message, meta));
    }
  }
}

export const logger = new Logger();
