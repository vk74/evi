/**
 * @file types.ar.ts
 * Version: 1.0.0
 * Type definitions for AR (Analytics & Reports) module.
 * Frontend file that defines interfaces and types for AR module components and state.
 */

/**
 * AR module section identifiers
 */
export type ARSectionId = 'dashboards' | 'reports'

/**
 * AR module section interface
 */
export interface Section {
  id: ARSectionId
  title: string
  icon: string
  visible?: boolean
}

/**
 * AR module state interface
 */
export interface ARState {
  /**
   * Current active section in AR module
   */
  activeSection: ARSectionId
}
