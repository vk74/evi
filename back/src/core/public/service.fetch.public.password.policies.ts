/**
 * service.fetch.public.password.policies.ts - backend file
 * version: 1.0.1
 * Service for fetching public password policy settings.
 * Uses centralized settings service for data access.
 * Provides structured response for public consumption.
 */

import { Request } from 'express';
import { fetchSettingsBySection } from '../../modules/admin/settings/service.fetch.settings';
import fabricEvents from '../eventBus/fabric.events';
import { PUBLIC_PASSWORD_POLICIES_EVENT_NAMES } from './events.public.password.policies';
import { v4 as uuidv4 } from 'uuid';
import { getClientIp } from '../helpers/get.client.ip.from.req';

// Constants moved from deleted queries file
const PASSWORD_POLICIES_SECTION_PATH = 'Application.Security.PasswordPolicies';

const ALLOWED_PUBLIC_PASSWORD_POLICY_SETTINGS = [
  'password.min.length',
  'password.max.length', 
  'password.require.lowercase',
  'password.require.uppercase',
  'password.require.numbers',
  'password.require.special.chars',
  'password.allowed.special.chars'
];

const DEFAULT_PASSWORD_POLICIES = {
  'password.min.length': 8,
  'password.max.length': 40,
  'password.require.lowercase': true,
  'password.require.uppercase': true, 
  'password.require.numbers': true,
  'password.require.special.chars': false,
  'password.allowed.special.chars': '!@#$%^&*()_+-=[]{}|;:,.<>?'
};

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
 * Fetch password policies using centralized settings service
 */
async function fetchPasswordPoliciesFromSettings(requestId: string, req: Request): Promise<PasswordPolicySetting[]> {
  try {
    // Use centralized settings service
    const settings = await fetchSettingsBySection({
      sectionPath: PASSWORD_POLICIES_SECTION_PATH,
      includeConfidential: false
    }, req);

    // Filter to only allowed password policy settings
    const filteredSettings = settings.filter(setting => 
      ALLOWED_PUBLIC_PASSWORD_POLICY_SETTINGS.includes(setting.setting_name)
    );

    // Log successful fetch
    fabricEvents.createAndPublishEvent({
      eventName: PUBLIC_PASSWORD_POLICIES_EVENT_NAMES.CACHE_HIT,
      payload: {
        requestId,
        sectionPath: PASSWORD_POLICIES_SECTION_PATH,
        settingsFound: filteredSettings.length,
        cacheSource: 'settings_service'
      }
    });

    return filteredSettings.map(setting => ({
      setting_name: setting.setting_name,
      value: setting.value,
      default_value: setting.default_value,
      confidentiality: setting.confidentiality,
      section_path: setting.section_path,
      description: setting.description
    }));
  } catch (error) {
    // Log service error
    fabricEvents.createAndPublishEvent({
      eventName: PUBLIC_PASSWORD_POLICIES_EVENT_NAMES.SERVICE_ERROR,
      payload: {
        requestId,
        errorMessage: error instanceof Error ? error.message : 'Unknown settings service error',
        errorCode: 'SETTINGS_SERVICE_ERROR',
        operation: 'fetchPasswordPoliciesFromSettings'
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
  const clientIp = await getClientIp(req);
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

    try {
      // Use centralized settings service
      settings = await fetchPasswordPoliciesFromSettings(requestId, req);
    } catch (settingsError) {
      // If settings service fails, use defaults
      console.warn('Settings service failed, using default password policies');
      settings = Object.entries(DEFAULT_PASSWORD_POLICIES).map(([key, value]) => ({
        setting_name: key,
        value: value,
        default_value: value,
        confidentiality: false,
        section_path: PASSWORD_POLICIES_SECTION_PATH
      }));
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