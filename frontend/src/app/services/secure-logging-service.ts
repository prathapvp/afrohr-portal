/**
 * Secure Logging Service
 * 
 * Prevents PII data leakage through console logs, error messages, and analytics.
 * Automatically redacts sensitive information before logging.
 */

// ==================== TYPES ====================

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

interface LogOptions {
  level?: LogLevel;
  context?: string;
  includeTimestamp?: boolean;
  sanitize?: boolean;
}

// ==================== PII PATTERNS ====================

/**
 * Regex patterns to detect PII in logs
 */
const PII_PATTERNS = {
  // Email: john.doe@example.com
  EMAIL: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  
  // Phone: +1234567890, (123) 456-7890, 123-456-7890
  PHONE: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
  
  // SSN: 123-45-6789, 123456789
  SSN: /\b\d{3}-?\d{2}-?\d{4}\b/g,
  
  // Credit Card: 1234-5678-9012-3456, 1234567890123456
  CREDIT_CARD: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
  
  // Date of Birth: 1990-05-15, 05/15/1990
  DOB: /\b(19|20)\d{2}[-/](0[1-9]|1[0-2])[-/](0[1-9]|[12]\d|3[01])\b/g,
  
  // IP Address: 192.168.1.1
  IP_ADDRESS: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
  
  // JWT/API Tokens: Long alphanumeric strings
  TOKEN: /\b[A-Za-z0-9_-]{100,}\b/g,
  
  // Passwords (common patterns): password=abc123, pwd: secret
  PASSWORD: /(password|pwd|pass|secret|token|key|auth)[\s]*[:=][\s]*[\S]+/gi,
};

/**
 * Field names that contain sensitive data
 */
const SENSITIVE_FIELD_NAMES = [
  'password',
  'pwd',
  'pass',
  'secret',
  'token',
  'apiKey',
  'accessToken',
  'refreshToken',
  'jwt',
  'authorization',
  'cookie',
  'sessionId',
  'ssn',
  'nationalId',
  'dateOfBirth',
  'dob',
  'phone',
  'email',
  'address',
  'creditCard',
  'cardNumber',
  'cvv',
  'pin',
];

// ==================== REDACTION UTILITIES ====================

/**
 * Redact PII from string using regex patterns
 */
const redactString = (text: string): string => {
  let redacted = text;
  
  // Redact emails
  redacted = redacted.replace(PII_PATTERNS.EMAIL, (match) => {
    const [local, domain] = match.split('@');
    return `${local.substring(0, 2)}***@${domain}`;
  });
  
  // Redact phone numbers
  redacted = redacted.replace(PII_PATTERNS.PHONE, (match) => {
    const digits = match.replace(/\D/g, '');
    return '***-***-' + digits.slice(-4);
  });
  
  // Redact SSN
  redacted = redacted.replace(PII_PATTERNS.SSN, '***-**-****');
  
  // Redact credit cards
  redacted = redacted.replace(PII_PATTERNS.CREDIT_CARD, '**** **** **** ****');
  
  // Redact DOB
  redacted = redacted.replace(PII_PATTERNS.DOB, '****-**-**');
  
  // Redact tokens
  redacted = redacted.replace(PII_PATTERNS.TOKEN, '[REDACTED_TOKEN]');
  
  // Redact passwords
  redacted = redacted.replace(PII_PATTERNS.PASSWORD, '$1: [REDACTED]');
  
  return redacted;
};

/**
 * Redact sensitive fields from objects
 */
const redactObject = (obj: any, depth: number = 0): any => {
  if (depth > 10) return '[MAX_DEPTH]'; // Prevent infinite recursion
  
  if (obj === null || obj === undefined) return obj;
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => redactObject(item, depth + 1));
  }
  
  // Handle objects
  if (typeof obj === 'object') {
    const redacted: any = {};
    
    for (const key in obj) {
      if (!obj.hasOwnProperty(key)) continue;
      
      const lowerKey = key.toLowerCase();
      
      // Check if field name is sensitive
      if (SENSITIVE_FIELD_NAMES.some(sensitive => lowerKey.includes(sensitive))) {
        redacted[key] = '[REDACTED]';
        continue;
      }
      
      const value = obj[key];
      
      // Recursively redact nested objects
      if (typeof value === 'object' && value !== null) {
        redacted[key] = redactObject(value, depth + 1);
      } else if (typeof value === 'string') {
        redacted[key] = redactString(value);
      } else {
        redacted[key] = value;
      }
    }
    
    return redacted;
  }
  
  // Handle primitives
  if (typeof obj === 'string') {
    return redactString(obj);
  }
  
  return obj;
};

// ==================== LOGGING FUNCTIONS ====================

/**
 * Format log message with context and timestamp
 */
const formatLogMessage = (
  message: string,
  context?: string,
  includeTimestamp: boolean = true
): string => {
  const parts: string[] = [];
  
  if (includeTimestamp) {
    const timestamp = new Date().toISOString();
    parts.push(`[${timestamp}]`);
  }
  
  if (context) {
    parts.push(`[${context}]`);
  }
  
  parts.push(message);
  
  return parts.join(' ');
};

/**
 * Secure log - redacts PII before logging
 */
export const secureLog = (
  message: string,
  data?: any,
  options: LogOptions = {}
): void => {
  const {
    level = 'log',
    context,
    includeTimestamp = true,
    sanitize = true,
  } = options;
  
  // In production, disable all logs except errors
  if (process.env.NODE_ENV === 'production' && level !== 'error') {
    return;
  }
  
  const formattedMessage = formatLogMessage(message, context, includeTimestamp);
  
  if (data) {
    const redactedData = sanitize ? redactObject(data) : data;
    console[level](formattedMessage, redactedData);
  } else {
    console[level](formattedMessage);
  }
};

/**
 * Secure info log
 */
export const secureInfo = (message: string, data?: any, context?: string): void => {
  secureLog(message, data, { level: 'info', context });
};

/**
 * Secure warning log
 */
export const secureWarn = (message: string, data?: any, context?: string): void => {
  secureLog(message, data, { level: 'warn', context });
};

/**
 * Secure error log (always enabled, even in production)
 */
export const secureError = (message: string, error?: any, context?: string): void => {
  // Redact error stack traces for PII
  if (error && error.stack) {
    error.stack = redactString(error.stack);
  }
  
  secureLog(message, error, { level: 'error', context, sanitize: true });
};

/**
 * Secure debug log (disabled in production)
 */
export const secureDebug = (message: string, data?: any, context?: string): void => {
  if (process.env.NODE_ENV !== 'production') {
    secureLog(message, data, { level: 'debug', context });
  }
};

// ==================== ANALYTICS & TELEMETRY ====================

/**
 * Sanitize data before sending to analytics
 */
export const sanitizeForAnalytics = (data: any): any => {
  return redactObject(data);
};

/**
 * Safe event tracking (redacts PII from event properties)
 */
export const trackSecureEvent = (
  eventName: string,
  properties?: Record<string, any>
): void => {
  if (!properties) {
    // Send event without properties
    console.log(`[Analytics] Event: ${eventName}`);
    return;
  }
  
  const sanitized = sanitizeForAnalytics(properties);
  console.log(`[Analytics] Event: ${eventName}`, sanitized);
  
  // TODO: Replace with actual analytics SDK
  // analytics.track(eventName, sanitized);
};

// ==================== ERROR REPORTING ====================

/**
 * Sanitize error for external reporting (Sentry, LogRocket, etc.)
 */
export const sanitizeError = (error: Error): Error => {
  const sanitized = new Error(redactString(error.message));
  sanitized.name = error.name;
  
  if (error.stack) {
    sanitized.stack = redactString(error.stack);
  }
  
  return sanitized;
};

/**
 * Report error to external service with PII redaction
 */
export const reportSecureError = (error: Error, context?: Record<string, any>): void => {
  const sanitizedError = sanitizeError(error);
  const sanitizedContext = context ? redactObject(context) : {};
  
  secureError('Error occurred', { error: sanitizedError, context: sanitizedContext });
  
  // TODO: Replace with actual error reporting SDK
  // Sentry.captureException(sanitizedError, { extra: sanitizedContext });
};

// ==================== NETWORK LOGGING ====================

/**
 * Sanitize HTTP request for logging
 */
export const sanitizeRequest = (request: any): any => {
  const sanitized = { ...request };
  
  // Redact authorization headers
  if (sanitized.headers) {
    const headers = { ...sanitized.headers };
    if (headers.Authorization) headers.Authorization = '[REDACTED]';
    if (headers.Cookie) headers.Cookie = '[REDACTED]';
    if (headers['X-CSRF-Token']) headers['X-CSRF-Token'] = '[REDACTED]';
    sanitized.headers = headers;
  }
  
  // Redact body
  if (sanitized.body) {
    sanitized.body = redactObject(sanitized.body);
  }
  
  // Redact query parameters
  if (sanitized.params) {
    sanitized.params = redactObject(sanitized.params);
  }
  
  return sanitized;
};

/**
 * Sanitize HTTP response for logging
 */
export const sanitizeResponse = (response: any): any => {
  const sanitized = { ...response };
  
  // Redact response data
  if (sanitized.data) {
    sanitized.data = redactObject(sanitized.data);
  }
  
  // Redact headers
  if (sanitized.headers) {
    const headers = { ...sanitized.headers };
    if (headers['set-cookie']) headers['set-cookie'] = '[REDACTED]';
    sanitized.headers = headers;
  }
  
  return sanitized;
};

// ==================== DEVELOPMENT HELPERS ====================

/**
 * Unsafe log for development only (bypasses redaction)
 * WARNING: Never use in production code!
 */
export const unsafeDevLog = (message: string, data?: any): void => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEV] ${message}`, data);
  }
};

/**
 * Check if string contains PII
 */
export const containsPII = (text: string): boolean => {
  return Object.values(PII_PATTERNS).some(pattern => pattern.test(text));
};

/**
 * Validate log message doesn't contain PII (for testing)
 */
export const validateLogSafety = (message: string, data?: any): boolean => {
  const hasMessagePII = containsPII(message);
  const hasDataPII = data ? containsPII(JSON.stringify(data)) : false;
  
  if (hasMessagePII || hasDataPII) {
    console.warn('⚠️ PII detected in log message! Use secureLog() instead.');
    return false;
  }
  
  return true;
};

// ==================== EXPORT ====================

export default {
  // Core logging
  secureLog,
  secureInfo,
  secureWarn,
  secureError,
  secureDebug,
  
  // Analytics
  sanitizeForAnalytics,
  trackSecureEvent,
  
  // Error reporting
  sanitizeError,
  reportSecureError,
  
  // Network logging
  sanitizeRequest,
  sanitizeResponse,
  
  // Utilities
  redactString,
  redactObject,
  containsPII,
  validateLogSafety,
  
  // Development only
  unsafeDevLog,
};
