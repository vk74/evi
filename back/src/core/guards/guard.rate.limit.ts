/**
 * version: 1.1.0
 * Backend file: guard.rate.limit.ts
 * Purpose: Express guard that enforces rate limiting on incoming requests to protect against DDoS attacks.
 * This guard executes FIRST in the request pipeline, before JWT validation and other expensive operations.
 * Layer: Backend route guard (security)
 *
 * Logic:
 * - Loads configuration from app_settings cache (no hardcoded defaults)
 * - Tracks request counts per IP address in memory
 * - Enforces per-minute and per-hour request limits
 * - Temporarily blocks IPs that exceed limits
 * - Excludes localhost for development/testing
 * - NO event logging during normal operations for maximum performance
 * - Events only for critical configuration errors
 * 
 * In-Memory Store Capacity:
 * - MAX_STORE_SIZE: 500,000 entries
 * - Rationale: Assuming average 50 bytes per entry = ~24 MB RAM
 * - Covers large organizations with multiple users behind NAT gateways
 * - Automatic cleanup removes entries older than 1 hour
 * 
 * Changes in v1.1.0:
 * - Moved RateLimitConfig to types.guards.ts
 * - Removed LIMIT_EXCEEDED event to avoid performance degradation during DDoS
 * - Added store capacity documentation
 */

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, GuardFunction, RateLimitConfig } from './types.guards';
import { createAndPublishEvent } from '@/core/eventBus/fabric.events';
import { RATE_LIMIT_GUARD_EVENTS } from './events.guards';
import { getSetting, parseSettingValue } from '@/modules/admin/settings/cache.settings';

// Configuration cache with periodic refresh
let rateLimitConfigCache: RateLimitConfig | null = null;
let lastConfigRefresh = 0;
const CONFIG_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

// In-memory rate limiting store
const rateLimitStore = new Map<string, {
  requestCount: number;
  windowStart: number;
  lastReset: number;
  blockedUntil?: number;
  lastAccess: number;
}>();

// Cleanup configuration
const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour
const MAX_ENTRY_AGE = 1 * 60 * 60 * 1000; // 1 hour
const MAX_STORE_SIZE = 500000; // 500k entries

/**
 * Cleanup outdated entries from rate limit store
 */
function cleanupRateLimitStore(): void {
  const now = Date.now();
  const entriesToDelete: string[] = [];
  
  // Collect entries for deletion
  for (const [clientId, entry] of rateLimitStore.entries()) {
    if (now - entry.lastAccess > MAX_ENTRY_AGE) {
      entriesToDelete.push(clientId);
    }
  }
  
  // Delete outdated entries
  entriesToDelete.forEach(clientId => rateLimitStore.delete(clientId));
  
  // If Map is too large, remove oldest entries
  if (rateLimitStore.size > MAX_STORE_SIZE) {
    const sortedEntries = Array.from(rateLimitStore.entries())
      .sort((a, b) => a[1].lastAccess - b[1].lastAccess);
    
    const toRemove = sortedEntries.slice(0, rateLimitStore.size - MAX_STORE_SIZE + 1000);
    toRemove.forEach(([clientId]) => rateLimitStore.delete(clientId));
  }
}

// Periodic cleanup every hour
setInterval(cleanupRateLimitStore, CLEANUP_INTERVAL);

/**
 * Refresh rate limiting configuration from app_settings cache
 * @returns Rate limiting configuration
 * @throws Error if required settings are missing
 */
async function refreshRateLimitConfig(): Promise<RateLimitConfig> {
  const now = Date.now();
  
  // Return cached config if still valid
  if (rateLimitConfigCache && (now - lastConfigRefresh) < CONFIG_REFRESH_INTERVAL) {
    return rateLimitConfigCache;
  }
  
  try {
    const enabledSetting = getSetting('Application.Security.SessionManagement', 'rate.limiting.enabled');
    const maxRequestsPerMinuteSetting = getSetting('Application.Security.SessionManagement', 'rate.limiting.max.requests.per.minute');
    const maxRequestsPerHourSetting = getSetting('Application.Security.SessionManagement', 'rate.limiting.max.requests.per.hour');
    const blockDurationSetting = getSetting('Application.Security.SessionManagement', 'rate.limiting.block.duration.minutes');

    // Check for missing settings
    const missingSettings: string[] = [];
    if (!enabledSetting) missingSettings.push('rate.limiting.enabled');
    if (!maxRequestsPerMinuteSetting) missingSettings.push('rate.limiting.max.requests.per.minute');
    if (!maxRequestsPerHourSetting) missingSettings.push('rate.limiting.max.requests.per.hour');
    if (!blockDurationSetting) missingSettings.push('rate.limiting.block.duration.minutes');

    if (missingSettings.length > 0) {
      const error = `Rate limiting configuration incomplete: missing ${missingSettings.join(', ')}`;
      
      await createAndPublishEvent({
        eventName: RATE_LIMIT_GUARD_EVENTS.CONFIG_INITIALIZATION_FAILED.eventName,
        payload: {
          missingSettings,
          error
        },
        errorData: error
      });
      
      throw new Error(error);
    }

    // At this point all settings are guaranteed to be non-null
    const config: RateLimitConfig = {
      enabled: parseSettingValue(enabledSetting!),
      maxRequestsPerMinute: parseSettingValue(maxRequestsPerMinuteSetting!),
      maxRequestsPerHour: parseSettingValue(maxRequestsPerHourSetting!),
      blockDurationMinutes: parseSettingValue(blockDurationSetting!)
    };

    rateLimitConfigCache = config;
    lastConfigRefresh = now;
    
    return config;
  } catch (error) {
    await createAndPublishEvent({
      eventName: RATE_LIMIT_GUARD_EVENTS.CONFIG_INITIALIZATION_FAILED.eventName,
      payload: {
        error: error instanceof Error ? error.message : String(error)
      },
      errorData: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

/**
 * Check rate limit for a request
 * @param req Express request
 * @param config Rate limit configuration
 * @returns Rate limit check result
 */
async function checkRateLimit(req: AuthenticatedRequest, config: RateLimitConfig): Promise<{
  allowed: boolean;
  retryAfter?: number;
  remainingRequests?: number;
  resetTime?: number;
  reason?: string;
}> {
  // Fast path: if rate limiting is disabled
  if (!config.enabled) {
    return { allowed: true };
  }

  const clientId = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown';
  
  // Exclude localhost from rate limiting for testing
  if (clientId === '127.0.0.1' || clientId === '::1' || clientId === 'localhost') {
    return { allowed: true };
  }
  
  const now = Date.now();
  const minuteWindow = 60 * 1000; // 1 minute
  const hourWindow = 60 * 60 * 1000; // 1 hour
  
  let entry = rateLimitStore.get(clientId);
  if (!entry) {
    entry = {
      requestCount: 0,
      windowStart: now,
      lastReset: now,
      lastAccess: now
    };
    rateLimitStore.set(clientId, entry);
  } else {
    // Update last access time
    entry.lastAccess = now;
  }

  // Check temporary block
  if (entry.blockedUntil && now < entry.blockedUntil) {
    const retryAfter = Math.ceil((entry.blockedUntil - now) / 1000);
    return {
      allowed: false,
      retryAfter,
      reason: 'temporarily_blocked'
    };
  }

  // Reset windows
  if (now - entry.windowStart >= minuteWindow) {
    entry.requestCount = 0;
    entry.windowStart = now;
  }
  if (now - entry.lastReset >= hourWindow) {
    entry.requestCount = 0;
    entry.lastReset = now;
    entry.windowStart = now;
  }

  // Check limits
  if (entry.requestCount >= config.maxRequestsPerMinute) {
    if (config.blockDurationMinutes) {
      entry.blockedUntil = now + (config.blockDurationMinutes * 60 * 1000);
    }
    rateLimitStore.set(clientId, entry);
    
    const retryAfter = Math.ceil(minuteWindow / 1000);
    return {
      allowed: false,
      retryAfter,
      resetTime: Math.floor((entry.windowStart + minuteWindow) / 1000),
      reason: 'minute_limit_exceeded'
    };
  }

  if (entry.requestCount >= config.maxRequestsPerHour) {
    const retryAfter = Math.ceil(hourWindow / 1000);
    return {
      allowed: false,
      retryAfter,
      resetTime: Math.floor((entry.lastReset + hourWindow) / 1000),
      reason: 'hour_limit_exceeded'
    };
  }

  // Increment and allow request
  entry.requestCount++;
  rateLimitStore.set(clientId, entry);
  
  const remainingRequests = Math.min(
    config.maxRequestsPerMinute - entry.requestCount,
    config.maxRequestsPerHour - entry.requestCount
  );
  
  return {
    allowed: true,
    remainingRequests,
    resetTime: Math.floor((entry.windowStart + minuteWindow) / 1000)
  };
}

/**
 * Rate limit guard middleware
 * Enforces rate limiting on all incoming requests
 * NO event logging for blocked requests to maintain performance during DDoS attacks
 */
const checkRateLimitGuard: GuardFunction = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get configuration
    const config = await refreshRateLimitConfig();
    
    // Check rate limit
    const rateLimitResult = await checkRateLimit(req, config);
    
    // If rate limit exceeded, block request (NO event logging for performance)
    if (!rateLimitResult.allowed) {
      // Set rate limit headers
      res.set({
        'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
        'X-RateLimit-Limit': config.maxRequestsPerMinute.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': rateLimitResult.resetTime?.toString() || Math.floor(Date.now() / 1000 + 60).toString()
      });

      // Return rate limit error
      const errorCode = rateLimitResult.reason === 'temporarily_blocked' ? 'TEMPORARILY_BLOCKED' : 'RATE_LIMIT_EXCEEDED';
      const errorResponse = {
        code: errorCode,
        message: rateLimitResult.reason === 'temporarily_blocked' 
          ? 'Too many requests. You have been temporarily blocked. Please try again later.'
          : 'Rate limit exceeded. Please slow down your requests.',
        retryAfter: rateLimitResult.retryAfter
      };

      res.status(429).json(errorResponse);
      return;
    }

    // Set rate limit headers for successful requests
    if (rateLimitResult.remainingRequests !== undefined && rateLimitResult.resetTime) {
      res.set({
        'X-RateLimit-Limit': config.maxRequestsPerMinute.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remainingRequests.toString(),
        'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
      });
    }

    // Allow request to proceed
    next();
  } catch (error) {
    // If configuration fails, fail closed (reject request)
    await createAndPublishEvent({
      eventName: RATE_LIMIT_GUARD_EVENTS.CONFIG_INITIALIZATION_FAILED.eventName,
      payload: {
        error: error instanceof Error ? error.message : String(error),
        requestPath: req.path
      },
      errorData: error instanceof Error ? error.message : String(error)
    });
    
    res.status(503).json({
      code: 'SERVICE_UNAVAILABLE',
      message: 'Rate limiting service unavailable. Please try again later.'
    });
  }
};

export default checkRateLimitGuard;

