/**
 * service.fetch.public.password.policies.ts - backend file
 * version: 1.0.0
 * Service for fetching public password policy settings.
 * Uses cache first, falls back to database queries if needed.
 * Provides structured response for public consumption.
 */

import { Request } from 'express';
import { Pool, QueryResult } from 'pg';
import { pool as pgPool } from '../db/maindb';
import { getSetting, getAllSettings } from '../../modules/admin/settings/cache.settings';
import { 
  passwordPoliciesQueries, 
  ALLOWED_PUBLIC_PASSWORD_POLICY_SETTINGS,
  DEFAULT_PASSWORD_POLICIES,
  PASSWORD_POLICIES_SECTION_PATH
} from './queries.public.password.policies';
import fabricEvents from '../eventBus/fabric.events';
import { PUBLIC_PASSWORD_POLICIES_EVENT_NAMES } from './events.public.password.policies';
import { v4 as uuidv4 } from 'uuid';

// Type assertion for pool
const pool = pgPool as Pool;

/**
 * Interface for public password policies response
 */
export interface PublicPasswordPoliciesResponse {
  success: boolean;
  passwordPolicies?: {
    minLength: number;
    maxLength: number;
    requireLowercase: boolean;
    requireUppercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    allowedSpecialChars: string;
  };
  cachedAt?: string;
  error?: string;
}

/**
 * Interface for internal password policy setting
 */
interface PasswordPolicySetting {
  setting_name: string;
  value: any;
  default_value: any;
  confidentiality: boolean;
  section_path: string;
  description?: string;
}

/**
 * Get client IP address from request
 */
function getClientIp(req: Request): string {
  return (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress || 
         'unknown';
}

/**
 * Transform raw settings into structured password policies object
 */
function transformToPasswordPolicies(settings: PasswordPolicySetting[]): PublicPasswordPoliciesResponse['passwordPolicies'] {
  const policies = {
    minLength: 8,
    maxLength: 40,
    requireLowercase: true,
    requireUppercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
    allowedSpecialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?'
  };

  // Map database settings to structured format
  settings.forEach(setting => {
    const value = setting.value !== null ? setting.value : setting.default_value;
    
    switch (setting.setting_name) {
      case 'password.min.length':
        policies.minLength = Number(value) || policies.minLength;
        break;
      case 'password.max.length':
        policies.maxLength = Number(value) || policies.maxLength;
        break;
      case 'password.require.lowercase':
        policies.requireLowercase = Boolean(value);
        break;
      case 'password.require.uppercase':
        policies.requireUppercase = Boolean(value);
        break;
      case 'password.require.numbers':
        policies.requireNumbers = Boolean(value);
        break;
      case 'password.require.special.chars':
        policies.requireSpecialChars = Boolean(value);
        break;
      case 'password.allowed.special.chars':
        policies.allowedSpecialChars = String(value) || policies.allowedSpecialChars;
        break;
    }
  });

  return policies;
}

/**
 * Fetch password policies from cache
 */
function fetchFromCache(requestId: string, clientIp: string): PasswordPolicySetting[] | null {
  try {
    const cachedSettings: PasswordPolicySetting[] = [];
    
    // Try to get each password policy setting from cache
    for (const settingName of ALLOWED_PUBLIC_PASSWORD_POLICY_SETTINGS) {
      const setting = getSetting(PASSWORD_POLICIES_SECTION_PATH, settingName);
      if (setting) {
        cachedSettings.push({
          setting_name: setting.setting_name,
          value: setting.value,
          default_value: setting.default_value,
          confidentiality: setting.confidentiality,
          section_path: setting.section_path,
          description: setting.description
        });
      }
    }

    if (cachedSettings.length > 0) {
      // Log cache hit
      fabricEvents.createAndPublishEvent({
        eventName: PUBLIC_PASSWORD_POLICIES_EVENT_NAMES.CACHE_HIT,
        payload: {
          requestId,
          sectionPath: PASSWORD_POLICIES_SECTION_PATH,
          settingsFound: cachedSettings.length,
          cacheSource: 'settings_cache'
        }
      });
      
      return cachedSettings;
    }

    // Log cache miss
    fabricEvents.createAndPublishEvent({
      eventName: PUBLIC_PASSWORD_POLICIES_EVENT_NAMES.CACHE_MISS,
      payload: {
        requestId,
        sectionPath: PASSWORD_POLICIES_SECTION_PATH,
        fallbackUsed: true
      }
    });

    return null;
  } catch (error) {
    // Log cache error
    fabricEvents.createAndPublishEvent({
      eventName: PUBLIC_PASSWORD_POLICIES_EVENT_NAMES.SERVICE_ERROR,
      payload: {
        requestId,
        errorMessage: error instanceof Error ? error.message : 'Unknown cache error',
        errorCode: 'CACHE_ERROR',
        operation: 'fetchFromCache'
      },
      errorData: error instanceof Error ? error.message : 'Unknown error'
    });

    return null;
  }
}

/**
 * Fetch password policies from database (fallback)
 */
async function fetchFromDatabase(requestId: string): Promise<PasswordPolicySetting[]> {
  try {
    // Log fallback database query
    fabricEvents.createAndPublishEvent({
      eventName: PUBLIC_PASSWORD_POLICIES_EVENT_NAMES.FALLBACK_DB_QUERY,
      payload: {
        requestId,
        sectionPath: PASSWORD_POLICIES_SECTION_PATH,
        queryExecuted: 'fetchPasswordPoliciesBySection',
        resultsCount: 0 // Will be updated after query
      }
    });

    const result: QueryResult<PasswordPolicySetting> = await pool.query(
      passwordPoliciesQueries.fetchPasswordPoliciesBySection.text,
      [PASSWORD_POLICIES_SECTION_PATH]
    );

    // Update the event with actual results count
    fabricEvents.createAndPublishEvent({
      eventName: PUBLIC_PASSWORD_POLICIES_EVENT_NAMES.FALLBACK_DB_QUERY,
      payload: {
        requestId,
        sectionPath: PASSWORD_POLICIES_SECTION_PATH,
        queryExecuted: 'fetchPasswordPoliciesBySection',
        resultsCount: result.rows.length
      }
    });

    return result.rows;
  } catch (error) {
    fabricEvents.createAndPublishEvent({
      eventName: PUBLIC_PASSWORD_POLICIES_EVENT_NAMES.SERVICE_ERROR,
      payload: {
        requestId,
        errorMessage: error instanceof Error ? error.message : 'Unknown database error',
        errorCode: 'DATABASE_ERROR',
        operation: 'fetchFromDatabase'
      },
      errorData: error instanceof Error ? error.message : 'Unknown error'
    });

    throw error;
  }
}

/**
 * Main service function to fetch public password policies
 * @param req Express request object
 * @returns Promise resolving to structured password policies response
 */
export async function fetchPublicPasswordPolicies(req: Request): Promise<PublicPasswordPoliciesResponse> {
  const requestId = uuidv4();
  const clientIp = getClientIp(req);
  const startTime = Date.now();

  try {
    // Log request received
    fabricEvents.createAndPublishEvent({
      eventName: PUBLIC_PASSWORD_POLICIES_EVENT_NAMES.REQUEST_RECEIVED,
      req,
      payload: {
        requestId,
        clientIp,
        userAgent: req.headers['user-agent'] || 'unknown',
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url
      }
    });

    let settings: PasswordPolicySetting[] = [];

    // Try cache first
    const cachedSettings = fetchFromCache(requestId, clientIp);
    if (cachedSettings && cachedSettings.length > 0) {
      settings = cachedSettings;
    } else {
      // Fallback to database
      try {
        settings = await fetchFromDatabase(requestId);
      } catch (dbError) {
        // If database also fails, use defaults
        console.warn('Database fallback failed, using default password policies');
        settings = Object.entries(DEFAULT_PASSWORD_POLICIES).map(([key, value]) => ({
          setting_name: key,
          value: value,
          default_value: value,
          confidentiality: false,
          section_path: PASSWORD_POLICIES_SECTION_PATH
        }));
      }
    }

    // Transform to structured format
    const passwordPolicies = transformToPasswordPolicies(settings);
    const responseTime = Date.now() - startTime;

    // Log successful response
    fabricEvents.createAndPublishEvent({
      eventName: PUBLIC_PASSWORD_POLICIES_EVENT_NAMES.RESPONSE_SENT,
      req,
      payload: {
        requestId,
        clientIp,
        statusCode: 200,
        responseTime,
        cacheUsed: cachedSettings !== null,
        policiesCount: passwordPolicies ? Object.keys(passwordPolicies).length : 0
      }
    });

    return {
      success: true,
      passwordPolicies,
      cachedAt: new Date().toISOString()
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Log error
    fabricEvents.createAndPublishEvent({
      eventName: PUBLIC_PASSWORD_POLICIES_EVENT_NAMES.SERVICE_ERROR,
      req,
      payload: {
        requestId,
        errorMessage,
        errorCode: 'SERVICE_ERROR',
        operation: 'fetchPublicPasswordPolicies'
      },
      errorData: errorMessage
    });

    return {
      success: false,
      error: 'Failed to fetch password policies'
    };
  }
} 