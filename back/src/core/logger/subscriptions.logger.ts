// version: 1.1
// Logger subscriptions service
// Handles subscribing to events from event bus and routing them to the logger service

import { BaseEvent } from '../eventBus/types.events';
import { subscribe, filter, whereSeverity } from '../eventBus/subscribe.events';
import loggerService from './service.logger';
import { LoggerSubscriptionRule } from './types.logger';

// Track active subscriptions for cleanup
const activeSubscriptions: Array<string> = [];

// Default subscription rules
const defaultRules: LoggerSubscriptionRule[] = [
  { pattern: '*' } // Subscribe to all events
];

/**
 * Initialize logger subscriptions
 * This subscribes to events on the event bus and passes them to the logger
 */
export const initializeSubscriptions = (rules: LoggerSubscriptionRule[] = defaultRules): void => {
  console.log('Initializing logger subscriptions');

  // Clear any existing subscriptions
  clearSubscriptions();
  
  // Create subscriptions based on rules
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
};

/**
 * Clear all active subscriptions
 */
export const clearSubscriptions = (): void => {
  // Import dynamically to avoid circular dependency
  const { unsubscribe } = require('../eventBus/subscribe.events');
  
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