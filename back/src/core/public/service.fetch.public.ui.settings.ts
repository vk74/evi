/**
 * service.fetch.public.ui.settings.ts - backend file
 * version: 1.0.0
 * Service for fetching public UI settings that are accessible without authentication.
 * 
 * Public UI settings include:
 * - Application.Appearance → navbar.backgroundcolor
 * - Catalog.Products → card.color
 * - Catalog.Services → card.color
 * - Catalog.Products → display.optionsOnlyProducts
 */

import { Request } from 'express';
import { getSettingValue } from '../helpers/get.setting.value';
import fabricEvents from '../eventBus/fabric.events';
import { PUBLIC_UI_SETTINGS_EVENT_NAMES } from './events.public.policies';
import { v4 as uuidv4 } from 'uuid';
import { getClientIp } from '../helpers/get.client.ip.from.req';

/**
 * Interface for public UI setting
 */
export interface PublicUiSetting {
  section_path: string;
  setting_name: string;
  value: any;
  is_ui: boolean;
}

/**
 * Response interface for public UI settings
 */
export interface PublicUiSettingsResponse {
  success: boolean;
  settings: PublicUiSetting[];
  error?: string;
}

/**
 * Fetch public UI settings from the settings cache
 * These settings are available without authentication
 * 
 * @param req - Express request object (for logging/tracking purposes)
 * @returns Promise resolving to public UI settings response
 */
export async function fetchPublicUiSettings(req: Request): Promise<PublicUiSettingsResponse> {
  const requestId = uuidv4();
  const clientIp = getClientIp(req);
  
  try {
    // Log request received
    fabricEvents.createAndPublishEvent({
      eventName: PUBLIC_UI_SETTINGS_EVENT_NAMES.REQUEST_RECEIVED,
      req,
      payload: {
        requestId,
        clientIp,
        userAgent: req.get('user-agent')
      }
    });

    // Define public UI settings to fetch
    const publicSettings: PublicUiSetting[] = [];

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
      is_ui: true
    });

    // 2. Product card color
    const productCardColor = await getSettingValue<string>(
      'Catalog.Products',
      'card.color',
      '#E8F4F8'
    );
    publicSettings.push({
      section_path: 'Catalog.Products',
      setting_name: 'card.color',
      value: productCardColor,
      is_ui: true
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
      is_ui: true
    });

    // 4. Display options-only products setting
    const displayOptionsOnlyProducts = await getSettingValue<boolean>(
      'Catalog.Products',
      'display.optionsOnlyProducts',
      false
    );
    publicSettings.push({
      section_path: 'Catalog.Products',
      setting_name: 'display.optionsOnlyProducts',
      value: displayOptionsOnlyProducts,
      is_ui: true
    });

    // Log settings retrieved successfully
    fabricEvents.createAndPublishEvent({
      eventName: PUBLIC_UI_SETTINGS_EVENT_NAMES.SETTINGS_RETRIEVED,
      req,
      payload: {
        requestId,
        settingsCount: publicSettings.length
      }
    });

    // Log response sent
    fabricEvents.createAndPublishEvent({
      eventName: PUBLIC_UI_SETTINGS_EVENT_NAMES.RESPONSE_SENT,
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
      eventName: PUBLIC_UI_SETTINGS_EVENT_NAMES.SERVICE_ERROR,
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
      error: error instanceof Error ? error.message : 'Failed to fetch public UI settings'
    };
  }
}

