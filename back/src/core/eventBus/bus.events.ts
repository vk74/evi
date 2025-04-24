// version: 1.0
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

/**
 * Internal subscription object
 */
interface Subscription {
  pattern: string;
  handler: EventHandler;
  options: SubscriptionOptions;
}

/**
 * Implementation of the event bus core functionality
 */
export class EventBus {
  private emitter: EventEmitter;
  // Special internal event types
  private readonly ERROR_EVENT = 'eventbus.error';
  // Store subscriptions for management
  private subscriptions: Map<string, Set<Subscription>> = new Map();
  
  constructor() {
    // Create emitter with higher limit for event listeners to handle many subscribers
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(100);
    console.log('Event Bus initialized');
  }

  /**
   * Subscribe to events matching a pattern
   * 
   * Patterns can be:
   * - Exact event type: 'user.profile.updated'
   * - Domain wildcard: 'user.*'
   * - Domain+entity wildcard: 'user.profile.*'
   * - All events: '*'
   */
  subscribe(pattern: string, handler: EventHandler, options: SubscriptionOptions = {}): () => void {
    // Create internal event handler that applies filters
    const wrappedHandler = this.createWrappedHandler(pattern, handler, options);
    
    // Add to subscription registry for management
    if (!this.subscriptions.has(pattern)) {
      this.subscriptions.set(pattern, new Set());
    }
    
    const subscription: Subscription = { pattern, handler, options };
    this.subscriptions.get(pattern)!.add(subscription);
    
    // Track subscription in telemetry
    eventBusTelemetry.recordSubscriptionAdded(pattern);
    
    // Listen for exact pattern
    this.emitter.on(pattern, wrappedHandler);
    
    // Return unsubscribe function
    return () => {
      this.unsubscribe(pattern, handler);
    };
  }

  /**
   * Alias for subscribe
   */
  on(pattern: string, handler: EventHandler, options: SubscriptionOptions = {}): () => void {
    return this.subscribe(pattern, handler, options);
  }

  /**
   * Subscribe to an event pattern and automatically unsubscribe after first match
   */
  once(pattern: string, handler: EventHandler, options: SubscriptionOptions = {}): () => void {
    // Create wrapped handler that unsubscribes after execution
    const wrappedHandler: EventHandler = (event: BaseEvent) => {
      // Unsubscribe first to prevent handling more events if async handler is slow
      this.unsubscribe(pattern, wrappedHandler);
      
      // Call the original handler
      return handler(event);
    };
    
    // Use the subscribe method with our wrappedHandler
    return this.subscribe(pattern, wrappedHandler, options);
  }

  /**
   * Unsubscribe a handler from an event pattern
   */
  unsubscribe(pattern: string, handler: EventHandler): void {
    this.emitter.removeListener(pattern, handler);
    
    // Remove from subscription registry
    if (this.subscriptions.has(pattern)) {
      const subscriptions = this.subscriptions.get(pattern)!;
      const subscription = Array.from(subscriptions)
        .find(sub => sub.handler === handler);
      
      if (subscription) {
        subscriptions.delete(subscription);
        
        // Update telemetry
        eventBusTelemetry.recordSubscriptionRemoved(pattern);
        
        // Clean up if no more subscriptions for this pattern
        if (subscriptions.size === 0) {
          this.subscriptions.delete(pattern);
        }
      }
    }
  }

  /**
   * Alias for unsubscribe
   */
  off(pattern: string, handler: EventHandler): void {
    this.unsubscribe(pattern, handler);
  }

  /**
   * Publish an event to the bus (synchronous)
   */
  publish(event: BaseEvent, options: PublishOptions = {}): void {
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
      eventBusTelemetry.recordPublication(event.eventType);
    }
    
    // Emit the specific event type
    this.emitter.emit(event.eventType, event);
    
    // Emit for domain pattern subscribers
    // Example: user.profile.updated -> user.*
    const domainParts = event.eventType.split('.');
    if (domainParts.length > 1) {
      const domain = domainParts[0];
      this.emitter.emit(`${domain}.*`, event);
      
      // Emit for domain+entity pattern subscribers
      // Example: user.profile.updated -> user.profile.*
      if (domainParts.length > 2) {
        const entity = domainParts[1];
        this.emitter.emit(`${domain}.${entity}.*`, event);
      }
    }
    
    // Emit for catch-all subscribers
    this.emitter.emit('*', event);
  }

  /**
   * Alias for publish
   */
  emit(event: BaseEvent, options: PublishOptions = {}): void {
    this.publish(event, options);
  }

  /**
   * Publish an event to the bus and wait for all handlers to complete
   */
  async publishAsync(event: BaseEvent, options: PublishOptions = {}): Promise<void> {
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
      eventBusTelemetry.recordPublication(event.eventType);
    }
    
    // Get all patterns this event should trigger
    const patterns = [
      event.eventType,
      `${event.eventType.split('.')[0]}.*`,
      '*'
    ];
    
    // Add domain+entity pattern if applicable
    const domainParts = event.eventType.split('.');
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
      if (this.subscriptions.has(pattern)) {
        const subscriptions = this.subscriptions.get(pattern)!;
        
        for (const subscription of subscriptions) {
          const { handler, options } = subscription;
          
          try {
            // Apply filters
            if (this.shouldHandleEvent(event, options)) {
              const startTime = Date.now();
              const result = handler(event);
              
              // If handler returns a promise, track it
              if (result instanceof Promise) {
                const handlerPromise = result.catch(error => {
                  if (options.handleErrors !== false) {
                    errors.push({ error, event, handlerPattern: pattern });
                    eventBusTelemetry.recordError(event.eventType);
                    return; // Swallow error if handleErrors is true
                  } else {
                    throw error; // Re-throw if handleErrors is false
                  }
                }).then(() => {
                  const processingTime = Date.now() - startTime;
                  eventBusTelemetry.recordProcessingTime(event.eventType, processingTime);
                });
                
                allPromises.push(handlerPromise);
              } else {
                // Synchronous handler
                const processingTime = Date.now() - startTime;
                eventBusTelemetry.recordProcessingTime(event.eventType, processingTime);
              }
            }
          } catch (error) {
            if (options.handleErrors !== false) {
              errors.push({ 
                error: error instanceof Error ? error : new Error(String(error)), 
                event, 
                handlerPattern: pattern 
              });
              eventBusTelemetry.recordError(event.eventType);
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
        this.emitter.emit(this.ERROR_EVENT, error);
      }
      
      if (publishOptions.throwErrors) {
        // Вместо использования AggregateError, который вызывает ошибку компиляции,
        // создаем обычную ошибку с информативным сообщением
        const firstError = errors[0].error;
        const errorMessage = `${errors.length} error(s) occurred while processing event ${event.eventType}. First error: ${firstError.message}`;
        throw new Error(errorMessage);
      }
    }
  }

  /**
   * Alias for publishAsync
   */
  async emitAsync(event: BaseEvent, options: PublishOptions = {}): Promise<void> {
    return this.publishAsync(event, options);
  }

  /**
   * Wait for a specific event to occur in the future
   * Returns a promise that resolves with the event when it occurs
   */
  waitFor(eventPattern: string, options: SubscriptionOptions = {}, timeoutMs?: number): Promise<BaseEvent> {
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
          this.unsubscribe(eventPattern, handler);
          reject(new Error(`Timed out waiting for event ${eventPattern} after ${timeoutMs}ms`));
        }, timeoutMs);
      }
      
      // Subscribe once
      this.once(eventPattern, handler, options);
    });
  }

  /**
   * Subscribe to error events from the event bus
   */
  onError(handler: (error: EventBusError) => void): () => void {
    this.emitter.on(this.ERROR_EVENT, handler);
    
    return () => {
      this.emitter.removeListener(this.ERROR_EVENT, handler);
    };
  }

  /**
   * Get the total number of subscriptions
   */
  getSubscriptionCount(): number {
    let count = 0;
    for (const subscriptions of this.subscriptions.values()) {
      count += subscriptions.size;
    }
    return count;
  }

  /**
   * Get telemetry data for the event bus
   */
  getTelemetry() {
    return eventBusTelemetry.getSummaryMetrics();
  }

  /**
   * Create a wrapped handler that applies filters and handles errors
   */
  private createWrappedHandler(
    pattern: string,
    handler: EventHandler,
    options: SubscriptionOptions
  ): EventHandler {
    return (event: BaseEvent) => {
      // Skip if event doesn't pass filters
      if (!this.shouldHandleEvent(event, options)) {
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
              this.handleEventError(error, event, pattern, options);
            })
            .finally(() => {
              const processingTime = Date.now() - startTime;
              eventBusTelemetry.recordProcessingTime(event.eventType, processingTime);
            });
        } else {
          // Synchronous handler
          const processingTime = Date.now() - startTime;
          eventBusTelemetry.recordProcessingTime(event.eventType, processingTime);
        }
      } catch (error) {
        this.handleEventError(error, event, pattern, options);
      }
    };
  }

  /**
   * Handle an error thrown from an event handler
   */
  private handleEventError(
    error: unknown,
    event: BaseEvent,
    pattern: string,
    options: SubscriptionOptions
  ): void {
    eventBusTelemetry.recordError(event.eventType);
    
    const busError: EventBusError = {
      error: error instanceof Error ? error : new Error(String(error)),
      event,
      handlerPattern: pattern
    };
    
    // Emit error event if handleErrors is not explicitly false
    if (options.handleErrors !== false) {
      this.emitter.emit(this.ERROR_EVENT, busError);
    } else {
      // Otherwise throw
      throw busError.error;
    }
  }

  /**
   * Check if an event should be handled based on filters
   */
  private shouldHandleEvent(event: BaseEvent, options: SubscriptionOptions): boolean {
    // Check version filter
    if (options.version && event.version !== options.version) {
      return false;
    }
    
    // Check source filter
    if (options.source && event.source !== options.source) {
      return false;
    }
    
    // Check custom filter
    if (options.filter && !options.filter(event)) {
      return false;
    }
    
    return true;
  }
}

// Export a singleton instance for use throughout the application
export const eventBus = new EventBus();