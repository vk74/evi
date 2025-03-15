// types.item.selector.ts
/**
 * Type definitions for the ItemSelector component
 */

/**
 * Standard item structure for display in the ItemSelector component
 */
export interface ItemSelectorItem {
  name: string;  // Display name for the UI
  uuid: string;  // Unique identifier
  [key: string]: any;  // Additional properties
}

/**
 * Type for search service function that component receives as prop
 */
export type SearchServiceFn = (query: string, limit: number) => Promise<ItemSelectorItem[]>;

/**
 * Type for action service function that component receives as prop
 */
export type ActionServiceFn = (itemUuids: string[]) => Promise<ActionResult>;

/**
 * Result from action service execution
 */
export interface ActionResult {
  success: boolean;
  count?: number;
  message?: string;
  [key: string]: any;
}