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
  group_id: string;        // Group UUID
  group_name: string;      // Group name
  group_status: GroupStatus; // Group status
  is_system: boolean;      // System flag
  owner_username: string | null; // Owner's username
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
};

/**
 * Interface for SQL queries related to groups
 */
export interface SQLQueries {
  getAllGroups: string;    // Query to fetch all groups
  deleteSelectedGroups: string; // Query to delete selected groups
}