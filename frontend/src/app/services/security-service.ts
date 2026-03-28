/**
 * Security Service
 * Handles input sanitization, CSRF protection, and security utilities
 */

import DOMPurify from 'dompurify';

// ==================== INPUT SANITIZATION ====================

/**
 * Sanitizes HTML content to prevent XSS attacks
 */
export const sanitizeHtml = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });
};

/**
 * Sanitizes plain text input (removes all HTML)
 */
export const sanitizeText = (input: string): string => {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
};

/**
 * Sanitizes form data object
 */
export const sanitizeFormData = <T extends Record<string, any>>(data: T): T => {
  const sanitized: any = { ...data };
  
  Object.keys(sanitized).forEach((key) => {
    const value = sanitized[key];
    
    if (typeof value === 'string') {
      sanitized[key] = sanitizeText(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === 'string' ? sanitizeText(item) : item
      );
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeFormData(value);
    }
  });
  
  return sanitized as T;
};

/**
 * Validates and sanitizes Base64 image data
 */
export const sanitizeBase64Image = (base64: string): string | null => {
  try {
    // Check if it's a valid Base64 string
    if (!base64.match(/^data:image\/(png|jpeg|jpg|gif|webp);base64,/)) {
      console.error('Invalid image format');
      return null;
    }
    
    // Check file size (max 5MB)
    const sizeInBytes = (base64.length * 3) / 4;
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (sizeInBytes > maxSize) {
      console.error('Image size exceeds 5MB limit');
      return null;
    }
    
    return base64;
  } catch (error) {
    console.error('Error sanitizing image:', error);
    return null;
  }
};

// ==================== CSRF PROTECTION ====================

/**
 * Generates a CSRF token
 */
export const generateCsrfToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Stores CSRF token in sessionStorage
 */
export const storeCsrfToken = (token: string): void => {
  sessionStorage.setItem('csrf-token', token);
};

/**
 * Retrieves CSRF token from sessionStorage
 */
export const getCsrfToken = (): string | null => {
  return sessionStorage.getItem('csrf-token');
};

/**
 * Removes CSRF token from sessionStorage
 */
export const removeCsrfToken = (): void => {
  sessionStorage.removeItem('csrf-token');
};

/**
 * Initializes CSRF token if not present
 */
export const initializeCsrfToken = (): string => {
  let token = getCsrfToken();
  if (!token) {
    token = generateCsrfToken();
    storeCsrfToken(token);
  }
  return token;
};

// ==================== SECURITY HEADERS ====================

/**
 * Content Security Policy configuration
 */
export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Note: Remove unsafe-* in production
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'https:'],
  'font-src': ["'self'", 'data:'],
  'connect-src': ["'self'", 'http://localhost:7000', 'http://127.0.0.1:7000', 'http://localhost:8080'],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
};

/**
 * Generates CSP header string
 */
export const generateCspHeader = (): string => {
  return Object.entries(CSP_DIRECTIVES)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
};

// ==================== ERROR SANITIZATION ====================

/**
 * Sanitizes error messages to prevent sensitive data exposure
 */
export const sanitizeErrorMessage = (error: any): string => {
  // Don't expose sensitive backend errors
  const safeMessages: Record<number, string> = {
    400: 'Invalid request. Please check your input.',
    401: 'Unauthorized. Please log in again.',
    403: 'Access forbidden. You do not have permission.',
    404: 'Resource not found.',
    409: 'Conflict. Resource already exists.',
    422: 'Validation failed. Please check your input.',
    429: 'Too many requests. Please try again later.',
    500: 'Server error. Please try again later.',
    502: 'Service unavailable. Please try again later.',
    503: 'Service temporarily unavailable.',
  };

  const status = error?.response?.status || error?.status;
  
  if (status && safeMessages[status]) {
    return safeMessages[status];
  }

  // Default safe message
  return 'An unexpected error occurred. Please try again.';
};

// ==================== PRODUCTION SECURITY ====================

/**
 * Checks if app is running in production
 */
export const isProduction = (): boolean => {
  return process.env.NODE_ENV === 'production';
};

/**
 * Safe console log that only works in development
 */
export const secureLog = (...args: any[]): void => {
  if (!isProduction()) {
    console.log(...args);
  }
};

/**
 * Safe console error that sanitizes in production
 */
export const secureError = (message: string, error?: any): void => {
  if (isProduction()) {
    // Log sanitized message only
    console.error(message);
  } else {
    // Log full error in development
    console.error(message, error);
  }
};

// ==================== INPUT VALIDATION ====================

/**
 * Validates email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates phone number format
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s-()]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

/**
 * Validates URL format
 */
export const isValidUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Prevents clickjacking attacks
 */
export const preventClickjacking = (): void => {
  if (window.self !== window.top) {
    window.top!.location.href = window.self.location.href;
  }
};

// Initialize clickjacking prevention
if (typeof window !== 'undefined') {
  preventClickjacking();
}
