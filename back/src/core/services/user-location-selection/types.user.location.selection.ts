/**
 * types.user.location.selection.ts - version 1.0.0
 * Type definitions for user location selection functionality.
 * 
 * Contains TypeScript interfaces for requests and responses.
 * File: types.user.location.selection.ts (backend)
 */

/**
 * Request interface for updating user location
 */
export interface UpdateUserLocationRequest {
  location?: string | null;
  [key: string]: any;
}

/**
 * Response interface for user location data
 */
export interface UserLocationData {
  user_id: string;
  username: string;
  location: string | null;
  [key: string]: any;
}

/**
 * Response interface for regions list
 */
export interface RegionsListResponse {
  success: boolean;
  message?: string;
  data: {
    regions: string[];
  };
}

/**
 * Response interface for location update
 */
export interface UpdateLocationResponse {
  success: boolean;
  message?: string;
  data?: UserLocationData;
  error?: string;
}

