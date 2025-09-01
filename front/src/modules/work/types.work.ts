/**
 * @file types.work.ts
 * Version: 1.0.0
 * Type definitions for work module.
 * Frontend file that defines interfaces and types for work module components and state.
 */

/**
 * Work module section identifiers
 */
export type WorkSectionId = 'all-work-items' | 'my-group-workitems' | 'my-requests'

/**
 * Work module section interface
 */
export interface Section {
  id: WorkSectionId
  title: string
  icon: string
  visible?: boolean
}

/**
 * Work module state interface
 */
export interface WorkState {
  /**
   * Current active section in work module
   */
  activeSection: WorkSectionId
}
