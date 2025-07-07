/**
 * subscriptions.logger.ts - backend file
 * version: 1.4.0
 * Logger subscriptions service that handles subscribing to events from event bus.
 * Routes log events to logger service and processes settings change events.
 * Delegates logger reconfiguration to the logger service for proper separation of concerns.
 */

import { BaseEvent } from '../eventBus/types.events';
import { subscribe, filter, whereSeverity, unsubscribe } from '../eventBus/subscribe.events';
import loggerService from './service.logger';
import { LoggerSubscriptionRule } from './types.logger';
import { getSetting, parseSettingValue } from '../../modules/admin/settings/cache.settings';
import fabricEvents from '../eventBus/fabric.events';
import { 
  LOGGER_INITIALIZATION_EVENTS,
  LOGGER_SETTINGS_EVENTS,
  LOGGER_ERROR_EVENTS,
  LOGGER_SUBSCRIPTION_EVENTS
} from './events.logger';

// Track active subscriptions for cleanup
const activeSubscriptions: Array<string> = [];

// Default subscription rules for logging events
const defaultRules: LoggerSubscriptionRule[] = [
  { pattern: '*' } // Subscribe to all events for logging
];

/**
 * Handle settings change events for logger reconfiguration
 * Processes settings update events and delegates reconfiguration to logger service
 */
const handleLoggerSettingsChange = (event: BaseEvent): void => {
  try {
    // Check if payload exists and has required properties
    if (!event.payload || typeof event.payload !== 'object') {
      fabricEvents.createAndPublishEvent({
        eventName: LOGGER_ERROR_EVENTS.INVALID_SETTINGS_PAYLOAD.eventName,
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
        eventName: LOGGER_ERROR_EVENTS.INVALID_SETTINGS_PAYLOAD.eventName,
        payload: {
          eventName: event.eventName,
          receivedPayload: event.payload,
          missingFields: !sectionPath ? 'sectionPath' : 'settingName'
        }
      });
      return;
    }
    
    fabricEvents.createAndPublishEvent({
      eventName: LOGGER_SETTINGS_EVENTS.CHANGE_PROCESSING_STARTED.eventName,
      payload: {
        sectionPath,
        settingName
      }
    });
    
    // Get the updated setting value from cache
    const setting = getSetting(sectionPath, settingName);
    if (!setting) {
      fabricEvents.createAndPublishEvent({
        eventName: LOGGER_ERROR_EVENTS.SETTING_NOT_FOUND.eventName,
        payload: {
          sectionPath,
          settingName
        }
      });
      return;
    }
    
    const newValue = parseSettingValue(setting);
    
    // Delegate setting changes to logger service
    switch (settingName) {
      case 'turn.on.console.logging':
        loggerService.applyConsoleLoggingSetting(newValue);
        break;
        
      case 'console.log.debug.events':
        loggerService.applyDebugEventsSetting(newValue);
        break;
        
      default:
        fabricEvents.createAndPublishEvent({
          eventName: LOGGER_ERROR_EVENTS.UNKNOWN_SETTING.eventName,
          payload: {
            settingName,
            sectionPath
          }
        });
        return;
    }
    
    fabricEvents.createAndPublishEvent({
      eventName: LOGGER_SETTINGS_EVENTS.CHANGE_PROCESSING_SUCCESS.eventName,
      payload: {
        sectionPath,
        settingName,
        newValue
      }
    });
    
  } catch (error) {
    fabricEvents.createAndPublishEvent({
      eventName: LOGGER_ERROR_EVENTS.SETTINGS_PROCESSING_ERROR.eventName,
      payload: {
        sectionPath: (event.payload as any)?.sectionPath,
        settingName: (event.payload as any)?.settingName
      },
      errorData: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * Load and apply initial logger settings from cache during startup
 * Reads current settings values and applies them to logger service
 */
const loadInitialSettings = (): void => {
  const settingsToLoad = ['turn.on.console.logging', 'console.log.debug.events'];
  
  fabricEvents.createAndPublishEvent({
    eventName: LOGGER_SETTINGS_EVENTS.INITIAL_LOAD_STARTED.eventName,
    payload: {
      settingsToLoad
    }
  });
  
  try {
    let consoleEnabled = true;
    let debugEnabled = true;
    
    // Load console logging setting
    const consoleLoggingSetting = getSetting('Application.System.Logging', 'turn.on.console.logging');
    if (consoleLoggingSetting) {
      consoleEnabled = parseSettingValue(consoleLoggingSetting);
      loggerService.applyConsoleLoggingSetting(consoleEnabled);
    }
    
    // Load debug events setting
    const debugEventsSetting = getSetting('Application.System.Logging', 'console.log.debug.events');
    if (debugEventsSetting) {
      debugEnabled = parseSettingValue(debugEventsSetting);
      loggerService.applyDebugEventsSetting(debugEnabled);
    }
    
    fabricEvents.createAndPublishEvent({
      eventName: LOGGER_SETTINGS_EVENTS.INITIAL_LOAD_SUCCESS.eventName,
      payload: {
        consoleLogging: consoleEnabled,
        debugEvents: debugEnabled
      }
    });
    
  } catch (error) {
    fabricEvents.createAndPublishEvent({
      eventName: LOGGER_ERROR_EVENTS.INITIAL_LOAD_ERROR.eventName,
      payload: {
        settingsToLoad
      },
      errorData: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * Initialize logger subscriptions
 * Creates main logging subscriptions and settings change subscription
 */
export const initializeSubscriptions = (rules: LoggerSubscriptionRule[] = defaultRules): void => {
  fabricEvents.createAndPublishEvent({
    eventName: LOGGER_INITIALIZATION_EVENTS.SUBSCRIPTIONS_INIT_STARTED.eventName,
    payload: {
      rulesCount: rules.length
    }
  });

  // Clear any existing subscriptions
  clearSubscriptions();
  
  const patterns: string[] = [];
  
  // Create main logging subscriptions based on rules
  for (const rule of rules) {
    const pattern = rule.pattern;
    
    // Create event handler for this pattern
    const handler = (event: BaseEvent) => {
      // Process the event through the logger service
      loggerService.processEvent(event);
    };
    
    // Subscribe to event bus with this handler
    let subscriptionId: string;
    
    // If we have a minimum severity, apply it as a filter
    if (rule.minSeverity) {
      // Create a filter builder that filters by severity
      const filterBuilder = (f: any) => whereSeverity(f, rule.minSeverity as any);
      
      // Create subscription options
      const options = {
        description: `Logger subscription for ${pattern} with min severity ${rule.minSeverity}`
      };
      
      // Subscribe with filter
      subscriptionId = subscribe(
        pattern,
        handler,
        options
      );
    } else {
      // Simple subscription without filtering
      subscriptionId = subscribe(
        pattern,
        handler,
        { description: `Logger subscription for ${pattern}` }
      );
    }
    
    // Store the subscription ID for cleanup
    activeSubscriptions.push(subscriptionId);
    patterns.push(pattern);
    
    fabricEvents.createAndPublishEvent({
      eventName: LOGGER_SUBSCRIPTION_EVENTS.PATTERN_SUBSCRIBED.eventName,
      payload: {
        pattern,
        subscriptionId
      }
    });
  }
  
  // Create separate subscription for settings changes
  initializeSettingsSubscription();
  
  fabricEvents.createAndPublishEvent({
    eventName: LOGGER_INITIALIZATION_EVENTS.SUBSCRIPTIONS_INIT_SUCCESS.eventName,
    payload: {
      subscriptionsCount: activeSubscriptions.length,
      patterns
    }
  });
};

/**
 * Initialize subscription for logger settings changes
 * Creates subscription to settings update events with filtering for logger section
 */
const initializeSettingsSubscription = (): void => {
  // Load initial settings first
  loadInitialSettings();
  
  // Subscribe to settings update success events
  const settingsSubscriptionId = subscribe(
    'settings.update.success',
    handleLoggerSettingsChange,
    {
      description: 'Logger settings change subscription',
      // Filter only logger section settings
      filter: (event: BaseEvent) => {
        if (!event.payload || typeof event.payload !== 'object') {
          return false;
        }
        const payload = event.payload as any;
        return payload.sectionPath === 'Application.System.Logging';
      }
    }
  );
  
  activeSubscriptions.push(settingsSubscriptionId);
  
  fabricEvents.createAndPublishEvent({
    eventName: LOGGER_SUBSCRIPTION_EVENTS.SETTINGS_SUBSCRIPTION_INIT.eventName,
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
  const clearedCount = activeSubscriptions.length;
  
  // Call all unsubscribe functions
  for (const subscriptionId of activeSubscriptions) {
    unsubscribe(subscriptionId);
  }
  
  // Clear the array
  activeSubscriptions.length = 0;
  
  fabricEvents.createAndPublishEvent({
    eventName: LOGGER_SUBSCRIPTION_EVENTS.SUBSCRIPTIONS_CLEARED.eventName,
    payload: {
      clearedCount
    }
  });
};

// Export the subscription services
export default {
  initializeSubscriptions,
  clearSubscriptions
};