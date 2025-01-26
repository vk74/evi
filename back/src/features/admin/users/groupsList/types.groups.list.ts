/**
 * @file types.groups.list.ts
 * Type definitions for the groups management sub-module.
 *
 * Defines types and interfaces for group data structure.
 * Provides group status enumeration matching PostgreSQL app schema.
 * Defines API response interfaces for group data.
 * Contains error handling types for the groups endpoint.
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
  group_id: string;        // UUID группы
  group_name: string;      // Название группы
  //reserve_1: string;       // Резервное поле
  group_status: GroupStatus; // Статус группы
  group_owner: string;     // UUID владельца группы
  is_system: boolean;      // Флаг системной группы
}

/**
 * API response interface for groups
 */
export interface IGroupsResponse {
  groups: IGroup[];        // Array of group records
  total: number;           // Total number of groups in the system
}

/**
 * Error type for group operations
 */
export type GroupError = {
  code: string;            // Error code identifier
  message: string;         // Human-readable error message
  details?: unknown;       // Additional error context (optional)
}