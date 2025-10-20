/**
 * service.eventBus.ts - backend file
 * version: 1.2.0
 * Event Bus service implementation that handles domain-based event generation settings.
 * Provides methods for domain settings management and conditional event generation.
 * Supports dynamic enable/disable of event generation for specific domains.
 * Updated: Added 7 new domains (adminProducts, adminPricing, adminOrganizations, work, reports, knowledgeBase, guards)
 */

import { BaseEvent } from './types.events';
import fabricEvents from './fabric.events';
import { 
  EVENTBUS_INITIALIZATION_EVENTS,
  EVENTBUS_SETTINGS_EVENTS,
  EVENTBUS_ERROR_EVENTS
} from './events.eventBus';
import { initializeTimezone } from './timezone.eventBus';

// Track current event bus settings
// Domains are organized in the same order and grouping as in the frontend component
let currentSettings = {
  // Administration
  adminCatalog: true,
  adminServices: true,
  adminProducts: true,
  adminPricing: true,
  // - Organization management (subgroup)
  groupEditor: true,
  groupsList: true,
  userEditor: true,
  usersList: true,
  adminOrganizations: true,
  
  // Modules (Business services)
  work: true,
  reports: true,
  knowledgeBase: true,
  account: true,
  // - Catalog (subgroup)
  catalog: true,
  services: true,
  products: true,
  
  // System
  system: true,
  settings: true,
  logger: true,
  helpers: true,
  
  // Security
  auth: true,
  publicPolicies: true,
  validation: true,
  connectionHandler: true,
  guards: true
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
 * Loads timezone from settings and initializes domain settings
 */
export const initialize = async (): Promise<void> => {
  // Initialize timezone first
  await initializeTimezone();
  
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