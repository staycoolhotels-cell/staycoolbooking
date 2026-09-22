/**
 * StayCool API Rate Limiter
 * 
 * Supports two modes:
 * 1. Distributed Upstash Redis (production-grade across all serverless/edge instances)
 *    Activated automatically when UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are present in .env
 * 2. In-Memory Sliding Window (fallback for local dev or when Redis is not configured)
 * 
 * Zero external dependencies required — runs in Edge Runtime, Node.js, and Serverless Lambdas.
 */

export interface RateLimitConfig {
  limit: number;      // Maximum requests allowed
  windowSeconds: number; // Time window in seconds
}

export interface RateLimitResult {
  success: boolean;   // Whether the request is permitted
  limit: number;      // Max allowed
  remaining: number;  // Requests remaining in this window
  reset: number;      // Unix timestamp (seconds) when window resets
  retryAfter: number; // Seconds until user can retry
}

// Pre-defined security rate limit tiers
export const RATE_LIMIT_TIERS: Record<string, RateLimitConfig> = {
  // Authentication routes (login, register, password reset) — 10 requests / min
  auth: { limit: 10, windowSeconds: 60 },
  // Payment operations (Razorpay order create, verification) — 15 requests / min
  payment: { limit: 15, windowSeconds: 60 },
  // Writing data (reviews, booking requests, disputes, contact messages) — 30 requests / min
  write: { limit: 30, windowSeconds: 60 },
  // General API read endpoints — 100 requests / min
  api: { limit: 100, windowSeconds: 60 },
  // Public general assets/queries — 200 requests / min
  public: { limit: 200, windowSeconds: 60 },
};

// In-Memory store for fallback
interface MemoryRecord {
  count: number;
  resetAt: number;
}
const memoryStore = new Map<string, MemoryRecord>();

// Periodic garbage collection for in-memory store (every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of memoryStore.entries()) {
      if (record.resetAt <= now) {
        memoryStore.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref?.();
}

/**
 * Check rate limit using Upstash Redis REST API
 */
async function checkUpstashRedis(
  key: string,
  config: RateLimitConfig,
  url: string,
  token: string
): Promise<RateLimitResult | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2-second timeout to avoid blocking requests

    // Atomic pipeline: INCR then EXPIRE (with NX flag so only set on initial key creation)
    const res = await fetch(`${url.replace(/\/$/, '')}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['INCR', key],
        ['TTL', key],
      ]),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`[RateLimiter] Upstash Redis returned status ${res.status}, falling back to memory store`);
      return null;
    }

    const data = await res.json();
    const count = Number(data[0]?.result || 1);
    let ttl = Number(data[1]?.result || config.windowSeconds);

    // If key has no TTL (first creation), set it
    if (ttl <= 0) {
      ttl = config.windowSeconds;
      fetch(`${url.replace(/\/$/, '')}/expire/${encodeURIComponent(key)}/${config.windowSeconds}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }

    const remaining = Math.max(0, config.limit - count);
    const reset = Math.floor(Date.now() / 1000) + ttl;
    const success = count <= config.limit;

    return {
      success,
      limit: config.limit,
      remaining,
      reset,
      retryAfter: success ? 0 : Math.max(1, ttl),
    };
  } catch (err) {
    console.warn('[RateLimiter] Upstash connection failed or timed out, using fallback memory store:', err);
    return null;
  }
}

/**
 * Check rate limit using in-memory sliding window fallback
 */
function checkMemoryStore(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  let record = memoryStore.get(key);

  if (!record || record.resetAt <= now) {
    record = {
      count: 1,
      resetAt: now + config.windowSeconds * 1000,
    };
    memoryStore.set(key, record);

    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      reset: Math.ceil(record.resetAt / 1000),
      retryAfter: 0,
    };
  }

  record.count += 1;
  const remaining = Math.max(0, config.limit - record.count);
  const ttlSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
  const success = record.count <= config.limit;

  return {
    success,
    limit: config.limit,
    remaining,
    reset: Math.ceil(record.resetAt / 1000),
    retryAfter: success ? 0 : ttlSeconds,
  };
}

/**
 * Primary rate limiter entrypoint
 * 
 * @param identifier Client IP or User ID or Token
 * @param tier One of 'auth' | 'payment' | 'write' | 'api' | 'public'
 */
export async function checkRateLimit(
  identifier: string,
  tier: keyof typeof RATE_LIMIT_TIERS = 'api',
  customConfig?: RateLimitConfig
): Promise<RateLimitResult> {
  const config = customConfig || RATE_LIMIT_TIERS[tier] || RATE_LIMIT_TIERS.api;
  const key = `ratelimit:staycool:${tier}:${identifier.trim().toLowerCase() || 'unknown'}`;

  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  // Use Upstash Redis if configured
  if (redisUrl && redisToken) {
    const redisResult = await checkUpstashRedis(key, config, redisUrl, redisToken);
    if (redisResult) return redisResult;
  }

  // Otherwise fallback to in-memory sliding window
  return checkMemoryStore(key, config);
}
