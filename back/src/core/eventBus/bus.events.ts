// version: 1.002
// Core Event Bus implementation based on Node.js EventEmitter
// Provides pattern-based event subscription, filtered event handling,
// asynchronous event publishing, and error handling capabilities

import { EventEmitter } from 'events';
import { 
  BaseEvent,
  EventHandler, 
  EventFilterPredicate,
  SubscriptionOptions,
  PublishOptions,
  EventBusError
} from './types.events';
import { validateEvent } from './validate.events';
import { eventBusTelemetry } from './telemetry.events';

// Stack trace elements for authorized callers
const AUTHORIZED_CALLERS = [
  'validate.events.ts',
  'fabric.events.ts'
];

/**
 * Check if the current caller is authorized to publish events
 * This uses stack trace analysis to determine the calling file
 */
const isAuthorizedCaller = (): boolean => {
  // Create an error to capture the stack trace
  const stack = new Error().stack;
  if (!stack) return false;
  
  // Check if any authorized caller is in the stack trace
  return AUTHORIZED_CALLERS.some(caller => stack.includes(caller));
};

/**
 * Internal subscription object
 */
interface Subscription {
  pattern: string;
  handler: EventHandler;
  options: SubscriptionOptions;
}

// Private event emitter instance for internal use
const emitter = new EventEmitter();
// Set higher limit for event listeners to handle many subscribers
emitter.setMaxListeners(100);

// Special internal event types
const ERROR_EVENT = 'eventbus.error';
// Store subscriptions for management
const subscriptions = new Map<string, Set<Subscription>>();

// Initialize event bus
console.log('Event Bus initialized');

/**
 * Check if an event should be handled based on filters
 */
const shouldHandleEvent = (event: BaseEvent, options: SubscriptionOptions): boolean => {
  // Check version filter
  if (options.version && event.version !== options.version) {
    return false;
  }
  
  // Check source filter
  if (options.source && event.source !== options.source) {
    return false;
  }
  
  // Check eventType filter
  if (options.eventType && event.eventType !== options.eventType) {
    return false;
  }
  
  // Check severity filter
  if (options.severity && event.severity !== options.severity) {
    return false;
  }
  
  // Check custom filter
  if (options.filter && !options.filter(event)) {
    return false;
  }
  
  return true;
};

/**
 * Handle an error thrown from an event handler
 */
const handleEventError = (
  error: unknown,
  event: BaseEvent,
  pattern: string,
  options: SubscriptionOptions
): void => {
  eventBusTelemetry.recordError(event.eventName);
  
  const busError: EventBusError = {
    error: error instanceof Error ? error : new Error(String(error)),
    event,
    handlerPattern: pattern
  };
  
  // Emit error event if handleErrors is not explicitly false
  if (options.handleErrors !== false) {
    emitter.emit(ERROR_EVENT, busError);
  } else {
    // Otherwise throw
    throw busError.error;
  }
};

/**
 * Create a wrapped handler that applies filters and handles errors
 */
const createWrappedHandler = (
  pattern: string,
  handler: EventHandler,
  options: SubscriptionOptions
): EventHandler => {
  return (event: BaseEvent) => {
    // Skip if event doesn't pass filters
    if (!shouldHandleEvent(event, options)) {
      return;
    }
    
    // Record start time for telemetry
    const startTime = Date.now();
    
    try {
      // Execute handler and handle any errors
      const result = handler(event);
      
      // Handle async handlers
      if (result instanceof Promise) {
        return result
          .catch(error => {
            handleEventError(error, event, pattern, options);
          })
          .finally(() => {
            const processingTime = Date.now() - startTime;
            eventBusTelemetry.recordProcessingTime(event.eventName, processingTime);
          });
      } else {
        // Synchronous handler
        const processingTime = Date.now() - startTime;
        eventBusTelemetry.recordProcessingTime(event.eventName, processingTime);
      }
    } catch (error) {
      handleEventError(error, event, pattern, options);
    }
  };
};

/**
 * Subscribe to events matching a pattern
 * 
 * Patterns can be:
 * - Exact event name: 'user.profile.updated'
 * - Domain wildcard: 'user.*'
 * - Domain+entity wildcard: 'user.profile.*'
 * - All events: '*'
 */
export const subscribe = (
  pattern: string, 
  handler: EventHandler, 
  options: SubscriptionOptions = {}
): () => void => {
  // Create internal event handler that applies filters
  const wrappedHandler = createWrappedHandler(pattern, handler, options);
  
  // Add to subscription registry for management
  if (!subscriptions.has(pattern)) {
    subscriptions.set(pattern, new Set());
  }
  
  const subscription: Subscription = { pattern, handler, options };
  subscriptions.get(pattern)!.add(subscription);
  
  // Track subscription in telemetry
  eventBusTelemetry.recordSubscriptionAdded(pattern);
  
  // Listen for exact pattern
  emitter.on(pattern, wrappedHandler);
  
  // Return unsubscribe function
  return () => {
    unsubscribe(pattern, handler);
  };
};

/**
 * Alias for subscribe
 */
export const on = (
  pattern: string, 
  handler: EventHandler, 
  options: SubscriptionOptions = {}
): () => void => {
  return subscribe(pattern, handler, options);
};

/**
 * Subscribe to an event pattern and automatically unsubscribe after first match
 */
export const once = (
  pattern: string, 
  handler: EventHandler, 
  options: SubscriptionOptions = {}
): () => void => {
  // Create wrapped handler that unsubscribes after execution
  const wrappedHandler: EventHandler = (event: BaseEvent) => {
    // Unsubscribe first to prevent handling more events if async handler is slow
    unsubscribe(pattern, wrappedHandler);
    
    // Call the original handler
    return handler(event);
  };
  
  // Use the subscribe method with our wrappedHandler
  return subscribe(pattern, wrappedHandler, options);
};

/**
 * Unsubscribe a handler from an event pattern
 */
export const unsubscribe = (pattern: string, handler: EventHandler): void => {
  emitter.removeListener(pattern, handler);
  
  // Remove from subscription registry
  if (subscriptions.has(pattern)) {
    const subs = subscriptions.get(pattern)!;
    const subscription = Array.from(subs)
      .find(sub => sub.handler === handler);
    
    if (subscription) {
      subs.delete(subscription);
      
      // Update telemetry
      eventBusTelemetry.recordSubscriptionRemoved(pattern);
      
      // Clean up if no more subscriptions for this pattern
      if (subs.size === 0) {
        subscriptions.delete(pattern);
      }
    }
  }
};

/**
 * Alias for unsubscribe
 */
export const off = (pattern: string, handler: EventHandler): void => {
  unsubscribe(pattern, handler);
};

/**
 * Publish an event to the bus (synchronous)
 * Only authorized callers (validator and event factory) can publish events
 */
export const publish = (event: BaseEvent, options: PublishOptions = {}): void => {
  // Check if caller is authorized to publish events
  if (!isAuthorizedCaller()) {
    const error = new Error(
      'Unauthorized event publication attempt! Events must be published through ' +
      'validator or event factory to ensure proper validation.'
    );
    console.error(error);
    throw error;
  }
  
  const publishOptions = {
    throwErrors: false,
    collectTelemetry: true,
    ...options
  };
  
  // Update telemetry
  if (publishOptions.collectTelemetry) {
    eventBusTelemetry.recordPublication(event.eventName);
  }
  
  // Emit the specific event type
  emitter.emit(event.eventName, event);
  
  // Emit for domain pattern subscribers
  // Example: user.profile.updated -> user.*
  const domainParts = event.eventName.split('.');
  if (domainParts.length > 1) {
    const domain = domainParts[0];
    emitter.emit(`${domain}.*`, event);
    
    // Emit for domain+entity pattern subscribers
    // Example: user.profile.updated -> user.profile.*
    if (domainParts.length > 2) {
      const entity = domainParts[1];
      emitter.emit(`${domain}.${entity}.*`, event);
    }
  }
  
  // Emit for catch-all subscribers
  emitter.emit('*', event);
};

/**
 * Alias for publish
 */
export const emit = (event: BaseEvent, options: PublishOptions = {}): void => {
  publish(event, options);
};

/**
 * Publish an event to the bus and wait for all handlers to complete
 */
export const publishAsync = async (
  event: BaseEvent, 
  options: PublishOptions = {}
): Promise<void> => {
  const publishOptions = {
    throwErrors: false,
    validate: true,
    collectTelemetry: true,
    ...options
  };
  
  // Validate the event if requested
  if (publishOptions.validate) {
    const validation = validateEvent(event);
    if (!validation.isValid) {
      const error = new Error(`Invalid event: ${validation.errors.join(', ')}`);
      console.error(error);
      throw error;
    }
  }
  
  // Update telemetry
  if (publishOptions.collectTelemetry) {
    eventBusTelemetry.recordPublication(event.eventName);
  }
  
  // Get all patterns this event should trigger
  const patterns = [
    event.eventName,
    `${event.eventName.split('.')[0]}.*`,
    '*'
  ];
  
  // Add domain+entity pattern if applicable
  const domainParts = event.eventName.split('.');
  if (domainParts.length > 2) {
    const domain = domainParts[0];
    const entity = domainParts[1];
    patterns.push(`${domain}.${entity}.*`);
  }
  
  // Get all matching subscriptions
  const allPromises: Promise<void>[] = [];
  const errors: EventBusError[] = [];
  
  // Execute all matching subscriptions with filtering
  for (const pattern of patterns) {
    if (subscriptions.has(pattern)) {
      const subs = subscriptions.get(pattern)!;
      
      for (const subscription of subs) {
        const { handler, options } = subscription;
        
        try {
          // Apply filters
          if (shouldHandleEvent(event, options)) {
            const startTime = Date.now();
            const result = handler(event);
            
            // If handler returns a promise, track it
            if (result instanceof Promise) {
              const handlerPromise = result.catch(error => {
                if (options.handleErrors !== false) {
                  errors.push({ error, event, handlerPattern: pattern });
                  eventBusTelemetry.recordError(event.eventName);
                  return; // Swallow error if handleErrors is true
                } else {
                  throw error; // Re-throw if handleErrors is false
                }
              }).then(() => {
                const processingTime = Date.now() - startTime;
                eventBusTelemetry.recordProcessingTime(event.eventName, processingTime);
              });
              
              allPromises.push(handlerPromise);
            } else {
              // Synchronous handler
              const processingTime = Date.now() - startTime;
              eventBusTelemetry.recordProcessingTime(event.eventName, processingTime);
            }
          }
        } catch (error) {
          if (options.handleErrors !== false) {
            errors.push({ 
              error: error instanceof Error ? error : new Error(String(error)), 
              event, 
              handlerPattern: pattern 
            });
            eventBusTelemetry.recordError(event.eventName);
          } else {
            throw error; // Re-throw if handleErrors is false
          }
        }
      }
    }
  }
  
  // Wait for all async handlers to complete
  if (allPromises.length > 0) {
    try {
      await Promise.all(allPromises);
    } catch (error) {
      if (publishOptions.throwErrors) {
        throw error;
      } else {
        console.error('Error in async event handler:', error);
      }
    }
  }
  
  // Emit errors if any occurred
  if (errors.length > 0) {
    for (const error of errors) {
      emitter.emit(ERROR_EVENT, error);
    }
    
    if (publishOptions.throwErrors) {
      const firstError = errors[0].error;
      const errorMessage = `${errors.length} error(s) occurred while processing event ${event.eventName}. First error: ${firstError.message}`;
      throw new Error(errorMessage);
    }
  }
};

/**
 * Alias for publishAsync
 */
export const emitAsync = async (
  event: BaseEvent, 
  options: PublishOptions = {}
): Promise<void> => {
  return publishAsync(event, options);
};

/**
 * Wait for a specific event to occur in the future
 * Returns a promise that resolves with the event when it occurs
 */
export const waitFor = (
  eventPattern: string, 
  options: SubscriptionOptions = {}, 
  timeoutMs?: number
): Promise<BaseEvent> => {
  return new Promise((resolve, reject) => {
    let timeoutId: NodeJS.Timeout | undefined;
    
    // Create one-time handler
    const handler = (event: BaseEvent) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      resolve(event);
    };
    
    // Set up timeout if specified
    if (timeoutMs !== undefined) {
      timeoutId = setTimeout(() => {
        unsubscribe(eventPattern, handler);
        reject(new Error(`Timed out waiting for event ${eventPattern} after ${timeoutMs}ms`));
      }, timeoutMs);
    }
    
    // Subscribe once
    once(eventPattern, handler, options);
  });
};

/**
 * Subscribe to error events from the event bus
 */
export const onError = (handler: (error: EventBusError) => void): () => void => {
  emitter.on(ERROR_EVENT, handler);
  
  return () => {
    emitter.removeListener(ERROR_EVENT, handler);
  };
};

/**
 * Get the total number of subscriptions
 */
export const getSubscriptionCount = (): number => {
  let count = 0;
  for (const subs of subscriptions.values()) {
    count += subs.size;
  }
  return count;
};

/**
 * Get telemetry data for the event bus
 */
export const getTelemetry = () => {
  return eventBusTelemetry.getSummaryMetrics();
};

// Export all functions for use throughout the application
export const eventBus = {
  subscribe,
  on,
  once,
  unsubscribe,
  off,
  publish,
  emit,
  publishAsync,
  emitAsync,
  waitFor,
  onError,
  getSubscriptionCount,
  getTelemetry
};