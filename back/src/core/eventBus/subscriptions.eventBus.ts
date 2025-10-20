/**
 * subscriptions.eventBus.ts - backend file
 * version: 1.0.0
 * Event Bus subscriptions service that handles subscribing to settings change events.
 * Routes settings change events to event bus service and processes domain settings updates.
 * Delegates event bus reconfiguration to the event bus service for proper separation of concerns.
 */

import { BaseEvent } from './types.events';
import { subscribe } from './subscribe.events';
import * as eventBusService from './service.eventBus.settings';
import { getSetting, parseSettingValue } from '../../modules/admin/settings/cache.settings';
import fabricEvents from './fabric.events';
import { 
  EVENTBUS_INITIALIZATION_EVENTS,
  EVENTBUS_SETTINGS_EVENTS,
  EVENTBUS_ERROR_EVENTS
} from './events.eventBus';

// Track active subscriptions for cleanup
const activeSubscriptions: Array<string> = [];

/**
 * Handle settings change events for event bus reconfiguration
 * Processes settings update events and delegates reconfiguration to event bus service
 */
const handleEventBusSettingsChange = (event: BaseEvent): void => {
  try {
    // Check if payload exists and has required properties
    if (!event.payload || typeof event.payload !== 'object') {
      fabricEvents.createAndPublishEvent({
        eventName: EVENTBUS_ERROR_EVENTS.INVALID_SETTINGS_PAYLOAD.eventName,
        payload: {
          eventName: event.eventName,
          receivedPayload: event.payload
        }
      });
      return;
    }
    
    const payload = event.payload as any;
    const sectionPath = payload.sectionPath;
    const settingName = payload.settingName;
    
    if (!sectionPath || !settingName) {
      fabricEvents.createAndPublishEvent({
        eventName: EVENTBUS_ERROR_EVENTS.INVALID_SETTINGS_PAYLOAD.eventName,
        payload: {
          eventName: event.eventName,
          receivedPayload: event.payload,
          missingFields: !sectionPath ? 'sectionPath' : 'settingName'
        }
      });
      return;
    }
    
    // Only process EventBus section settings
    if (sectionPath !== 'Application.System.EventBus') {
      return;
    }
    
    fabricEvents.createAndPublishEvent({
      eventName: EVENTBUS_SETTINGS_EVENTS.CHANGE_PROCESSING_STARTED.eventName,
      payload: {
        sectionPath,
        settingName
      }
    });
    
    // Get the updated setting value from cache
    const setting = getSetting(sectionPath, settingName);
    if (!setting) {
      fabricEvents.createAndPublishEvent({
        eventName: EVENTBUS_ERROR_EVENTS.SETTING_NOT_FOUND.eventName,
        payload: {
          sectionPath,
          settingName
        }
      });
      return;
    }
    
    const newValue = parseSettingValue(setting);
    
    // Extract domain from setting name (e.g., "generate.events.in.domain.helpers" -> "helpers")
    const domainMatch = settingName.match(/^generate\.events\.in\.domain\.(.+)$/);
    if (!domainMatch) {
      fabricEvents.createAndPublishEvent({
        eventName: EVENTBUS_ERROR_EVENTS.UNKNOWN_DOMAIN.eventName,
        payload: {
          settingName,
          sectionPath
        }
      });
      return;
    }
    
    const domain = domainMatch[1];
    
    // Delegate setting changes to event bus service
    eventBusService.applyDomainSetting(domain, newValue);
    
    fabricEvents.createAndPublishEvent({
      eventName: EVENTBUS_SETTINGS_EVENTS.CHANGE_PROCESSING_SUCCESS.eventName,
      payload: {
        sectionPath,
        settingName,
        domain,
        newValue
      }
    });
    
  } catch (error) {
    fabricEvents.createAndPublishEvent({
      eventName: EVENTBUS_ERROR_EVENTS.SETTINGS_PROCESSING_ERROR.eventName,
      payload: {
        sectionPath: (event.payload as any)?.sectionPath,
        settingName: (event.payload as any)?.settingName
      },
      errorData: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * Load and apply initial event bus settings from cache during startup
 * Reads current settings values and applies them to event bus service
 */
const loadInitialSettings = (): void => {
  const settingsToLoad = [
    'generate.events.in.domain.helpers',
    'generate.events.in.domain.connectionHandler',
    'generate.events.in.domain.userEditor',
    'generate.events.in.domain.groupEditor',
    'generate.events.in.domain.usersList',
    'generate.events.in.domain.groupsList',
    'generate.events.in.domain.settings',
    'generate.events.in.domain.logger',
    'generate.events.in.domain.system',
    'generate.events.in.domain.auth',
    'generate.events.in.domain.publicPolicies',
    'generate.events.in.domain.catalog',
    'generate.events.in.domain.services',
    'generate.events.in.domain.adminServices',
    'generate.events.in.domain.adminCatalog',
    'generate.events.in.domain.products',
    'generate.events.in.domain.account',
    'generate.events.in.domain.validation'
  ];
  
  fabricEvents.createAndPublishEvent({
    eventName: EVENTBUS_SETTINGS_EVENTS.INITIAL_LOAD_STARTED.eventName,
    payload: {
      settingsToLoad
    }
  });
  
  try {
    let processedSettings = 0;
    
    // Load each domain setting
    for (const settingName of settingsToLoad) {
      const domainMatch = settingName.match(/^generate\.events\.in\.domain\.(.+)$/);
      if (!domainMatch) {
        continue;
      }
      
      const domain = domainMatch[1];
      const setting = getSetting('Application.System.EventBus', settingName);
      
      if (setting) {
        const enabled = parseSettingValue(setting);
        eventBusService.applyDomainSetting(domain, enabled);
        processedSettings++;
      }
    }
    
    fabricEvents.createAndPublishEvent({
      eventName: EVENTBUS_SETTINGS_EVENTS.INITIAL_LOAD_SUCCESS.eventName,
      payload: {
        processedSettings,
        totalSettings: settingsToLoad.length
      }
    });
    
  } catch (error) {
    fabricEvents.createAndPublishEvent({
      eventName: EVENTBUS_ERROR_EVENTS.SETTINGS_PROCESSING_ERROR.eventName,
      payload: {
        operation: 'initial_load'
      },
      errorData: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * Initialize event bus subscriptions
 * Creates settings change subscription
 */
export const initializeSubscriptions = (): void => {
  fabricEvents.createAndPublishEvent({
    eventName: EVENTBUS_INITIALIZATION_EVENTS.SUBSCRIPTIONS_INIT_STARTED.eventName,
    payload: {
      subscriptionType: 'settings_change'
    }
  });

  // Clear any existing subscriptions
  clearSubscriptions();
  
  // Load initial settings first
  loadInitialSettings();
  
  // Subscribe to settings update success events
  const settingsSubscriptionId = subscribe(
    'settings.update.success',
    handleEventBusSettingsChange,
    {
      description: 'Event Bus settings change subscription',
      // Filter only EventBus section settings
      filter: (event: BaseEvent) => {
        if (!event.payload || typeof event.payload !== 'object') {
          return false;
        }
        const payload = event.payload as any;
        return payload.sectionPath === 'Application.System.EventBus';
      }
    }
  );
  
  activeSubscriptions.push(settingsSubscriptionId);
  
  fabricEvents.createAndPublishEvent({
    eventName: EVENTBUS_INITIALIZATION_EVENTS.SUBSCRIPTIONS_INIT_SUCCESS.eventName,
    payload: {
      pattern: 'settings.update.success',
      subscriptionId: settingsSubscriptionId
    }
  });
};

/**
 * Clear all active subscriptions
 * Unsubscribes from all registered event patterns
 */
export const clearSubscriptions = (): void => {
  // Note: In the current implementation, we don't have a way to unsubscribe
  // from specific subscriptions, so we just clear the tracking array
  activeSubscriptions.length = 0;
}; 