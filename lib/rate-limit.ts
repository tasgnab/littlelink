import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  interval: number; // Time window in milliseconds
  uniqueTokenPerInterval: number; // Max requests per window
}

interface TokenBucket {
  tokens: number[];
}

// In-memory store for rate limit tracking
const rateLimitStore = new Map<string, TokenBucket>();

// Cleanup old entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of rateLimitStore.entries()) {
    // Remove entries older than 1 hour
    bucket.tokens = bucket.tokens.filter(timestamp => now - timestamp < 3600000);
    if (bucket.tokens.length === 0) {
      rateLimitStore.delete(key);
    }
  }
}, 600000);

/**
 * Rate limiter using sliding window algorithm
 */
export class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  /**
   * Check if a request should be rate limited
   * @param identifier Unique identifier (e.g., IP address, user ID, API key)
   * @returns Object with success status and remaining requests
   */
  check(identifier: string): { success: boolean; remaining: number; reset: number } {
    const now = Date.now();
    const windowStart = now - this.config.interval;

    // Get or create bucket for this identifier
    let bucket = rateLimitStore.get(identifier);
    if (!bucket) {
      bucket = { tokens: [] };
      rateLimitStore.set(identifier, bucket);
    }

    // Remove timestamps outside current window
    bucket.tokens = bucket.tokens.filter(timestamp => timestamp > windowStart);

    const remaining = this.config.uniqueTokenPerInterval - bucket.tokens.length;

    if (bucket.tokens.length >= this.config.uniqueTokenPerInterval) {
      // Rate limit exceeded
      const oldestToken = bucket.tokens[0];
      const reset = oldestToken + this.config.interval;
      return { success: false, remaining: 0, reset };
    }

    // Add current request timestamp
    bucket.tokens.push(now);
    return { success: true, remaining: remaining - 1, reset: now + this.config.interval };
  }

  /**
   * Reset rate limit for a specific identifier (useful for testing)
   */
  reset(identifier: string): void {
    rateLimitStore.delete(identifier);
  }

  /**
   * Clear all rate limit data
   */
  static clearAll(): void {
    rateLimitStore.clear();
  }
}

/**
 * Get client identifier from request (IP address or fallback)
 */
export function getClientIdentifier(req: NextRequest): string {
  // Try various headers for IP address
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to a default identifier
  return 'unknown';
}

/**
 * Middleware wrapper for rate limiting
 */
export function withRateLimit(
  handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse | Response>,
  limiter: RateLimiter,
  options?: {
    identifierFn?: (req: NextRequest) => string;
    onRateLimit?: (req: NextRequest, result: { remaining: number; reset: number }) => NextResponse;
  }
) {
  return async (req: NextRequest, ...args: any[]) => {
    const identifier = options?.identifierFn
      ? options.identifierFn(req)
      : getClientIdentifier(req);

    const result = limiter.check(identifier);

    if (!result.success) {
      if (options?.onRateLimit) {
        return options.onRateLimit(req, result);
      }

      return NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limiter['config'].uniqueTokenPerInterval.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': result.reset.toString(),
            'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    // Add rate limit headers to response
    const response = await handler(req, ...args);
    const headers = new Headers(response.headers);
    headers.set('X-RateLimit-Limit', limiter['config'].uniqueTokenPerInterval.toString());
    headers.set('X-RateLimit-Remaining', result.remaining.toString());
    headers.set('X-RateLimit-Reset', result.reset.toString());

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };
}

// Pre-configured rate limiters for different use cases
export const rateLimiters = {
  // API routes: 100 requests per minute
  api: new RateLimiter({
    interval: 60 * 1000,
    uniqueTokenPerInterval: 100,
  }),

  // Redirect routes: 300 requests per minute (higher since this is primary function)
  redirect: new RateLimiter({
    interval: 60 * 1000,
    uniqueTokenPerInterval: 300,
  }),

  // Auth routes: 10 requests per 15 minutes (prevent brute force)
  auth: new RateLimiter({
    interval: 15 * 60 * 1000,
    uniqueTokenPerInterval: 10,
  }),

  // Strict rate limit for sensitive operations: 5 requests per minute
  strict: new RateLimiter({
    interval: 60 * 1000,
    uniqueTokenPerInterval: 5,
  }),
};

/**
 * Simple wrapper to apply rate limiting to a route handler
 */
export async function applyRateLimit(
  request: NextRequest,
  limiter: RateLimiter,
  handler: () => Promise<NextResponse | Response>
): Promise<NextResponse> {
  const identifier = getClientIdentifier(request);
  const result = limiter.check(identifier);
  const limit = limiter['config'].uniqueTokenPerInterval;

  if (!result.success) {
    return NextResponse.json(
      {
        error: "Too many requests",
        message: "Rate limit exceeded. Please try again later.",
        retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": result.reset.toString(),
          "Retry-After": Math.ceil((result.reset - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  const response = await handler();
  const headers = new Headers(response.headers);
  headers.set("X-RateLimit-Limit", limit.toString());
  headers.set("X-RateLimit-Remaining", result.remaining.toString());
  headers.set("X-RateLimit-Reset", result.reset.toString());

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
