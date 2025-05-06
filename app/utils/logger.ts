/**
 * Logger utility for consistent logging format across the application
 * Especially useful for tracking stock operations and synchronization
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogOptions {
  context?: string;
  data?: any;
  timestamp?: boolean;
}

/**
 * Log a message with consistent formatting
 */
export function log(message: string, level: LogLevel = 'info', options: LogOptions = {}) {
  const { context = '', data = null, timestamp = true } = options;
  
  const timestampStr = timestamp ? `[${new Date().toISOString()}]` : '';
  const contextStr = context ? `[${context}]` : '';
  const prefix = `${timestampStr}${contextStr}[${level.toUpperCase()}]`;
  
  let logFn: (message?: any, ...optionalParams: any[]) => void;
  
  switch (level) {
    case 'warn':
      logFn = console.warn;
      break;
    case 'error':
      logFn = console.error;
      break;
    case 'debug':
      logFn = console.debug;
      break;
    case 'info':
    default:
      logFn = console.log;
  }
  
  if (data) {
    logFn(`${prefix} ${message}`, data);
  } else {
    logFn(`${prefix} ${message}`);
  }
}

/**
 * Log stock-related operations
 */
export function logStock(message: string, level: LogLevel = 'info', data?: any) {
  log(message, level, { context: 'STOCK', data });
}

/**
 * Log API-related operations
 */
export function logApi(message: string, level: LogLevel = 'info', data?: any) {
  log(message, level, { context: 'API', data });
}

/**
 * Log synchronization-related operations
 */
export function logSync(message: string, level: LogLevel = 'info', data?: any) {
  log(message, level, { context: 'SYNC', data });
}
