/**
 * @file connection.handler.ts
 * @version 1.0.04
 * @description Backend file. Provides a universal handler for Express controllers in the evi backend application.
 * The handler standardizes HTTP connection and error handling for all controllers. It accepts a business logic function (async),
 * executes it, and sends a standard response or error. The business logic itself remains in the controller or service files.
 * This file includes comprehensive event logging for monitoring and debugging purposes.
 * Now includes built-in rate limiting functionality.
 */

import { Request, Response, NextFunction } from 'express';
import fabricEvents from '../eventBus/fabric.events';
import { CONNECTION_HANDLER_EVENTS } from './events.connection.handler';
import { getSetting, parseSettingValue } from '../../modules/admin/settings/cache.settings';
// Rate limiting configuration
interface RateLimitConfig {
  enabled?: boolean;
  maxRequestsPerMinute?: number;
  maxRequestsPerHour?: number;
  blockDurationMinutes?: number;
}

// Кеширование конфигурации rate limiting
let rateLimitConfigCache: RateLimitConfig | null = null;
let lastConfigRefresh = 0;
const CONFIG_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 минут

/**
 * Обновляет конфигурацию rate limiting из кеша настроек
 * @returns Rate limiting configuration
 */
async function refreshRateLimitConfig(): Promise<RateLimitConfig> {
  const now = Date.now();
  
  // Проверяем, нужно ли обновлять кеш
  if (rateLimitConfigCache && (now - lastConfigRefresh) < CONFIG_REFRESH_INTERVAL) {
    return rateLimitConfigCache;
  }
  
  try {
    const enabledSetting = getSetting('Application.Security.SessionManagement', 'rate.limiting.enabled');
    const maxRequestsPerMinuteSetting = getSetting('Application.Security.SessionManagement', 'rate.limiting.max.requests.per.minute');
    const maxRequestsPerHourSetting = getSetting('Application.Security.SessionManagement', 'rate.limiting.max.requests.per.hour');
    const blockDurationSetting = getSetting('Application.Security.SessionManagement', 'rate.limiting.block.duration.minutes');

    const config = {
      enabled: enabledSetting ? parseSettingValue(enabledSetting) : false,
      maxRequestsPerMinute: maxRequestsPerMinuteSetting ? parseSettingValue(maxRequestsPerMinuteSetting) : 100,
      maxRequestsPerHour: maxRequestsPerHourSetting ? parseSettingValue(maxRequestsPerHourSetting) : 1000,
      blockDurationMinutes: blockDurationSetting ? parseSettingValue(blockDurationSetting) : 5
    };

    rateLimitConfigCache = config;
    lastConfigRefresh = now;
    
    // Log config refresh for debugging
    const source = enabledSetting ? 'cache' : 'defaults';
    
    // Create event for rate limiting config refresh
    await fabricEvents.createAndPublishEvent({
      eventName: CONNECTION_HANDLER_EVENTS.RATE_LIMIT_CONFIG_REFRESHED.eventName,
      payload: {
        source,
        enabled: config.enabled,
        maxRequestsPerMinute: config.maxRequestsPerMinute,
        maxRequestsPerHour: config.maxRequestsPerHour,
        blockDurationMinutes: config.blockDurationMinutes,
        refreshTime: new Date().toISOString()
      }
    });

    return config;
  } catch (error) {
    // Log error and throw to prevent fallback to defaults
    await fabricEvents.createAndPublishEvent({
      eventName: CONNECTION_HANDLER_EVENTS.RATE_LIMIT_CONFIG_REFRESH_ERROR.eventName,
      payload: {
        error: error instanceof Error ? error.message : String(error),
        operation: 'refreshRateLimitConfig'
      },
      errorData: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

/**
 * Get rate limiting configuration from cache with periodic refresh
 * @returns Rate limiting configuration
 */
async function getRateLimitConfigFromCache(): Promise<RateLimitConfig> {
  return await refreshRateLimitConfig();
}

// In-memory rate limiting store
const rateLimitStore = new Map<string, {
  requestCount: number;
  windowStart: number;
  lastReset: number;
  blockedUntil?: number;
  lastAccess: number; // Добавляем время последнего доступа
}>();

// Константы для очистки
const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 час
const MAX_ENTRY_AGE = 1 * 60 * 60 * 1000; // 1 час
const MAX_STORE_SIZE = 500000; // Максимальный размер Map (500k записей)

/**
 * Очищает устаревшие записи из rate limit store
 */
function cleanupRateLimitStore(): void {
  const now = Date.now();
  const entriesToDelete: string[] = [];
  
  // Собираем записи для удаления
  for (const [clientId, entry] of rateLimitStore.entries()) {
    if (now - entry.lastAccess > MAX_ENTRY_AGE) {
      entriesToDelete.push(clientId);
    }
  }
  
  // Удаляем устаревшие записи
  entriesToDelete.forEach(clientId => rateLimitStore.delete(clientId));
  
  // Если Map слишком большой, удаляем самые старые записи
  if (rateLimitStore.size > MAX_STORE_SIZE) {
    const sortedEntries = Array.from(rateLimitStore.entries())
      .sort((a, b) => a[1].lastAccess - b[1].lastAccess);
    
    const toRemove = sortedEntries.slice(0, rateLimitStore.size - MAX_STORE_SIZE + 1000);
    toRemove.forEach(([clientId]) => rateLimitStore.delete(clientId));
  }
  
  // Логируем очистку только если что-то удалили
  if (entriesToDelete.length > 0) {
    fabricEvents.createAndPublishEvent({
      eventName: CONNECTION_HANDLER_EVENTS.RATE_LIMIT_STORE_CLEANUP.eventName,
      payload: {
        deletedEntries: entriesToDelete.length,
        remainingEntries: rateLimitStore.size
      }
    });
  }
}

// Периодическая очистка раз в час
setInterval(cleanupRateLimitStore, CLEANUP_INTERVAL);

// Rate limiting function
async function checkRateLimit(req: Request, config?: RateLimitConfig): Promise<{
  allowed: boolean;
  retryAfter?: number;
  remainingRequests?: number;
  resetTime?: number;
  reason?: string;
}> {
  // Get config from cache (без fallback к дефолтам)
  const rateLimitConfig = config || await getRateLimitConfigFromCache();
  
  if (!rateLimitConfig.enabled) {
    return { allowed: true };
  }

  const clientId = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown';
  
  // Исключить localhost из rate limiting для корректного тестирования
  if (clientId === '127.0.0.1' || clientId === '::1' || clientId === 'localhost') {
    return { allowed: true };
  }
  
  // Проверяем, что все необходимые настройки доступны
  if (rateLimitConfig.maxRequestsPerMinute === undefined || 
      rateLimitConfig.maxRequestsPerHour === undefined) {
    throw new Error('Rate limiting configuration is incomplete');
  }
  
  const now = Date.now();
  const minuteWindow = 60 * 1000; // 1 minute in milliseconds
  const hourWindow = 60 * 60 * 1000; // 1 hour in milliseconds
  
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
    // Обновляем время последнего доступа
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
  if (entry.requestCount >= rateLimitConfig.maxRequestsPerMinute!) {
    if (rateLimitConfig.blockDurationMinutes) {
      entry.blockedUntil = now + (rateLimitConfig.blockDurationMinutes * 60 * 1000);
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

  if (entry.requestCount >= rateLimitConfig.maxRequestsPerHour!) {
    const retryAfter = Math.ceil(hourWindow / 1000);
    return {
      allowed: false,
      retryAfter,
      resetTime: Math.floor((entry.lastReset + hourWindow) / 1000),
      reason: 'hour_limit_exceeded'
    };
  }

  // Increment and return success
  entry.requestCount++;
  rateLimitStore.set(clientId, entry);
  
  const remainingRequests = Math.min(
    rateLimitConfig.maxRequestsPerMinute! - entry.requestCount,
    rateLimitConfig.maxRequestsPerHour! - entry.requestCount
  );
  
  return {
    allowed: true,
    remainingRequests,
    resetTime: Math.floor((entry.windowStart + minuteWindow) / 1000)
  };
}

// Define error code type
type ErrorCode = 'INVALID_REQUEST' | 'REQUIRED_FIELD_ERROR' | 'VALIDATION_ERROR' | 
                'NOT_FOUND' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'CONFLICT' | 
                'RATE_LIMIT_EXCEEDED' | 'TEMPORARILY_BLOCKED' | 'INTERNAL_SERVER_ERROR';

// Error status code mapping
const ERROR_STATUS_CODES: Record<ErrorCode, number> = {
  'INVALID_REQUEST': 400,
  'REQUIRED_FIELD_ERROR': 400,
  'VALIDATION_ERROR': 400,
  'NOT_FOUND': 404,
  'UNAUTHORIZED': 401,
  'FORBIDDEN': 403,
  'CONFLICT': 409,
  'RATE_LIMIT_EXCEEDED': 429,
  'TEMPORARILY_BLOCKED': 429,
  'INTERNAL_SERVER_ERROR': 500
};

/**
 * Universal handler for Express controllers.
 * Accepts business logic, handles errors, and sends a standard response.
 * Includes comprehensive event logging for monitoring and debugging.
 *
 * @param controllerLogic - async function implementing business logic (req, res) => any
 * @param controllerName - optional name for identifying the controller in logs
 * @returns Express middleware
 */
export function connectionHandler<T = any>(
  controllerLogic: (req: Request, res: Response) => Promise<T>,
  controllerName?: string,
  rateLimitConfig?: RateLimitConfig
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] || `req-${Date.now()}`;
    const controller = controllerName || 'unknown';
    const ipAddress = req.ip || req.connection?.remoteAddress || 'unknown';
    
    try {
      // Rate limiting check - FIRST, before any other processing
      const rateLimitResult = await checkRateLimit(req, rateLimitConfig);
      
      // Log rate limit check
      await fabricEvents.createAndPublishEvent({
        req,
        eventName: CONNECTION_HANDLER_EVENTS.RATE_LIMIT_CHECK.eventName,
        payload: {
          controllerName: controller,
          requestId,
          ipAddress,
          allowed: rateLimitResult.allowed,
          remainingRequests: rateLimitResult.remainingRequests,
          reason: rateLimitResult.reason
        }
      });

      // If rate limit exceeded, return error immediately
      if (!rateLimitResult.allowed) {
        // Log rate limit exceeded event
        await fabricEvents.createAndPublishEvent({
          req,
          eventName: CONNECTION_HANDLER_EVENTS.RATE_LIMIT_EXCEEDED.eventName,
          payload: {
            controllerName: controller,
            requestId,
            ipAddress,
            reason: rateLimitResult.reason,
            retryAfter: rateLimitResult.retryAfter
          }
        });

        // Set rate limit headers
        res.set({
          'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimitResult.resetTime?.toString() || Math.floor(Date.now() / 1000 + 60).toString()
        });

        // Return rate limit error
        const errorCode = rateLimitResult.reason === 'temporarily_blocked' ? 'TEMPORARILY_BLOCKED' : 'RATE_LIMIT_EXCEEDED';
        const errorResponse = {
          code: errorCode,
          message: rateLimitResult.reason === 'temporarily_blocked' 
            ? 'Too many requests. Please try again later.'
            : 'Rate limit exceeded',
          retryAfter: rateLimitResult.retryAfter,
          details: process.env.NODE_ENV === 'development' ? rateLimitResult.reason : undefined
        };

        res.status(429).json(errorResponse);
        return;
      }

      // Set rate limit headers for successful requests
      if (rateLimitResult.remainingRequests !== undefined && rateLimitResult.resetTime) {
        res.set({
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': rateLimitResult.remainingRequests.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
        });
      }

      // Log request received with enhanced details
      await fabricEvents.createAndPublishEvent({
        req,
        eventName: CONNECTION_HANDLER_EVENTS.REQUEST_RECEIVED.eventName,
        payload: {
          method: req.method,
          url: req.url,
          controllerName: controller,
          requestId,
          userAgent: req.headers['user-agent'],
          ipAddress
        }
      });

      // Log HTTP method specific event
      const methodEventMap = {
        'GET': CONNECTION_HANDLER_EVENTS.REQUEST_GET,
        'POST': CONNECTION_HANDLER_EVENTS.REQUEST_POST,
        'PUT': CONNECTION_HANDLER_EVENTS.REQUEST_PUT,
        'DELETE': CONNECTION_HANDLER_EVENTS.REQUEST_DELETE
      };

      const methodEvent = methodEventMap[req.method as keyof typeof methodEventMap];
      if (methodEvent) {
        await fabricEvents.createAndPublishEvent({
          req,
          eventName: methodEvent.eventName,
          payload: {
            url: req.url,
            controllerName: controller,
            requestId,
            ...(req.method === 'GET' && { queryParams: req.query }),
            ...(req.method === 'POST' || req.method === 'PUT') && { bodySize: JSON.stringify(req.body).length }
          }
        });
      }

      // Log business logic start
      await fabricEvents.createAndPublishEvent({
        req,
        eventName: CONNECTION_HANDLER_EVENTS.BUSINESS_LOGIC_START.eventName,
        payload: {
          controllerName: controller,
          requestId
        }
      });

      const result = await controllerLogic(req, res);
      
      const duration = Date.now() - startTime;
      const responseSize = JSON.stringify(result).length;

      // Log business logic complete
      await fabricEvents.createAndPublishEvent({
        req,
        eventName: CONNECTION_HANDLER_EVENTS.BUSINESS_LOGIC_COMPLETE.eventName,
        payload: {
          controllerName: controller,
          responseSize,
          duration
        }
      });

      // If the controller already sent a response, do not send again
      if (!res.headersSent) {
        res.status(200).json(result);
      }

      // Log response sent with status code specific event
      await fabricEvents.createAndPublishEvent({
        req,
        eventName: CONNECTION_HANDLER_EVENTS.RESPONSE_SENT_200.eventName,
        payload: {
          controllerName: controller,
          responseSize,
          duration
        }
      });

    } catch (error: any) {
      const duration = Date.now() - startTime;
      const errorCode = (error.code || 'INTERNAL_SERVER_ERROR') as ErrorCode;
      const statusCode = ERROR_STATUS_CODES[errorCode] || 500;

      // Log business logic error
      await fabricEvents.createAndPublishEvent({
        req,
        eventName: CONNECTION_HANDLER_EVENTS.BUSINESS_LOGIC_ERROR.eventName,
        payload: {
          controllerName: controller,
          errorCode,
          errorType: error.constructor.name,
          duration
        },
        errorData: error.message || String(error)
      });

      if (!res.headersSent) {
        // Use structured error response if available, otherwise create one
        const errorResponse = error.code ? {
          code: error.code,
          message: error.message || 'An error occurred',
          details: error.details || (process.env.NODE_ENV === 'development' ? String(error) : undefined)
        } : {
          code: errorCode,
          message: 'An error occurred while processing your request',
          details: process.env.NODE_ENV === 'development' ? String(error) : undefined
        };

        res.status(statusCode).json(errorResponse);

        // Log error response sent with status code specific event
        const statusEventMap = {
          400: CONNECTION_HANDLER_EVENTS.RESPONSE_SENT_400,
          401: CONNECTION_HANDLER_EVENTS.RESPONSE_SENT_401,
          403: CONNECTION_HANDLER_EVENTS.RESPONSE_SENT_403,
          404: CONNECTION_HANDLER_EVENTS.RESPONSE_SENT_404,
          429: CONNECTION_HANDLER_EVENTS.RATE_LIMIT_EXCEEDED,
          500: CONNECTION_HANDLER_EVENTS.RESPONSE_SENT_500
        };

        const statusEvent = statusEventMap[statusCode as keyof typeof statusEventMap];
        if (statusEvent) {
          await fabricEvents.createAndPublishEvent({
            req,
            eventName: statusEvent.eventName,
            payload: {
              controllerName: controller,
              errorCode,
              errorType: error.constructor.name,
              duration
            },
            errorData: error.message || String(error)
          });
        }
      }
    }
  };
} 