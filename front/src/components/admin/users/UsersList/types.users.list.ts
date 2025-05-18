/**
 * @file types.users.list.ts
 * Version: 1.0.0
 * Type definitions for the users management frontend module.
 *
 * This module provides TypeScript types and interfaces for:
 * - User data structure and properties
 * - State management store interfaces
 * - API response types
 * - Pagination and sorting parameters
 * - Error handling types
 *
 * Used by:
 * - UsersList.vue component
 * - state.users.list.ts store
 * - service.fetch.users.ts service
 */

/**
 * User account status enumeration
 * Matches PostgreSQL app.account_status type
 */
export enum AccountStatus {
  ACTIVE = 'active',
  DISABLED = 'disabled'
}

/**
* Core user interface matching backend data structure
*/
export interface IUser {
  user_id: string; // UUID
  username: string; // character varying(100)
  email: string; // character varying(100)
  is_staff: boolean; // boolean
  account_status: AccountStatus; // app.account_status
  first_name: string; // character varying(100)
  middle_name: string | null; // character varying(100) | null
  last_name: string; // character varying(100)
  created_at: string; // timestamp with time zone
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
  sortBy: string;
  sortDesc: boolean;
}

/**
* Table header definition
*/
export interface TableHeader {
  title: string;
  key: string;
  width?: string;
  sortable?: boolean;
}

/**
* API response format for users data
*/
export interface IUsersResponse {
  items: IUser[];
  total: number;
}

/**
* Users store state interface
*/
export interface IUsersListStore {
  users: IUser[];
  loading: boolean;
  error: string | null;
  page: number;
  itemsPerPage: ItemsPerPageOption;
  totalNumberOfUsers: number;
  sortBy: string;
  sortDesc: boolean;
  selectedUsers: string[];
}

/**
* Error response interface
*/
export interface IErrorResponse {
  error: string;
  message: string;
  statusCode: number;
}
