// version: 1.001
// Advanced subscription mechanism for Event Bus
// Provides priority-based subscriptions, complex filtering capabilities,
// subscription management and a fluent DSL for defining event filters

const { v4: uuid } = require('uuid');
import { 
  BaseEvent, 
  EventHandler, 
  SubscriptionOptions,
  AdvancedSubscriptionOptions,
  SubscriptionPriority,
  FilterOperator,
  LogicalOperator,
  FilterCondition,
  SimpleFilterCondition,
  CompoundFilterCondition,
  SubscriptionStatus
} from './types.events';
import { eventBus } from './bus.events';
import { eventBusTelemetry } from './telemetry.events';

// ==================== Internal Types ====================

/**
 * Internal subscription tracking with additional metadata
 */
interface ManagedSubscription {
  id: string;
  pattern: string;
  handler: EventHandler;
  wrappedHandler: EventHandler;
  options: AdvancedSubscriptionOptions;
  unsubscribeFn: () => void;
  active: boolean;
  callCount: number;
  lastCalledAt?: Date;
  createdAt: Date;
}

/**
 * State object for the filter builder pattern
 */
interface FilterBuilderState {
  conditions: FilterCondition[];
  currentOperator: LogicalOperator;
}

// ==================== Internal Storage ====================

/**
 * Registry of all managed subscriptions
 */
const subscriptionRegistry = new Map<string, ManagedSubscription>();

/**
 * Paused subscriptions (stored by ID)
 */
const pausedSubscriptions = new Set<string>();

// ==================== Helper Functions ====================

/**
 * Get a value from an object using dot notation path
 * Example: getNestedValue(event, 'payload.user.id')
 */
const getNestedValue = (obj: any, path: string): any => {
  if (!obj || !path) return undefined;
  
  const keys = path.split('.');
  return keys.reduce((value, key) => 
    value && typeof value === 'object' ? value[key] : undefined,
    obj
  );
};

/**
 * Apply an operator to compare two values
 */
const applyOperator = (operator: FilterOperator, fieldValue: any, conditionValue: any): boolean => {
  // Handle nullish values
  if (fieldValue === undefined || fieldValue === null) {
    if (operator === FilterOperator.EXISTS) return false;
    if (operator === FilterOperator.NOT_EXISTS) return true;
    if (operator === FilterOperator.EQUALS && conditionValue === null) return true;
    if (operator === FilterOperator.NOT_EQUALS && conditionValue !== null) return true;
    return false;
  }

  // Handle string operations
  if (typeof fieldValue === 'string' && typeof conditionValue === 'string') {
    switch (operator) {
      case FilterOperator.CONTAINS:
        return fieldValue.includes(conditionValue);
      case FilterOperator.NOT_CONTAINS:
        return !fieldValue.includes(conditionValue);
      case FilterOperator.STARTS_WITH:
        return fieldValue.startsWith(conditionValue);
      case FilterOperator.ENDS_WITH:
        return fieldValue.endsWith(conditionValue);
      case FilterOperator.MATCHES:
        return new RegExp(conditionValue).test(fieldValue);
    }
  }

  // Handle array operations
  if (Array.isArray(conditionValue)) {
    switch (operator) {
      case FilterOperator.IN:
        return conditionValue.includes(fieldValue);
      case FilterOperator.NOT_IN:
        return !conditionValue.includes(fieldValue);
    }
  }

  // Handle existence checks
  if (operator === FilterOperator.EXISTS) return true;
  if (operator === FilterOperator.NOT_EXISTS) return false;

  // Handle comparison operators
  switch (operator) {
    case FilterOperator.EQUALS:
      return fieldValue === conditionValue;
    case FilterOperator.NOT_EQUALS:
      return fieldValue !== conditionValue;
    case FilterOperator.GREATER_THAN:
      return fieldValue > conditionValue;
    case FilterOperator.GREATER_THAN_OR_EQUALS:
      return fieldValue >= conditionValue;
    case FilterOperator.LESS_THAN:
      return fieldValue < conditionValue;
    case FilterOperator.LESS_THAN_OR_EQUALS:
      return fieldValue <= conditionValue;
    default:
      return false;
  }
};

/**
 * Apply a filter condition to an event
 */
const applyCondition = (condition: FilterCondition, event: BaseEvent): boolean => {
  if (condition.type === 'simple') {
    const simpleCondition = condition as SimpleFilterCondition;
    const fieldValue = getNestedValue(event, simpleCondition.field);
    return applyOperator(simpleCondition.operator, fieldValue, simpleCondition.value);
  } else {
    const compoundCondition = condition as CompoundFilterCondition;
    if (compoundCondition.operator === LogicalOperator.AND) {
      return compoundCondition.conditions.every(c => applyCondition(c, event));
    } else { // LogicalOperator.OR
      return compoundCondition.conditions.some(c => applyCondition(c, event));
    }
  }
};

// ==================== Filter Builder Functions ====================

/**
 * Initialize a new filter builder state
 */
export const filter = (): FilterBuilderState => ({
  conditions: [],
  currentOperator: LogicalOperator.AND
});

/**
 * Switch to AND logic for subsequent conditions
 */
export const and = (state: FilterBuilderState): FilterBuilderState => ({
  ...state,
  currentOperator: LogicalOperator.AND
});

/**
 * Switch to OR logic for subsequent conditions
 */
export const or = (state: FilterBuilderState): FilterBuilderState => ({
  ...state,
  currentOperator: LogicalOperator.OR
});

/**
 * Create a condition where field must equal value
 */
export const where = (state: FilterBuilderState, field: string, value: any): FilterBuilderState => {
  const condition: SimpleFilterCondition = {
    type: 'simple',
    field,
    operator: FilterOperator.EQUALS,
    value,
    apply: (event: BaseEvent) => {
      const fieldValue = getNestedValue(event, field);
      return applyOperator(FilterOperator.EQUALS, fieldValue, value);
    }
  };
  
  return {
    ...state,
    conditions: [...state.conditions, condition]
  };
};

/**
 * Create a condition where field must not equal value
 */
export const whereNot = (state: FilterBuilderState, field: string, value: any): FilterBuilderState => {
  const condition: SimpleFilterCondition = {
    type: 'simple',
    field,
    operator: FilterOperator.NOT_EQUALS,
    value,
    apply: (event: BaseEvent) => {
      const fieldValue = getNestedValue(event, field);
      return applyOperator(FilterOperator.NOT_EQUALS, fieldValue, value);
    }
  };
  
  return {
    ...state,
    conditions: [...state.conditions, condition]
  };
};

/**
 * Create a condition where field is greater than value
 */
export const whereGreaterThan = (
  state: FilterBuilderState, 
  field: string, 
  value: number | string | Date
): FilterBuilderState => {
  const condition: SimpleFilterCondition = {
    type: 'simple',
    field,
    operator: FilterOperator.GREATER_THAN,
    value,
    apply: (event: BaseEvent) => {
      const fieldValue = getNestedValue(event, field);
      return applyOperator(FilterOperator.GREATER_THAN, fieldValue, value);
    }
  };
  
  return {
    ...state,
    conditions: [...state.conditions, condition]
  };
};

/**
 * Create a condition where field is less than value
 */
export const whereLessThan = (
  state: FilterBuilderState, 
  field: string, 
  value: number | string | Date
): FilterBuilderState => {
  const condition: SimpleFilterCondition = {
    type: 'simple',
    field,
    operator: FilterOperator.LESS_THAN,
    value,
    apply: (event: BaseEvent) => {
      const fieldValue = getNestedValue(event, field);
      return applyOperator(FilterOperator.LESS_THAN, fieldValue, value);
    }
  };
  
  return {
    ...state,
    conditions: [...state.conditions, condition]
  };
};

/**
 * Create a condition where field contains value
 */
export const whereContains = (state: FilterBuilderState, field: string, value: string): FilterBuilderState => {
  const condition: SimpleFilterCondition = {
    type: 'simple',
    field,
    operator: FilterOperator.CONTAINS,
    value,
    apply: (event: BaseEvent) => {
      const fieldValue = getNestedValue(event, field);
      return applyOperator(FilterOperator.CONTAINS, fieldValue, value);
    }
  };
  
  return {
    ...state,
    conditions: [...state.conditions, condition]
  };
};

/**
 * Create a condition where field starts with value
 */
export const whereStartsWith = (state: FilterBuilderState, field: string, value: string): FilterBuilderState => {
  const condition: SimpleFilterCondition = {
    type: 'simple',
    field,
    operator: FilterOperator.STARTS_WITH,
    value,
    apply: (event: BaseEvent) => {
      const fieldValue = getNestedValue(event, field);
      return applyOperator(FilterOperator.STARTS_WITH, fieldValue, value);
    }
  };
  
  return {
    ...state,
    conditions: [...state.conditions, condition]
  };
};

/**
 * Create a condition where field ends with value
 */
export const whereEndsWith = (state: FilterBuilderState, field: string, value: string): FilterBuilderState => {
  const condition: SimpleFilterCondition = {
    type: 'simple',
    field,
    operator: FilterOperator.ENDS_WITH,
    value,
    apply: (event: BaseEvent) => {
      const fieldValue = getNestedValue(event, field);
      return applyOperator(FilterOperator.ENDS_WITH, fieldValue, value);
    }
  };
  
  return {
    ...state,
    conditions: [...state.conditions, condition]
  };
};

/**
 * Create a condition where field matches regex pattern
 */
export const whereMatches = (
  state: FilterBuilderState, 
  field: string, 
  pattern: string | RegExp
): FilterBuilderState => {
  const patternStr = pattern instanceof RegExp ? pattern.source : pattern;
  const condition: SimpleFilterCondition = {
    type: 'simple',
    field,
    operator: FilterOperator.MATCHES,
    value: patternStr,
    apply: (event: BaseEvent) => {
      const fieldValue = getNestedValue(event, field);
      return applyOperator(FilterOperator.MATCHES, fieldValue, patternStr);
    }
  };
  
  return {
    ...state,
    conditions: [...state.conditions, condition]
  };
};

/**
 * Create a condition where field exists and is not null
 */
export const whereExists = (state: FilterBuilderState, field: string): FilterBuilderState => {
  const condition: SimpleFilterCondition = {
    type: 'simple',
    field,
    operator: FilterOperator.EXISTS,
    value: true,
    apply: (event: BaseEvent) => {
      const fieldValue = getNestedValue(event, field);
      return applyOperator(FilterOperator.EXISTS, fieldValue, true);
    }
  };
  
  return {
    ...state,
    conditions: [...state.conditions, condition]
  };
};

/**
 * Create a condition where field is in array of values
 */
export const whereIn = (state: FilterBuilderState, field: string, values: any[]): FilterBuilderState => {
  const condition: SimpleFilterCondition = {
    type: 'simple',
    field,
    operator: FilterOperator.IN,
    value: values,
    apply: (event: BaseEvent) => {
      const fieldValue = getNestedValue(event, field);
      return applyOperator(FilterOperator.IN, fieldValue, values);
    }
  };
  
  return {
    ...state,
    conditions: [...state.conditions, condition]
  };
};

/**
 * Create a condition for event type (category)
 */
export const whereEventType = (
  state: FilterBuilderState, 
  eventType: 'app' | 'system' | 'security' | 'integration' | 'performance'
): FilterBuilderState => {
  return where(state, 'eventType', eventType);
};

/**
 * Create a condition for severity level
 */
export const whereSeverity = (
  state: FilterBuilderState, 
  severity: 'debug' | 'info' | 'warning' | 'error' | 'critical'
): FilterBuilderState => {
  return where(state, 'severity', severity);
};

/**
 * Create a condition for minimum severity level
 */
export const whereMinSeverity = (
  state: FilterBuilderState,
  minSeverity: 'debug' | 'info' | 'warning' | 'error' | 'critical'
): FilterBuilderState => {
  const severityLevels = {
    debug: 0,
    info: 1,
    warning: 2,
    error: 3,
    critical: 4
  };
  
  const minLevel = severityLevels[minSeverity];
  
  const condition: SimpleFilterCondition = {
    type: 'simple',
    field: 'severity',
    operator: FilterOperator.CUSTOM,
    value: minSeverity,
    apply: (event: BaseEvent) => {
      if (!event.severity) return false;
      return severityLevels[event.severity] >= minLevel;
    }
  };
  
  return {
    ...state,
    conditions: [...state.conditions, condition]
  };
};

/**
 * Build a filter function from the filter state
 */
export const buildFilter = (state: FilterBuilderState): (event: BaseEvent) => boolean => {
  // If no conditions, return a function that passes all events
  if (state.conditions.length === 0) {
    return () => true;
  }
  
  // Create a compound condition from all the conditions
  const rootCondition: CompoundFilterCondition = {
    type: 'compound',
    operator: state.currentOperator,
    conditions: state.conditions,
    apply: (event: BaseEvent) => 
      state.currentOperator === LogicalOperator.AND
        ? state.conditions.every(c => c.apply(event))
        : state.conditions.some(c => c.apply(event))
  };
  
  // Return a function that applies the root condition
  return (event: BaseEvent) => rootCondition.apply(event);
};

/**
 * Add a nested filter with grouped conditions
 */
export const group = (
  state: FilterBuilderState,
  groupFn: (state: FilterBuilderState) => FilterBuilderState
): FilterBuilderState => {
  // Create a new filter state and apply the group function
  const nestedState = groupFn(filter());
  
  // Build a filter function from the nested state
  const nestedFilter = buildFilter(nestedState);
  
  // Add the compound condition to the parent state
  const compoundCondition: CompoundFilterCondition = {
    type: 'compound',
    operator: nestedState.currentOperator,
    conditions: nestedState.conditions,
    apply: (event: BaseEvent) => nestedFilter(event)
  };
  
  return {
    ...state,
    conditions: [...state.conditions, compoundCondition]
  };
};

// ==================== Advanced Subscription Functions ====================

/**
 * Create a wrapped handler with advanced subscription features
 */
const createAdvancedHandler = (
  pattern: string,
  handler: EventHandler,
  options: AdvancedSubscriptionOptions,
  subscriptionId: string
): EventHandler => {
  // Get subscription from registry
  const getManagedSubscription = () => subscriptionRegistry.get(subscriptionId);
  
  // Return wrapped handler
  return async (event: BaseEvent): Promise<void> => {
    const subscription = getManagedSubscription();
    if (!subscription) return;
    
    // Check if subscription is active
    if (!subscription.active || pausedSubscriptions.has(subscriptionId)) {
      return;
    }

    // Check max calls limit
    if (options.maxCalls !== undefined && subscription.callCount >= options.maxCalls) {
      // Auto-unsubscribe if limit reached
      unsubscribe(subscriptionId);
      return;
    }
    
    // Apply standard filters
    if (options.version && event.version !== options.version) return;
    if (options.source && event.source !== options.source) return;
    
    // New filters for eventType and severity
    if (options.eventType && event.eventType !== options.eventType) return;
    if (options.severity && event.severity !== options.severity) return;
    
    // Apply custom filter function if provided
    if (options.filter && !options.filter(event)) return;
    
    // Update call count and last called time
    subscription.callCount++;
    subscription.lastCalledAt = new Date();
    
    // Execute handler with timeout if specified
    try {
      if (options.timeoutMs !== undefined && options.timeoutMs > 0) {
        // Execute with timeout
        const timeoutPromise = new Promise<void>((_, reject) => {
          setTimeout(() => reject(new Error(`Handler timed out after ${options.timeoutMs}ms`)), options.timeoutMs);
        });
        
        await Promise.race([
          Promise.resolve(handler(event)),
          timeoutPromise
        ]);
      } else {
        // Execute normally
        await Promise.resolve(handler(event));
      }
    } catch (error) {
      // Handle error based on options
      if (options.handleErrors === true) {
        console.error(`Error in event handler for ${pattern}:`, error);
      } else {
        throw error;
      }
    }
  };
};

/**
 * Subscribe to events with advanced options
 * Returns subscription ID for management
 */
export const subscribe = (
  pattern: string, 
  handler: EventHandler,
  options: AdvancedSubscriptionOptions = {}
): string => {
  // Generate subscription ID
  const subscriptionId = uuid();

  // Set default options
  const subscriptionOptions: AdvancedSubscriptionOptions = {
    priority: SubscriptionPriority.NORMAL,
    enabled: true,
    ...options
  };
  
  // Create wrapped handler with advanced features
  const wrappedHandler = createAdvancedHandler(pattern, handler, subscriptionOptions, subscriptionId);
  
  // Subscribe to event bus
  const unsubscribeFn = eventBus.subscribe(pattern, wrappedHandler, subscriptionOptions);
  
  // Register for management
  const managedSubscription: ManagedSubscription = {
    id: subscriptionId,
    pattern,
    handler,
    wrappedHandler,
    options: subscriptionOptions,
    unsubscribeFn,
    active: true,
    callCount: 0,
    createdAt: new Date()
  };
  
  subscriptionRegistry.set(subscriptionId, managedSubscription);
  
  return subscriptionId;
};

/**
 * Subscribe to events with a filter builder
 * Returns subscription ID
 */
export const subscribeWithFilter = (
  pattern: string,
  filterBuilder: (state: FilterBuilderState) => FilterBuilderState,
  handler: EventHandler,
  options: Omit<AdvancedSubscriptionOptions, 'filter'> = {}
): string => {
  // Build filter function from builder
  const filterState = filterBuilder(filter());
  const filterFn = buildFilter(filterState);
  
  // Subscribe with filter function
  return subscribe(pattern, handler, {
    ...options,
    filter: filterFn
  });
};

/**
 * Subscribe to an event once with advanced options
 * Returns subscription ID (auto-removed after first match)
 */
export const once = (
  pattern: string,
  handler: EventHandler,
  options: AdvancedSubscriptionOptions = {}
): string => {
  // Set max calls to 1
  return subscribe(pattern, handler, {
    ...options,
    maxCalls: 1
  });
};

/**
 * Unsubscribe using subscription ID
 */
export const unsubscribe = (subscriptionId: string): boolean => {
  const subscription = subscriptionRegistry.get(subscriptionId);
  if (!subscription) return false;
  
  // Call original unsubscribe function
  subscription.unsubscribeFn();
  
  // Remove from registry and paused set
  subscriptionRegistry.delete(subscriptionId);
  pausedSubscriptions.delete(subscriptionId);
  
  return true;
};

/**
 * Pause a subscription (temporarily disable without unsubscribing)
 */
export const pauseSubscription = (subscriptionId: string): boolean => {
  const subscription = subscriptionRegistry.get(subscriptionId);
  if (!subscription || !subscription.active) return false;
  
  subscription.active = false;
  pausedSubscriptions.add(subscriptionId);
  return true;
};

/**
 * Resume a paused subscription
 */
export const resumeSubscription = (subscriptionId: string): boolean => {
  const subscription = subscriptionRegistry.get(subscriptionId);
  if (!subscription) return false;
  
  subscription.active = true;
  pausedSubscriptions.delete(subscriptionId);
  return true;
};

/**
 * Pause multiple subscriptions by pattern
 * Returns number of paused subscriptions
 */
export const pauseSubscriptionsByPattern = (patternMatch: string | RegExp): number => {
  let count = 0;
  const matcher = typeof patternMatch === 'string' 
    ? (pattern: string) => pattern === patternMatch || pattern.includes(patternMatch)
    : (pattern: string) => patternMatch.test(pattern);
  
  subscriptionRegistry.forEach(subscription => {
    if (subscription.active && matcher(subscription.pattern)) {
      pauseSubscription(subscription.id);
      count++;
    }
  });
  
  return count;
};

/**
 * Resume multiple subscriptions by pattern
 * Returns number of resumed subscriptions
 */
export const resumeSubscriptionsByPattern = (patternMatch: string | RegExp): number => {
  let count = 0;
  const matcher = typeof patternMatch === 'string' 
    ? (pattern: string) => pattern === patternMatch || pattern.includes(patternMatch)
    : (pattern: string) => patternMatch.test(pattern);
  
  subscriptionRegistry.forEach(subscription => {
    if (!subscription.active && matcher(subscription.pattern)) {
      resumeSubscription(subscription.id);
      count++;
    }
  });
  
  return count;
};

/**
 * Pause subscriptions by tag
 * Returns number of paused subscriptions
 */
export const pauseSubscriptionsByTag = (tag: string): number => {
  let count = 0;
  
  subscriptionRegistry.forEach(subscription => {
    if (
      subscription.active && 
      subscription.options.tags && 
      subscription.options.tags.includes(tag)
    ) {
      pauseSubscription(subscription.id);
      count++;
    }
  });
  
  return count;
};

/**
 * Resume subscriptions by tag
 * Returns number of resumed subscriptions
 */
export const resumeSubscriptionsByTag = (tag: string): number => {
  let count = 0;
  
  subscriptionRegistry.forEach(subscription => {
    if (
      !subscription.active && 
      subscription.options.tags && 
      subscription.options.tags.includes(tag)
    ) {
      resumeSubscription(subscription.id);
      count++;
    }
  });
  
  return count;
};

// ==================== Debugging and Inspection Functions ====================

/**
 * Get status of a specific subscription
 */
export const getSubscriptionStatus = (subscriptionId: string): SubscriptionStatus | undefined => {
  const subscription = subscriptionRegistry.get(subscriptionId);
  if (!subscription) return undefined;
  
  return {
    id: subscription.id,
    pattern: subscription.pattern,
    active: subscription.active,
    callCount: subscription.callCount,
    lastCalledAt: subscription.lastCalledAt,
    createdAt: subscription.createdAt,
    description: subscription.options.description,
    tags: subscription.options.tags,
    priority: subscription.options.priority || SubscriptionPriority.NORMAL
  };
};

/**
 * Get all active subscription statuses
 */
export const getAllSubscriptions = (): SubscriptionStatus[] => {
  const subscriptions: SubscriptionStatus[] = [];
  
  subscriptionRegistry.forEach(subscription => {
    subscriptions.push({
      id: subscription.id,
      pattern: subscription.pattern,
      active: subscription.active,
      callCount: subscription.callCount,
      lastCalledAt: subscription.lastCalledAt,
      createdAt: subscription.createdAt,
      description: subscription.options.description,
      tags: subscription.options.tags,
      priority: subscription.options.priority || SubscriptionPriority.NORMAL
    });
  });
  
  return subscriptions;
};

/**
 * Find matching handlers for a specific event
 * Returns details about which handlers would be called
 */
export const findMatchingHandlers = (event: BaseEvent): SubscriptionStatus[] => {
  const matches: SubscriptionStatus[] = [];
  const matchingPatterns = [
    event.eventName,
    `${event.eventName.split('.')[0]}.*`,
    '*'
  ];
  
  // Add domain+entity pattern if applicable
  const domainParts = event.eventName.split('.');
  if (domainParts.length > 2) {
    const domain = domainParts[0];
    const entity = domainParts[1];
    matchingPatterns.push(`${domain}.${entity}.*`);
  }
  
  // Find all handlers that would match this event
  subscriptionRegistry.forEach(subscription => {
    if (!subscription.active) return;
    if (!matchingPatterns.includes(subscription.pattern)) return;
    
    // Check subscription options
    const options = subscription.options;
    
    // Skip if version doesn't match
    if (options.version && event.version !== options.version) return;
    
    // Skip if source doesn't match
    if (options.source && event.source !== options.source) return;
    
    // Skip if eventType doesn't match
    if (options.eventType && event.eventType !== options.eventType) return;
    
    // Skip if severity doesn't match
    if (options.severity && event.severity !== options.severity) return;
    
    // Skip if filter doesn't pass
    if (options.filter && !options.filter(event)) return;
    
    // This handler would be called
    matches.push({
      id: subscription.id,
      pattern: subscription.pattern,
      active: subscription.active,
      callCount: subscription.callCount,
      lastCalledAt: subscription.lastCalledAt,
      createdAt: subscription.createdAt,
      description: subscription.options.description,
      tags: subscription.options.tags,
      priority: subscription.options.priority || SubscriptionPriority.NORMAL
    });
  });
  
  // Sort by priority (lower numbers first)
  matches.sort((a, b) => a.priority - b.priority);
  
  return matches;
};

/**
 * Get total metrics about subscriptions
 */
export const getSubscriptionMetrics = () => {
  let totalActive = 0;
  let totalPaused = 0;
  let totalCalls = 0;
  const byPattern: Record<string, number> = {};
  const byTag: Record<string, number> = {};
  
  subscriptionRegistry.forEach(subscription => {
    if (subscription.active) {
      totalActive++;
    } else {
      totalPaused++;
    }
    
    totalCalls += subscription.callCount;
    
    // Count by pattern
    byPattern[subscription.pattern] = (byPattern[subscription.pattern] || 0) + 1;
    
    // Count by tags
    if (subscription.options.tags) {
      subscription.options.tags.forEach(tag => {
        byTag[tag] = (byTag[tag] || 0) + 1;
      });
    }
  });
  
  return {
    totalSubscriptions: subscriptionRegistry.size,
    totalActive,
    totalPaused,
    totalCalls,
    byPattern,
    byTag
  };
};