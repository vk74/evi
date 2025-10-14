/**
 * index.ts - backend file
 * version: 1.1.0
 * Event Bus system index file.
 * Exports main event bus components for external use.
 * Updated: Added timezone module export
 */

// Export main event bus components
export { eventBus } from './bus.events';
export * as fabricEvents from './fabric.events';
export * as eventBusService from './service.eventBus.settings';
export * as eventBusSubscriptions from './subscriptions.eventBus';
export * as eventBusTimezone from './timezone.eventBus';

// Export event types
export * from './types.events';

// Export subscription utilities
export * from './subscribe.events'; 