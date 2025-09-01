/**
 * @file types.kb.ts
 * Version: 1.0.0
 * Type definitions for KB (Knowledge Base) module.
 * Frontend file that defines interfaces and types for KB module components and state.
 */

/**
 * KB module section identifiers
 */
export type KBSectionId = 'knowledge-base' | 'my-articles' | 'settings'

/**
 * KB module section interface
 */
export interface Section {
  id: KBSectionId
  title: string
  icon: string
  visible?: boolean
}

/**
 * KB module state interface
 */
export interface KBState {
  /**
   * Current active section in KB module
   */
  activeSection: KBSectionId
}
