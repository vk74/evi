/**
 * version: 1.0.0
 * Event reference catalog for knowledge base module operations (backend).
 * Placeholder for future knowledge base events.
 * File: events.knowledge.base.ts (backend)
 */

import { EventCollection } from '../../core/eventBus/types.events'

/**
 * Event reference catalog for knowledge base module operations
 * Contains placeholder events for knowledge base management
 */
export const EVENTS_KNOWLEDGE_BASE: EventCollection = {
  // Placeholder events - to be implemented when knowledge base is added
  
  'knowledge.base.placeholder.started': {
    eventName: 'knowledgeBase.knowledge.base.placeholder.started',
    source: 'knowledge-base',
    eventType: 'system',
    severity: 'debug',
    eventMessage: 'Knowledge base module placeholder event',
    version: '1.0.0'
  }
}

// Export for backward compatibility
export const eventsKnowledgeBase = EVENTS_KNOWLEDGE_BASE
