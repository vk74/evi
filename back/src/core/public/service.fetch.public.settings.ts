/**
 * service.fetch.public.settings.ts - backend file
 * version: 1.6.0
 * Service for fetching public settings that are accessible without authentication.
 *
 * Changes in v1.6.0:
 * - Replaced hardcoded list with dynamic filter: all settings with is_public=true and confidentiality=false from cache
 * - Single source of truth: is_public flag in app.app_settings
 *
 * Changes in v1.5.0:
 * - Updated section_path from 'AdminCatalog' to 'AdminServices'
 */

import { Request } from 'express';
import fabricEvents from '../eventBus/fabric.events';
import { PUBLIC_SETTINGS_EVENT_NAMES } from './events.public.policies';
import { v4 as uuidv4 } from 'uuid';
import { getClientIp } from '../helpers/get.client.ip.from.req';
import { getAllSettings } from '../../modules/admin/settings/cache.settings';

/**
 * Interface for public setting
 */
export interface PublicSetting {
  section_path: string;
  setting_name: string;
  value: any;
  is_public: boolean;
}

/**
 * Response interface for public settings
 */
export interface PublicSettingsResponse {
  success: boolean;
  settings: PublicSetting[];
  error?: string;
}

/**
 * Fetch public settings from the settings cache
 * These settings are available without authentication
 * 
 * @param req - Express request object (for logging/tracking purposes)
 * @returns Promise resolving to public settings response
 */
export async function fetchPublicSettings(req: Request): Promise<PublicSettingsResponse> {
  // Validate request method
  if (req.method !== 'GET') {
    throw new Error('Only GET method is allowed');
  }

  const requestId = uuidv4();
  const clientIp = getClientIp(req);
  
  try {
    // Log request received
    fabricEvents.createAndPublishEvent({
      eventName: PUBLIC_SETTINGS_EVENT_NAMES.REQUEST_RECEIVED,
      req,
      payload: {
        requestId,
        clientIp,
        userAgent: req.get('user-agent')
      }
    });

    const allSettings = Object.values(getAllSettings());
    const publicSettings: PublicSetting[] = allSettings
      .filter(s => s.is_public === true && !s.confidentiality)
      .map(s => ({
        section_path: s.section_path,
        setting_name: s.setting_name,
        value: s.value,
        is_public: true
      }));

    // Log settings retrieved successfully
    fabricEvents.createAndPublishEvent({
      eventName: PUBLIC_SETTINGS_EVENT_NAMES.SETTINGS_RETRIEVED,
      req,
      payload: {
        requestId,
        settingsCount: publicSettings.length
      }
    });

    // Log response sent
    fabricEvents.createAndPublishEvent({
      eventName: PUBLIC_SETTINGS_EVENT_NAMES.RESPONSE_SENT,
      req,
      payload: {
        requestId,
        settingsCount: publicSettings.length
      }
    });

    return {
      success: true,
      settings: publicSettings
    };

  } catch (error) {
    // Log service error
    fabricEvents.createAndPublishEvent({
      eventName: PUBLIC_SETTINGS_EVENT_NAMES.SERVICE_ERROR,
      req,
      payload: {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });

    // Return error response
    return {
      success: false,
      settings: [],
      error: error instanceof Error ? error.message : 'Failed to fetch public settings'
    };
  }
}
