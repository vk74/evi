/**
 * service.eventBus.ts - backend file
 * version: 1.0.0
 * Event Bus service implementation that handles domain-based event generation settings.
 * Provides methods for domain settings management and conditional event generation.
 * Supports dynamic enable/disable of event generation for specific domains.
 */

import { BaseEvent } from './types.events';
import fabricEvents from './fabric.events';
import { 
  EVENTBUS_INITIALIZATION_EVENTS,
  EVENTBUS_SETTINGS_EVENTS,
  EVENTBUS_ERROR_EVENTS
} from './events.eventBus';

// Track current event bus settings
let currentSettings = {
  helpers: true,
  connectionHandler: true,
  userEditor: true,
  groupEditor: true,
  usersList: true,
  groupsList: true,
  settings: true,
  logger: true,
  system: true,
  auth: true,
  publicPasswordPolicies: true,
  catalog: true,
  services: true,
  products: true,
  adminServices: true,
  adminCatalog: true,
  account: true,
  validation: true
};

/**
 * Extract domain from event name
 * Event names follow pattern: "domain.eventName"
 */
const extractDomainFromEventName = (eventName: string): string | null => {
  const parts = eventName.split('.');
  if (parts.length >= 2) {
    return parts[0];
  }
  return null;
};

/**
 * Check if event generation is enabled for the given domain
 */
const isEventGenerationEnabledForDomain = (domain: string): boolean => {
  return currentSettings[domain as keyof typeof currentSettings] ?? true;
};

/**
 * Initialize the event bus service
 */
export const initialize = (): void => {
  fabricEvents.createAndPublishEvent({
    eventName: EVENTBUS_INITIALIZATION_EVENTS.SERVICE_INIT_STARTED.eventName,
    payload: {
      domainsCount: Object.keys(currentSettings).length,
      domains: Object.keys(currentSettings)
    }
  });

  fabricEvents.createAndPublishEvent({
    eventName: EVENTBUS_INITIALIZATION_EVENTS.SERVICE_INIT_SUCCESS.eventName,
    payload: {
      domainsCount: Object.keys(currentSettings).length,
      enabledDomains: Object.entries(currentSettings)
        .filter(([_, enabled]) => enabled)
        .map(([domain]) => domain)
    }
  });
};

/**
 * Check if event should be generated based on domain settings
 */
export const shouldGenerateEvent = (eventName: string): boolean => {
  const domain = extractDomainFromEventName(eventName);
  
  if (!domain) {
    // If no domain found, allow generation (fallback behavior)
    return true;
  }
  
  // EventBus domain events should always be generated (critical for settings management)
  if (domain === 'eventBus') {
    return true;
  }
  
  const isEnabled = isEventGenerationEnabledForDomain(domain);
  
  // If domain is disabled, silently return false (no logging)
  return isEnabled;
};

/**
 * Apply domain setting
 */
export const applyDomainSetting = (domain: string, enabled: boolean): void => {
  if (domain in currentSettings) {
    const oldValue = currentSettings[domain as keyof typeof currentSettings];
    currentSettings[domain as keyof typeof currentSettings] = enabled;
    
    fabricEvents.createAndPublishEvent({
      eventName: EVENTBUS_SETTINGS_EVENTS.DOMAIN_SETTING_CHANGED.eventName,
      payload: {
        domain,
        oldValue,
        newValue: enabled
      }
    });
  } else {
    fabricEvents.createAndPublishEvent({
      eventName: EVENTBUS_ERROR_EVENTS.UNKNOWN_DOMAIN.eventName,
      payload: {
        domain,
        availableDomains: Object.keys(currentSettings)
      }
    });
  }
};

/**
 * Get current settings
 */
export const getCurrentSettings = () => {
  return { ...currentSettings };
};

/**
 * Get enabled domains
 */
export const getEnabledDomains = (): string[] => {
  return Object.entries(currentSettings)
    .filter(([_, enabled]) => enabled)
    .map(([domain]) => domain);
};

/**
 * Get disabled domains
 */
export const getDisabledDomains = (): string[] => {
  return Object.entries(currentSettings)
    .filter(([_, enabled]) => !enabled)
    .map(([domain]) => domain);
};

/**
 * Check if domain is enabled
 */
export const isDomainEnabled = (domain: string): boolean => {
  return currentSettings[domain as keyof typeof currentSettings] ?? true;
};

/**
 * Get domain from event name
 */
export const getDomainFromEventName = (eventName: string): string | null => {
  return extractDomainFromEventName(eventName);
}; 