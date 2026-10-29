import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

class InMemoryRateLimiter {
  private limits = new Map<string, RateLimitRecord>();

  /**
   * Check if action is allowed under windowMs and maxAttempts
   */
  public check(key: string, maxAttempts: number, windowMs: number): { allowed: boolean; remaining: number; retryAfterSec: number } {
    const now = Date.now();
    const record = this.limits.get(key);

    if (!record || record.resetAt <= now) {
      this.limits.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, remaining: maxAttempts - 1, retryAfterSec: 0 };
    }

    if (record.count >= maxAttempts) {
      const retryAfterSec = Math.ceil((record.resetAt - now) / 1000);
      return { allowed: false, remaining: 0, retryAfterSec };
    }

    record.count += 1;
    return { allowed: true, remaining: maxAttempts - record.count, retryAfterSec: 0 };
  }

  public reset(key: string): void {
    this.limits.delete(key);
  }
}

export const rateLimiterStore = new InMemoryRateLimiter();

/**
 * Middleware factory for rate limiting
 */
export function createRateLimiter(options: {
  max: number;
  windowMs: number;
  message: string;
  keyGenerator?: (req: Request) => string;
}) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = options.keyGenerator
      ? options.keyGenerator(req)
      : `${req.ip || 'unknown'}:${req.path}`;

    const { allowed, retryAfterSec } = rateLimiterStore.check(key, options.max, options.windowMs);

    if (!allowed) {
      res.setHeader('Retry-After', retryAfterSec.toString());
      res.status(429).json({
        success: false,
        error: options.message,
        retryAfterSec,
      });
      return;
    }

    next();
  };
}

// 1. Login rate limiter: Max 5 attempts per IP per 15 minutes
export const loginRateLimiter = createRateLimiter({
  max: 5,
  windowMs: 15 * 60 * 1000,
  message: 'Too many login attempts. Please wait 15 minutes before trying again.',
  keyGenerator: (req) => `login:${req.ip}:${(req.body.email || '').toLowerCase().trim()}`,
});

// 2. Registration rate limiter: Max 5 registrations per IP per hour
export const registerRateLimiter = createRateLimiter({
  max: 5,
  windowMs: 60 * 60 * 1000,
  message: 'Registration rate limit exceeded. Please try again later.',
  keyGenerator: (req) => `register:${req.ip}`,
});

// 3. OTP verification rate limiter: Max 5 attempts per email per 5 minutes
export const otpVerifyRateLimiter = createRateLimiter({
  max: 5,
  windowMs: 5 * 60 * 1000,
  message: 'Too many invalid OTP attempts. For security, please request a new OTP.',
  keyGenerator: (req) => `otp-verify:${(req.body.email || '').toLowerCase().trim()}`,
});

// 4. OTP request / resend rate limiter: Max 3 requests per 15 minutes
export const otpRequestRateLimiter = createRateLimiter({
  max: 3,
  windowMs: 15 * 60 * 1000,
  message: 'Maximum OTP request limit reached. Please wait 15 minutes before requesting another OTP.',
  keyGenerator: (req) => `otp-request:${(req.body.email || '').toLowerCase().trim()}`,
});

// 5. Password reset request rate limiter: Max 3 requests per 15 minutes
export const forgotPasswordRateLimiter = createRateLimiter({
  max: 3,
  windowMs: 15 * 60 * 1000,
  message: 'Password reset request limit exceeded. Please wait 15 minutes before requesting again.',
  keyGenerator: (req) => `forgot-pw:${(req.body.email || '').toLowerCase().trim()}`,
});
