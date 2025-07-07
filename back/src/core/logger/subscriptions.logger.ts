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
      console.warn('[Logger] Invalid payload in settings update event');
      return;
    }
    
    const payload = event.payload as any;
    const sectionPath = payload.sectionPath;
    const settingName = payload.settingName;
    
    if (!sectionPath || !settingName) {
      console.warn('[Logger] Missing sectionPath or settingName in payload');
      return;
    }
    
    console.log(`[Logger] Processing settings change: ${sectionPath}/${settingName}`);
    
    // Get the updated setting value from cache
    const setting = getSetting(sectionPath, settingName);
    if (!setting) {
      console.warn(`[Logger] Setting not found in cache: ${sectionPath}/${settingName}`);
      return;
    }
    
    const newValue = parseSettingValue(setting);
    console.log(`[Logger] New setting value: ${settingName} = ${newValue}`);
    
    // Delegate setting changes to logger service
    switch (settingName) {
      case 'turn.on.console.logging':
        loggerService.applyConsoleLoggingSetting(newValue);
        break;
        
      case 'console.log.debug.events':
        loggerService.applyDebugEventsSetting(newValue);
        break;
        
      default:
        console.log(`[Logger] Unknown logger setting: ${settingName}`);
    }
    
  } catch (error) {
    console.error('[Logger] Error processing settings change:', error);
  }
};

/**
 * Load and apply initial logger settings from cache during startup
 * Reads current settings values and applies them to logger service
 */
const loadInitialSettings = (): void => {
  console.log('[Logger] Loading initial settings');
  
  try {
    // Load console logging setting
    const consoleLoggingSetting = getSetting('Application.System.Logging', 'turn.on.console.logging');
    if (consoleLoggingSetting) {
      const consoleEnabled = parseSettingValue(consoleLoggingSetting);
      console.log(`[Logger] Initial console logging: ${consoleEnabled}`);
      loggerService.applyConsoleLoggingSetting(consoleEnabled);
    }
    
    // Load debug events setting
    const debugEventsSetting = getSetting('Application.System.Logging', 'console.log.debug.events');
    if (debugEventsSetting) {
      const debugEnabled = parseSettingValue(debugEventsSetting);
      console.log(`[Logger] Initial debug events: ${debugEnabled}`);
      loggerService.applyDebugEventsSetting(debugEnabled);
    }
    
  } catch (error) {
    console.error('[Logger] Error loading initial settings:', error);
  }
};

/**
 * Initialize logger subscriptions
 * Creates main logging subscriptions and settings change subscription
 */
export const initializeSubscriptions = (rules: LoggerSubscriptionRule[] = defaultRules): void => {
  console.log('Initializing logger subscriptions');

  // Clear any existing subscriptions
  clearSubscriptions();
  
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
    
    console.log(`Logger subscribed to events: ${pattern}`);
  }
  
  // Create separate subscription for settings changes
  initializeSettingsSubscription();
};

/**
 * Initialize subscription for logger settings changes
 * Creates subscription to settings update events with filtering for logger section
 */
const initializeSettingsSubscription = (): void => {
  console.log('[Logger] Initializing settings subscription');
  
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
  console.log('[Logger] Settings subscription initialized');
};

/**
 * Clear all active subscriptions
 * Unsubscribes from all registered event patterns
 */
export const clearSubscriptions = (): void => {
  // Call all unsubscribe functions
  for (const subscriptionId of activeSubscriptions) {
    unsubscribe(subscriptionId);
  }
  
  // Clear the array
  activeSubscriptions.length = 0;
  
  console.log('Logger subscriptions cleared');
};

// Export the subscription services
export default {
  initializeSubscriptions,
  clearSubscriptions
};