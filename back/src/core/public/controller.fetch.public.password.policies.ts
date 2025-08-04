/**
 * controller.fetch.public.password.policies.ts - backend file
 * version: 1.0.0
 * Controller for handling public password policies API requests.
 * Includes rate limiting, request validation, and response formatting.
 */

import { Request, Response } from 'express';
import { fetchPublicPasswordPolicies } from './service.fetch.public.password.policies';
import fabricEvents from '../eventBus/fabric.events';
import { PUBLIC_PASSWORD_POLICIES_EVENT_NAMES } from './events.public.password.policies';
import { getClientIp } from '../helpers/get.client.ip.from.req';

/**
 * Rate limiting store for tracking requests per IP
 * In production, this should use Redis or similar distributed store
 */
interface RateLimitEntry {
  requestCount: number;
  windowStart: number;
  lastReset: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Rate limiting configuration
 */
const RATE_LIMIT_CONFIG = {
  WINDOW_SIZE_MINUTES: 1,        // 1 minute window
  MAX_REQUESTS_PER_MINUTE: 10,   // 10 requests per minute
  WINDOW_SIZE_HOURS: 1,          // 1 hour window  
  MAX_REQUESTS_PER_HOUR: 100,    // 100 requests per hour
  CLEANUP_INTERVAL: 300000       // Clean up old entries every 5 minutes
};

/**
 * Check rate limiting for client IP
 * Returns true if client is within limits, false if exceeded
 */
function checkRateLimit(clientIp: string, userAgent: string): boolean {
  const now = Date.now();
  const minuteWindow = RATE_LIMIT_CONFIG.WINDOW_SIZE_MINUTES * 60 * 1000;
  const hourWindow = RATE_LIMIT_CONFIG.WINDOW_SIZE_HOURS * 60 * 60 * 1000;
  
  // Get or create rate limit entry for this IP
  let entry = rateLimitStore.get(clientIp);
  if (!entry) {
    entry = {
      requestCount: 0,
      windowStart: now,
      lastReset: now
    };
    rateLimitStore.set(clientIp, entry);
  }

  // Check if we need to reset the window (for minute-based limiting)
  if (now - entry.windowStart >= minuteWindow) {
    entry.requestCount = 0;
    entry.windowStart = now;
  }

  // Check if we need to reset for hour-based limiting
  if (now - entry.lastReset >= hourWindow) {
    entry.requestCount = 0;
    entry.lastReset = now;
    entry.windowStart = now;
  }

  // Check minute limit
  if (entry.requestCount >= RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_MINUTE) {
    // Log rate limit exceeded
    fabricEvents.createAndPublishEvent({
      eventName: PUBLIC_PASSWORD_POLICIES_EVENT_NAMES.RATE_LIMIT_EXCEEDED,
      payload: {
        clientIp,
        userAgent,
        requestCount: entry.requestCount,
        timeWindow: 'minute',
        limit: RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_MINUTE
      }
    });
    
    return false;
  }

  // Increment request count
  entry.requestCount++;
  rateLimitStore.set(clientIp, entry);
  
  return true;
}

/**
 * Cleanup old rate limit entries (called periodically)
 */
function cleanupRateLimitStore(): void {
  const now = Date.now();
  const hourWindow = RATE_LIMIT_CONFIG.WINDOW_SIZE_HOURS * 60 * 60 * 1000;
  
  for (const [ip, entry] of rateLimitStore.entries()) {
    if (now - entry.lastReset > hourWindow * 2) { // Keep entries for 2 hours
      rateLimitStore.delete(ip);
    }
  }
}

/**
 * Start periodic cleanup of rate limit store
 */
setInterval(cleanupRateLimitStore, RATE_LIMIT_CONFIG.CLEANUP_INTERVAL);

/**
 * Validate request parameters for public password policies endpoint
 */
function validateRequest(req: Request): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // This endpoint accepts GET requests with no parameters
  // All validation is handled in the service layer
  
  // Basic request validation
  if (req.method !== 'GET') {
    errors.push('Only GET method is allowed');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Main controller function for fetching public password policies
 * @param req Express request
 * @param res Express response
 */
export async function fetchPublicPasswordPoliciesController(req: Request, res: Response): Promise<void> {
  const clientIp = await getClientIp(req);
  const userAgent = req.headers['user-agent'] || 'unknown';
  const startTime = Date.now();

  try {
    // Validate request
    const validation = validateRequest(req);
    if (!validation.isValid) {
      fabricEvents.createAndPublishEvent({
        eventName: PUBLIC_PASSWORD_POLICIES_EVENT_NAMES.VALIDATION_ERROR,
        req,
        payload: {
          requestId: 'unknown',
          clientIp,
          errorMessage: 'Request validation failed',
          invalidFields: validation.errors
        }
      });

      res.status(400).json({
        success: false,
        error: 'Invalid request',
        details: validation.errors
      });
      return;
    }

    // Check rate limiting
    if (!checkRateLimit(clientIp, userAgent)) {
      const retryAfter = Math.ceil(RATE_LIMIT_CONFIG.WINDOW_SIZE_MINUTES * 60); // seconds until next window
      
      res.set({
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Limit': RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_MINUTE.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': (Math.floor(Date.now() / 1000) + retryAfter).toString()
      });

      res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        retryAfter: retryAfter,
        message: `Too many requests. Please try again in ${retryAfter} seconds.`
      });
      return;
    }

    // Call service to fetch password policies
    const result = await fetchPublicPasswordPolicies(req);
    const responseTime = Date.now() - startTime;

    // Set response headers
    res.set({
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate', // No caching for public password policies
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Response-Time': `${responseTime}ms`
    });

    // Add rate limit headers
    const entry = rateLimitStore.get(clientIp);
    if (entry) {
      res.set({
        'X-RateLimit-Limit': RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_MINUTE.toString(),
        'X-RateLimit-Remaining': Math.max(0, RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_MINUTE - entry.requestCount).toString(),
        'X-RateLimit-Reset': (Math.floor((entry.windowStart + (RATE_LIMIT_CONFIG.WINDOW_SIZE_MINUTES * 60 * 1000)) / 1000)).toString()
      });
    }

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const responseTime = Date.now() - startTime;
    
    // Log HTTP error
    fabricEvents.createAndPublishEvent({
      eventName: PUBLIC_PASSWORD_POLICIES_EVENT_NAMES.HTTP_ERROR,
      req,
      payload: {
        requestId: 'unknown',
        clientIp,
        statusCode: 500,
        errorMessage,
        stack: error instanceof Error ? error.stack || '' : ''
      },
      errorData: errorMessage
    });

    res.set({
      'Content-Type': 'application/json',
      'X-Response-Time': `${responseTime}ms`
    });

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred while fetching password policies'
    });
  }
}

/**
 * Export default for ES modules compatibility
 */
export default fetchPublicPasswordPoliciesController; 