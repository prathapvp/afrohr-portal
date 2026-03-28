/**
 * Rate Limiting Service
 * Implements exponential backoff and retry logic for API calls
 */

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
};

// Track rate limit per endpoint
const rateLimitMap = new Map<string, RateLimitEntry>();

/**
 * Implements exponential backoff delay
 */
const calculateBackoffDelay = (
  attempt: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): number => {
  const delay = Math.min(
    config.baseDelay * Math.pow(config.backoffMultiplier, attempt),
    config.maxDelay
  );
  
  // Add jitter to prevent thundering herd
  const jitter = Math.random() * 0.3 * delay;
  return delay + jitter;
};

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Checks if request should be rate limited
 */
export const shouldRateLimit = (endpoint: string, limit: number = 10, windowMs: number = 60000): boolean => {
  const now = Date.now();
  const entry = rateLimitMap.get(endpoint);

  if (!entry || now > entry.resetTime) {
    // Reset the rate limit window
    rateLimitMap.set(endpoint, {
      count: 1,
      resetTime: now + windowMs,
    });
    return false;
  }

  if (entry.count >= limit) {
    return true;
  }

  entry.count++;
  return false;
};

/**
 * Gets remaining time until rate limit resets
 */
export const getRateLimitResetTime = (endpoint: string): number => {
  const entry = rateLimitMap.get(endpoint);
  if (!entry) return 0;
  
  const remaining = entry.resetTime - Date.now();
  return Math.max(0, remaining);
};

/**
 * Clears rate limit for an endpoint
 */
export const clearRateLimit = (endpoint: string): void => {
  rateLimitMap.delete(endpoint);
};

/**
 * Retry wrapper with exponential backoff
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> => {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: any;

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on certain status codes
      const status = error?.response?.status;
      if (status && [400, 401, 403, 404, 422].includes(status)) {
        throw error;
      }

      // If we've exhausted retries, throw
      if (attempt === finalConfig.maxRetries) {
        throw error;
      }

      // Calculate and wait for backoff delay
      const delay = calculateBackoffDelay(attempt, finalConfig);
      console.warn(
        `Request failed (attempt ${attempt + 1}/${finalConfig.maxRetries + 1}). ` +
        `Retrying in ${Math.round(delay / 1000)}s...`
      );
      
      await sleep(delay);
    }
  }

  throw lastError;
};

/**
 * Debounce function for API calls
 */
export const debounce = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

/**
 * Throttle function for API calls
 */
export const throttle = <T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Request deduplication - prevents duplicate simultaneous requests
 */
const pendingRequests = new Map<string, Promise<any>>();

export const deduplicateRequest = async <T>(
  key: string,
  fn: () => Promise<T>
): Promise<T> => {
  // If request is already pending, return existing promise
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key)!;
  }

  // Execute new request
  const promise = fn().finally(() => {
    // Clean up after request completes
    pendingRequests.delete(key);
  });

  pendingRequests.set(key, promise);
  return promise;
};

/**
 * Clears all pending requests
 */
export const clearPendingRequests = (): void => {
  pendingRequests.clear();
};

/**
 * Circuit breaker pattern for failing services
 */
interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

const circuitBreakers = new Map<string, CircuitBreakerState>();

const CIRCUIT_BREAKER_CONFIG = {
  failureThreshold: 5,
  resetTimeout: 60000, // 1 minute
  halfOpenRequests: 1,
};

export const circuitBreakerWrapper = async <T>(
  serviceKey: string,
  fn: () => Promise<T>
): Promise<T> => {
  let breaker = circuitBreakers.get(serviceKey);

  if (!breaker) {
    breaker = {
      failures: 0,
      lastFailureTime: 0,
      state: 'CLOSED',
    };
    circuitBreakers.set(serviceKey, breaker);
  }

  // Check if circuit is OPEN
  if (breaker.state === 'OPEN') {
    const timeSinceLastFailure = Date.now() - breaker.lastFailureTime;
    
    if (timeSinceLastFailure > CIRCUIT_BREAKER_CONFIG.resetTimeout) {
      breaker.state = 'HALF_OPEN';
    } else {
      throw new Error(`Circuit breaker OPEN for ${serviceKey}. Service temporarily unavailable.`);
    }
  }

  try {
    const result = await fn();
    
    // Success - reset circuit breaker
    if (breaker.state === 'HALF_OPEN') {
      breaker.state = 'CLOSED';
      breaker.failures = 0;
    }
    
    return result;
  } catch (error) {
    breaker.failures++;
    breaker.lastFailureTime = Date.now();

    // Open circuit if threshold exceeded
    if (breaker.failures >= CIRCUIT_BREAKER_CONFIG.failureThreshold) {
      breaker.state = 'OPEN';
      console.error(`Circuit breaker OPENED for ${serviceKey} after ${breaker.failures} failures`);
    }

    throw error;
  }
};

/**
 * Resets circuit breaker for a service
 */
export const resetCircuitBreaker = (serviceKey: string): void => {
  circuitBreakers.delete(serviceKey);
};
