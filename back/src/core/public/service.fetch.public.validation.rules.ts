/**
 * service.fetch.public.validation.rules.ts - backend file
 * version: 1.0.0
 * Service for fetching public validation rules settings.
 * Uses centralized settings service for data access.
 * Provides structured response for public consumption.
 */

import { Request } from 'express';
import { fetchSettingsBySection } from '../../modules/admin/settings/service.fetch.settings';
import fabricEvents from '../eventBus/fabric.events';
import { PUBLIC_VALIDATION_RULES_EVENT_NAMES } from './events.public.policies';
import { v4 as uuidv4 } from 'uuid';
import { getClientIp } from '../helpers/get.client.ip.from.req';

// Constants for validation rules
const VALIDATION_RULES_SECTION_PATH = 'Application.System.DataValidation';

const ALLOWED_VALIDATION_RULES_SETTINGS = [
  'standardFields.allowSpecialChars',
  'standardFields.textMicro.maxLength',
  'standardFields.textMini.maxLength',
  'standardFields.textShort.maxLength',
  'standardFields.textMedium.maxLength',
  'standardFields.textLong.maxLength',
  'standardFields.textExtraLong.maxLength',
  'wellKnownFields.email.regex',
  'wellKnownFields.groupName.allowNumbers',
  'wellKnownFields.groupName.allowUsernameChars',
  'wellKnownFields.groupName.latinOnly',
  'wellKnownFields.groupName.maxLength',
  'wellKnownFields.groupName.minLength',
  'wellKnownFields.telephoneNumber.mask',
  'wellKnownFields.userName.allowNumbers',
  'wellKnownFields.userName.allowUsernameChars',
  'wellKnownFields.userName.latinOnly',
  'wellKnownFields.userName.maxLength',
  'wellKnownFields.userName.minLength'
];


/**
 * Interface for public validation rules response
 */
export interface PublicValidationRulesResponse {
  success: boolean;
  validationRules?: {
    standardFields: {
      textMicro: { maxLength: number };
      textMini: { maxLength: number };
      textShort: { maxLength: number };
      textMedium: { maxLength: number };
      textLong: { maxLength: number };
      textExtraLong: { maxLength: number };
      allowSpecialChars: boolean;
    };
    wellKnownFields: {
      email: {};
      groupName: { 
        minLength: number; 
        maxLength: number; 
        latinOnly: boolean; 
        allowNumbers: boolean; 
        allowUsernameChars: boolean; 
      };
      telephoneNumber: { 
        regex: string;
        mask: string; 
      };
      userName: { 
        minLength: number; 
        maxLength: number; 
        latinOnly: boolean; 
        allowNumbers: boolean; 
        allowUsernameChars: boolean; 
      };
    };
  };
  cachedAt?: string;
  error?: string;
}

/**
 * Interface for internal validation rule setting
 */
interface ValidationRuleSetting {
  setting_name: string;
  value: any;
  default_value: any;
  confidentiality: boolean;
  section_path: string;
  description?: string;
}

/**
 * Transform raw settings into structured validation rules object
 */
function transformToValidationRules(settings: ValidationRuleSetting[]): PublicValidationRulesResponse['validationRules'] {
  const rules = {
    standardFields: {
      textMicro: { maxLength: 5 },
      textMini: { maxLength: 20 },
      textShort: { maxLength: 100 },
      textMedium: { maxLength: 400 },
      textLong: { maxLength: 1000 },
      textExtraLong: { maxLength: 2000 },
      allowSpecialChars: true
    },
    wellKnownFields: {
      email: {
        regex: '^[a-zA-Z0-9.!#$%&\'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$'
      },
      groupName: {
        minLength: 1,
        maxLength: 20,
        latinOnly: true,
        allowNumbers: true,
        allowUsernameChars: true
      },
      telephoneNumber: {
        regex: '^\\\\+?[1-9]\\\\d{1,14}$',
        mask: '+# ### ###-####'
      },
      userName: {
        minLength: 1,
        maxLength: 20,
        latinOnly: true,
        allowNumbers: true,
        allowUsernameChars: true
      }
    }
  };

  // Map database settings to structured format
  settings.forEach(setting => {
    const value = setting.value !== null ? setting.value : setting.default_value;
    
    switch (setting.setting_name) {
      // Standard fields
      case 'standardFields.allowSpecialChars':
        rules.standardFields.allowSpecialChars = Boolean(value);
        break;
      case 'standardFields.textMicro.maxLength':
        rules.standardFields.textMicro.maxLength = Number(value) || rules.standardFields.textMicro.maxLength;
        break;
      case 'standardFields.textMini.maxLength':
        rules.standardFields.textMini.maxLength = Number(value) || rules.standardFields.textMini.maxLength;
        break;
      case 'standardFields.textShort.maxLength':
        rules.standardFields.textShort.maxLength = Number(value) || rules.standardFields.textShort.maxLength;
        break;
      case 'standardFields.textMedium.maxLength':
        rules.standardFields.textMedium.maxLength = Number(value) || rules.standardFields.textMedium.maxLength;
        break;
      case 'standardFields.textLong.maxLength':
        rules.standardFields.textLong.maxLength = Number(value) || rules.standardFields.textLong.maxLength;
        break;
      case 'standardFields.textExtraLong.maxLength':
        rules.standardFields.textExtraLong.maxLength = Number(value) || rules.standardFields.textExtraLong.maxLength;
        break;
      
      // Well-known fields - Group Name
      case 'wellKnownFields.groupName.minLength':
        rules.wellKnownFields.groupName.minLength = Number(value) || rules.wellKnownFields.groupName.minLength;
        break;
      case 'wellKnownFields.groupName.maxLength':
        rules.wellKnownFields.groupName.maxLength = Number(value) || rules.wellKnownFields.groupName.maxLength;
        break;
      case 'wellKnownFields.groupName.latinOnly':
        rules.wellKnownFields.groupName.latinOnly = Boolean(value);
        break;
      case 'wellKnownFields.groupName.allowNumbers':
        rules.wellKnownFields.groupName.allowNumbers = Boolean(value);
        break;
      case 'wellKnownFields.groupName.allowUsernameChars':
        rules.wellKnownFields.groupName.allowUsernameChars = Boolean(value);
        break;
      
      // Well-known fields - Email
      case 'wellKnownFields.email.regex':
        rules.wellKnownFields.email.regex = String(value) || rules.wellKnownFields.email.regex;
        break;
      
      // Well-known fields - Telephone Number
      case 'wellKnownFields.telephoneNumber.mask':
        rules.wellKnownFields.telephoneNumber.mask = String(value) || rules.wellKnownFields.telephoneNumber.mask;
        break;
      
      // Well-known fields - User Name
      case 'wellKnownFields.userName.minLength':
        rules.wellKnownFields.userName.minLength = Number(value) || rules.wellKnownFields.userName.minLength;
        break;
      case 'wellKnownFields.userName.maxLength':
        rules.wellKnownFields.userName.maxLength = Number(value) || rules.wellKnownFields.userName.maxLength;
        break;
      case 'wellKnownFields.userName.latinOnly':
        rules.wellKnownFields.userName.latinOnly = Boolean(value);
        break;
      case 'wellKnownFields.userName.allowNumbers':
        rules.wellKnownFields.userName.allowNumbers = Boolean(value);
        break;
      case 'wellKnownFields.userName.allowUsernameChars':
        rules.wellKnownFields.userName.allowUsernameChars = Boolean(value);
        break;
      // Note: email regex is excluded for security reasons
    }
  });

  return rules;
}

/**
 * Retry mechanism for settings service calls
 */
async function retrySettingsCall<T>(
  operation: () => Promise<T>,
  maxRetries: number = 2,
  delayMs: number = 250
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (attempt < maxRetries) {
        console.warn(`Settings service call failed (attempt ${attempt}/${maxRetries}), retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  
  throw lastError!;
}

/**
 * Fetch validation rules using centralized settings service
 */
async function fetchValidationRulesFromSettings(requestId: string, req: Request): Promise<ValidationRuleSetting[]> {
  try {
    // Use retry mechanism for settings service
    const settings = await retrySettingsCall(async () => {
      return await fetchSettingsBySection({
        sectionPath: VALIDATION_RULES_SECTION_PATH,
        includeConfidential: false
      }, req);
    });

    // Filter to only allowed validation rule settings
    const filteredSettings = settings.filter(setting => 
      ALLOWED_VALIDATION_RULES_SETTINGS.includes(setting.setting_name)
    );

    // Log successful fetch
    fabricEvents.createAndPublishEvent({
      eventName: PUBLIC_VALIDATION_RULES_EVENT_NAMES.CACHE_HIT,
      payload: {
        requestId,
        sectionPath: VALIDATION_RULES_SECTION_PATH,
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
      eventName: PUBLIC_VALIDATION_RULES_EVENT_NAMES.SERVICE_ERROR,
      payload: {
        requestId,
        errorMessage: error instanceof Error ? error.message : 'Unknown settings service error',
        errorCode: 'SETTINGS_SERVICE_ERROR',
        operation: 'fetchValidationRulesFromSettings'
      },
      errorData: error instanceof Error ? error.message : 'Unknown error'
    });

    throw error;
  }
}

/**
 * Main service function to fetch public validation rules
 * @param req Express request object
 * @returns Promise resolving to structured validation rules response
 */
export async function fetchPublicValidationRules(req: Request): Promise<PublicValidationRulesResponse> {
  const requestId = uuidv4();
  const clientIp = await getClientIp(req);
  const startTime = Date.now();

  try {
    // Log request received
    fabricEvents.createAndPublishEvent({
      eventName: PUBLIC_VALIDATION_RULES_EVENT_NAMES.REQUEST_RECEIVED,
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

    // Use centralized settings service with retry
    const settings = await fetchValidationRulesFromSettings(requestId, req);

    // Transform to structured format
    const validationRules = transformToValidationRules(settings);
    const responseTime = Date.now() - startTime;

    // Log successful response
    fabricEvents.createAndPublishEvent({
      eventName: PUBLIC_VALIDATION_RULES_EVENT_NAMES.RESPONSE_SENT,
      req,
      payload: {
        requestId,
        clientIp,
        statusCode: 200,
        responseTime,
        rulesCount: validationRules ? Object.keys(validationRules).length : 0
      }
    });

    return {
      success: true,
      validationRules,
      cachedAt: new Date().toISOString()
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Log error
    fabricEvents.createAndPublishEvent({
      eventName: PUBLIC_VALIDATION_RULES_EVENT_NAMES.SERVICE_ERROR,
      req,
      payload: {
        requestId,
        errorMessage,
        errorCode: 'SERVICE_ERROR',
        operation: 'fetchPublicValidationRules'
      },
      errorData: errorMessage
    });

    return {
      success: false,
      error: 'Failed to fetch validation rules'
    };
  }
}
