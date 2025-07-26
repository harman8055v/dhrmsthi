// Production-safe logger that prevents console output in production
// Only outputs logs when NODE_ENV is 'development' or NEXT_PUBLIC_DEBUG is 'true'

const isDevelopment = process.env.NODE_ENV === 'development'
const isDebugEnabled = process.env.NEXT_PUBLIC_DEBUG === 'true'
const shouldLog = isDevelopment || isDebugEnabled

// Helper to sanitize sensitive data from logs
function sanitizeData(data: unknown): unknown {
  if (typeof data === 'string') {
    // Remove potential sensitive patterns
    return data
      .replace(/password["\s]*[:=]\s*["']?[^"',\s}]*/gi, 'password: [REDACTED]')
      .replace(/token["\s]*[:=]\s*["']?[^"',\s}]*/gi, 'token: [REDACTED]')
      .replace(/key["\s]*[:=]\s*["']?[^"',\s}]*/gi, 'key: [REDACTED]')
      .replace(/secret["\s]*[:=]\s*["']?[^"',\s}]*/gi, 'secret: [REDACTED]')
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
      .replace(/\b\d{10,}\b/g, '[PHONE]') // Phone numbers
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized: any = Array.isArray(data) ? [] : {}
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        // Skip sensitive keys entirely
        if (/password|token|key|secret|auth|session|otp/i.test(key)) {
          sanitized[key] = '[REDACTED]'
        } else {
          sanitized[key] = sanitizeData((data as any)[key])
        }
      }
    }
    return sanitized
  }
  
  return data
}

class Logger {
  private processArgs(args: unknown[]): unknown[] {
    return args.map(arg => sanitizeData(arg))
  }

  log(...args: unknown[]): void {
    if (shouldLog) {
      // eslint-disable-next-line no-console
      console.log(...this.processArgs(args))
    }
  }

  error(...args: unknown[]): void {
    // Always log errors but sanitize them first
    // eslint-disable-next-line no-console
    console.error(...this.processArgs(args))
  }

  warn(...args: unknown[]): void {
    if (shouldLog) {
      // eslint-disable-next-line no-console
      console.warn(...this.processArgs(args))
    }
  }

  info(...args: unknown[]): void {
    if (shouldLog) {
      // eslint-disable-next-line no-console
      console.info(...this.processArgs(args))
    }
  }

  debug(...args: unknown[]): void {
    if (shouldLog) {
      // eslint-disable-next-line no-console
      console.debug(...this.processArgs(args))
    }
  }

  trace(...args: unknown[]): void {
    if (shouldLog) {
      // eslint-disable-next-line no-console
      console.trace(...this.processArgs(args))
    }
  }

  table(data: unknown, columns?: string[]): void {
    if (shouldLog) {
      // eslint-disable-next-line no-console
      console.table(sanitizeData(data), columns)
    }
  }

  time(label?: string): void {
    if (shouldLog) {
      // eslint-disable-next-line no-console
      console.time(label)
    }
  }

  timeEnd(label?: string): void {
    if (shouldLog) {
      // eslint-disable-next-line no-console
      console.timeEnd(label)
    }
  }

  group(...label: unknown[]): void {
    if (shouldLog) {
      // eslint-disable-next-line no-console
      console.group(...this.processArgs(label))
    }
  }

  groupEnd(): void {
    if (shouldLog) {
      // eslint-disable-next-line no-console
      console.groupEnd()
    }
  }
}

// Export a singleton instance
export const logger = new Logger()

// For backward compatibility
export const DEBUG = shouldLog
export const debugLog = (...args: unknown[]) => logger.log(...args)

// Export a noop logger for production to ensure no output
export const noopLogger = {
  log: () => {},
  error: () => {},
  warn: () => {},
  info: () => {},
  debug: () => {},
  trace: () => {},
  table: () => {},
  time: () => {},
  timeEnd: () => {},
  group: () => {},
  groupEnd: () => {}
}

// Helper to get the appropriate logger
export const getLogger = () => shouldLog ? logger : noopLogger
