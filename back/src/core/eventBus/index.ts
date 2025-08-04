/**
 * index.ts - backend file
 * version: 1.0.0
 * Event Bus system index file.
 * Exports main event bus components for external use.
 */

// Export main event bus components
export { eventBus } from './bus.events';
export * as fabricEvents from './fabric.events';
export * as eventBusService from './service.eventBus.settings';
export * as eventBusSubscriptions from './subscriptions.eventBus';

// Export event types
export * from './types.events';

// Export subscription utilities
export * from './subscribe.events'; 