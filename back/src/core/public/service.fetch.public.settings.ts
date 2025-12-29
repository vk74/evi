/**
 * service.fetch.public.settings.ts - backend file
 * version: 1.3.0
 * Service for fetching public settings that are accessible without authentication.
 * 
 * Public settings include:
 * - Application.Appearance → navbar.backgroundcolor
 * - AdminProducts → card.color
 * - Catalog.Services → card.color
 * - AdminProducts → display.optionsOnlyProducts
 * 
 * Changes in v1.1.0:
 * - Renamed PublicUiSetting/PublicUiSettingsResponse to PublicSetting/PublicSettingsResponse
 * - Renamed fetchPublicUiSettings to fetchPublicSettings
 * - Kept endpoint focused on public settings terminology across backend
 * 
 * Changes in v1.2.0:
 * - Updated event bus integration to use PUBLIC_SETTINGS_EVENT_NAMES
 * - Removed legacy UI settings terminology from event names
 * 
 * Changes in v1.3.0:
 * - Updated section_path from 'Admin.Products' to 'AdminProducts' (removed dot)
 */

import { Request } from 'express';
import { getSettingValue } from '../helpers/get.setting.value';
import fabricEvents from '../eventBus/fabric.events';
import { PUBLIC_SETTINGS_EVENT_NAMES } from './events.public.policies';
import { v4 as uuidv4 } from 'uuid';
import { getClientIp } from '../helpers/get.client.ip.from.req';

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

    // Define public settings to fetch
    const publicSettings: PublicSetting[] = [];

    // 1. Navigation bar background color
    const navbarColor = await getSettingValue<string>(
      'Application.Appearance',
      'navbar.backgroundcolor',
      '#26A69A'
    );
    publicSettings.push({
      section_path: 'Application.Appearance',
      setting_name: 'navbar.backgroundcolor',
      value: navbarColor,
      is_public: true
    });

    // 2. Product card color
    const productCardColor = await getSettingValue<string>(
      'AdminProducts',
      'card.color',
      '#E8F4F8'
    );
    publicSettings.push({
      section_path: 'AdminProducts',
      setting_name: 'card.color',
      value: productCardColor,
      is_public: true
    });

    // 3. Service card color
    const serviceCardColor = await getSettingValue<string>(
      'Catalog.Services',
      'card.color',
      '#F5F5F5'
    );
    publicSettings.push({
      section_path: 'Catalog.Services',
      setting_name: 'card.color',
      value: serviceCardColor,
      is_public: true
    });

    // 4. Display options-only products setting
    const displayOptionsOnlyProducts = await getSettingValue<boolean>(
      'AdminProducts',
      'display.optionsOnlyProducts',
      false
    );
    publicSettings.push({
      section_path: 'AdminProducts',
      setting_name: 'display.optionsOnlyProducts',
      value: displayOptionsOnlyProducts,
      is_public: true
    });

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
