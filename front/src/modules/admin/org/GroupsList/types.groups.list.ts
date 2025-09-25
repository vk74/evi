/**
 * @file types.groups.list.ts
 * Version: 1.0.0
 * Type definitions for the groups management frontend module.
 * Frontend file that defines TypeScript types and interfaces for groups management functionality.
 *
 * This module provides TypeScript types and interfaces for:
 * - Group data structure and properties
 * - State management store interfaces
 * - API response types
 * - Pagination and sorting parameters
 * - Error handling types
 *
 * Used by:
 * - GroupsList.vue component
 * - state.groups.list.ts store
 * - service.read.groups.ts service
 */

/**
 * Group status enumeration
 * Matches PostgreSQL app.group_status type
 */
export enum GroupStatus {
  ACTIVE = 'active',
  DISABLED = 'disabled',
  ARCHIVED = 'archived'
}

/**
* Core group interface matching backend data structure
*/
export interface IGroup {
  group_id: string; // UUID
  group_name: string; // character varying(100)
  reserve_1: string; // character varying(100), possibly a reserve field
  group_status: GroupStatus; // app.group_status
  is_system: boolean; // boolean
  owner_username: string | null; // Resolved owner username
}

/**
* Pagination parameters interface
*/
export interface IPaginationParams {
  page: number;
  itemsPerPage: number;
  totalItems: number;
}

/**
* Available items per page options
*/
export type ItemsPerPageOption = 10 | 25 | 50 | 100;

/**
* Sorting parameters interface
*/
export interface ISortParams {
  sortBy: keyof IGroup | '';
  sortDesc: boolean;
}

/**
* API response interface for groups
*/
export interface IGroupsResponse {
  groups: IGroup[];
  total: number;
}

/**
* Table header interface for groups
*/
export interface TableHeader {
  title: string;
  key: string;
  width?: string;
  sortable?: boolean;
}

/**
 * Error type for group operations
 * 
 * @property code - Error code identifier 
 * @property message - Human-readable error message 
 * @property details - Additional error context (optional, string) 
 */
export type GroupError = {
  code: string;            // Error code identifier
  message: string;         // Human-readable error message
  details?: string;       // Additional error context (optional)
};