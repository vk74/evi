export interface BaseEvent {
  // version: 1.0

  // 📌 Unique identifier for the event (used for traceability and idempotency)
  // Filled by: EventFabric
  // Example: "event-7d31a21c-943e-4a5e-9f32-b7e1290cfb1d"
  eventId: string;

  // 🏷 Application name or identifier 
  // used for SIEM applications to identify log entries belong to ev2 application
  // Example: "ev2"
  applicationName?: string;

  // 🏷 Logical event type used for routing and subscriptions
  // Filled by: EventFabric (from event template/registry)
  // Example: "user.newaccount.created"
  eventName: string;

  // 📊 Category of the event for classification and filtering
  // Filled by: EventFabric
  eventType: 'app' | 'system' | 'security' | 'integration' | 'performance';

  // 🔢 Schema version of the event
  // Filled by: EventFabric (from event registry)
  // Example: "v1"
  version: string;

  // 🕒 ISO timestamp when the event was created
  // Filled by: EventFabric
  // Example: "2025-04-23T12:34:56.789Z"
  timestamp: string;

  // 🧭 Origin of the event, such as a service or module name
  // Filled by: EventFabric or ContextProvider
  // Example: "auth-service"
  source: string;

  // 🔗 Correlation ID to group related events (e.g., user workflow)
  // Filled by: ContextProvider
  // Example: "corr-abc123"
  correlationId?: string;

  // 🔄 ID of the previous event that triggered this one (causality)
  // Filled by: EventFabric or ContextProvider
  // Example: "evt-6a91e281-..."
  causationId?: string;

  // 🧾 Business data associated with the event
  // Filled by: business logic → passed to EventFabric
  // Example: { userId: "u123", email: "test@example.com" }
  payload?: unknown;

  // 👤 ID of the user who triggered the event
  // Filled by: ContextProvider
  // Example: "u123"
  userId?: string;

  // 📦 Arbitrary metadata related to the event
  // Filled by: EventFabric or business logic
  // Example: { retryCount: 2, source: "api" }
  metadata?: Record<string, unknown>;

  // 🪵 Severity level of the event
  // Filled by: EventFabric or logger
  // Example: "info"
  severity?: 'debug' | 'info' | 'warning' | 'error' | 'critical';

  // ⏱ Duration of the operation related to the event, in milliseconds
  // Filled by: business logic or EventFabric
  // Example: 145
  duration?: number;

  // 🧵 Trace ID for distributed tracing across services
  // Filled by: ContextProvider or tracing system (e.g., OpenTelemetry)
  // Example: "trace-abc456"
  traceId?: string;

  // 📍 Span ID for intra-service tracing (local operation trace)
  // Filled by: tracing system
  // Example: "span-def789"
  spanId?: string;

  // 🌍 Runtime environment of the event (used for filtering/logging)
  // Filled by: ContextProvider
  // Example: "production"
  environment?: string;

  // 🖥 Host details where the event was generated
  // Filled by: EventFabric or ContextProvider
  // Example: { hostname: "node-1", processId: 1204 }
  hostInfo?: {
    hostname: string;
    processId?: number;
    threadId?: string;
  };

  // 🏷 Tags used for filtering and categorizing events
  // Filled by: EventFabric or business logic
  // Example: ["user", "signup", "critical"]
  tags?: string[];

  // 💥 Stack trace for error events
  // Filled by: error handler → EventFabric
  // Example: "Error: Invalid token at AuthService.ts:123:4"
  stackTrace?: string;

  // 🌐 IP address of the user/client triggering the event
  // Filled by: ContextProvider (extracted from request)
  // Example: "192.168.1.55"
  ipAddress?: string;

  // 📱 Session ID for grouping events within the same user session
  // Filled by: ContextProvider
  // Example: "sess-xyz456"
  sessionId?: string;

  // 🚪 Path or route that triggered the event (for API tracking)
  // Filled by: ContextProvider
  // Example: "/api/v1/users/create"
  requestPath?: string;

  // 🔍 Indexed key-value fields for quick search/filtering in logs or UI
  // Filled by: EventFabric or EventLogger
  // Example: { email: "test@example.com", region: "EU" }
  searchableFields?: Record<string, string>;
}

/**
 * Configuration options for EventFactory
 */
export interface EventFactoryConfig {
  // Default source for events if not provided
  source: string;
  // App environment (production, development, test)
  environment?: string;
  // Whether to validate events on creation
  validateOnCreate?: boolean;
}

/**
 * Options for event creation
 */
export interface CreateEventOptions {
  // Event correlation ID (links related events)
  correlationId?: string;
  // Event causation ID (links cause-effect events)
  causationId?: string;
  // User ID associated with the event
  userId?: string;
  // Custom event version (otherwise pulled from registry)
  version?: string;
  // Custom source (otherwise from factory config)
  source?: string;
  // Category of the event (classification)
  eventType?: 'app' | 'system' | 'security' | 'integration' | 'performance';
  // Severity level for the event
  severity?: 'debug' | 'info' | 'warning' | 'error' | 'critical';
  // Event duration in milliseconds
  duration?: number;
  // Distributed tracing IDs
  traceId?: string;
  spanId?: string;
  // Client IP address that initiated the event
  ipAddress?: string;
  // User session ID
  sessionId?: string;
  // Request path that triggered the event
  requestPath?: string;
  // Custom tags for categorizing the event
  tags?: string[];
  // Custom metadata for the event
  metadata?: Record<string, unknown>;
  // Fields to be made searchable in logs/UI
  searchableFields?: Record<string, string>;
  // Payload for the event (used in error events)
  payload?: unknown;
  // Stack trace for error events
  stackTrace?: string;
}

// ================= EVENT BUS TYPES =================
// Below types are used in bus.events.ts

/**
 * Event handler function that receives an event
 * Used in: bus.events.ts
 */
export type EventHandler = (event: BaseEvent) => void | Promise<void>;

/**
 * Predicate function for filtering events
 * Used in: bus.events.ts
 */
export type EventFilterPredicate = (event: BaseEvent) => boolean;

/**
 * Options for event subscriptions
 * Used in: bus.events.ts
 */
export interface SubscriptionOptions {
  // Only receive events with this version
  version?: string;
  // Only receive events from this source
  source?: string;
  // Only receive events of this type (category)
  eventType?: 'app' | 'system' | 'security' | 'integration' | 'performance';
  // Only receive events with this severity level
  severity?: 'debug' | 'info' | 'warning' | 'error' | 'critical';
  // Custom filter function
  filter?: EventFilterPredicate;
  // Whether to handle errors from this handler
  handleErrors?: boolean;
}

/**
 * Options for event publishing
 * Used in: bus.events.ts
 */
export interface PublishOptions {
  // Whether to throw errors from handlers (default: false)
  throwErrors?: boolean;
  // Whether to validate the event before publishing (default: true)
  validate?: boolean;
  // Whether to collect telemetry for this publication (default: true)
  collectTelemetry?: boolean;
}

/**
 * Event bus internal error event
 * Used in: bus.events.ts
 */
export interface EventBusError {
  error: Error;
  event: BaseEvent;
  handlerPattern: string;
}

// ================ ADVANCED SUBSCRIPTION TYPES =================
// Below types are used in subscribe.events.ts

/**
 * Priority level for subscription handlers
 * Used in: subscribe.events.ts
 */
export enum SubscriptionPriority {
  HIGHEST = 0,
  HIGH = 100,
  NORMAL = 200,
  LOW = 300,
  LOWEST = 400
}

/**
 * Comparison operators for filtering
 * Used in: subscribe.events.ts
 */
export enum FilterOperator {
  EQUALS = 'eq',
  NOT_EQUALS = 'neq',
  GREATER_THAN = 'gt',
  GREATER_THAN_OR_EQUALS = 'gte',
  LESS_THAN = 'lt',
  LESS_THAN_OR_EQUALS = 'lte',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'notContains',
  STARTS_WITH = 'startsWith',
  ENDS_WITH = 'endsWith',
  EXISTS = 'exists',
  NOT_EXISTS = 'notExists',
  IN = 'in',
  NOT_IN = 'notIn',
  MATCHES = 'matches', // For regex patterns
  CUSTOM = 'custom'    // For custom filtering logic
}

/**
 * Logical operators for combining filters
 * Used in: subscribe.events.ts
 */
export enum LogicalOperator {
  AND = 'and',
  OR = 'or'
}

/**
 * Extended options for advanced event subscriptions
 * Used in: subscribe.events.ts
 */
export interface AdvancedSubscriptionOptions extends SubscriptionOptions {
  // Handler priority (lower numbers execute first)
  priority?: SubscriptionPriority | number;
  
  // Timeout for handler execution (in milliseconds)
  timeoutMs?: number;
  
  // Maximum number of times the handler will be called
  maxCalls?: number;
  
  // Handler will be enabled/disabled
  enabled?: boolean;
  
  // Handler description for debugging purposes
  description?: string;
  
  // Custom tags for grouping subscriptions
  tags?: string[];
}

/**
 * Status of a subscription
 * Used in: subscribe.events.ts
 */
export interface SubscriptionStatus {
  id: string;
  pattern: string;
  active: boolean;
  callCount: number;
  lastCalledAt?: Date;
  createdAt: Date;
  description?: string;
  tags?: string[];
  priority: number;
}

/**
 * Base filter condition interface
 * Used in: subscribe.events.ts
 */
export interface FilterCondition {
  type: 'simple' | 'compound';
  apply: (event: BaseEvent) => boolean;
  // Опциональные свойства, которые могут присутствовать в конкретных типах условий
  field?: string;
  operator?: FilterOperator | LogicalOperator;
  value?: any;
  conditions?: FilterCondition[];
}

/**
 * Simple filter condition comparing a field to a value
 * Used in: subscribe.events.ts
 */
export interface SimpleFilterCondition extends FilterCondition {
  type: 'simple';
  field: string; // Can be dot-notation path like 'payload.user.id'
  operator: FilterOperator;
  value: any;
}

/**
 * Compound filter condition combining multiple conditions
 * Used in: subscribe.events.ts
 */
export interface CompoundFilterCondition extends FilterCondition {
  type: 'compound';
  operator: LogicalOperator;
  conditions: FilterCondition[];
}
