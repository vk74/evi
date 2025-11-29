/**
 * events.user.location.selection.ts - backend file
 * version: 1.0.0
 * Event definitions for user location selection operations.
 * Contains event types for fetching regions and updating user location.
 * 
 * Payload Guidelines:
 * - severity 'info'/'warning'/'error': Only user UUID and basic info
 * - severity 'debug': Internal system details for troubleshooting
 */

/**
 * User Location Selection Events
 * Events related to user location selection operations
 */
export const USER_LOCATION_SELECTION_EVENTS = {
  // Fetch regions started
  FETCH_REGIONS_STARTED: {
    eventName: 'system.user.location.selection.fetch.regions.started',
    source: 'user location selection service',
    eventType: 'system' as const,
    severity: 'debug' as const,
    eventMessage: 'Starting to fetch regions list',
    payload: null, // { timestamp }
    version: '1.0.0'
  },

  // Fetch regions success
  FETCH_REGIONS_SUCCESS: {
    eventName: 'system.user.location.selection.fetch.regions.success',
    source: 'user location selection service',
    eventType: 'system' as const,
    severity: 'info' as const,
    eventMessage: 'Regions list fetched successfully',
    payload: null, // { totalRegions, timestamp }
    version: '1.0.0'
  },

  // Fetch regions error
  FETCH_REGIONS_ERROR: {
    eventName: 'system.user.location.selection.fetch.regions.error',
    source: 'user location selection service',
    eventType: 'system' as const,
    severity: 'error' as const,
    eventMessage: 'Error fetching regions list',
    payload: null, // { error, timestamp }
    errorData: null, // Error details
    version: '1.0.0'
  },

  // Update location started
  UPDATE_LOCATION_STARTED: {
    eventName: 'system.user.location.selection.update.location.started',
    source: 'user location selection service',
    eventType: 'system' as const,
    severity: 'debug' as const,
    eventMessage: 'Starting to update user location',
    payload: null, // { username, location }
    version: '1.0.0'
  },

  // Update location success
  UPDATE_LOCATION_SUCCESS: {
    eventName: 'system.user.location.selection.update.location.success',
    source: 'user location selection service',
    eventType: 'system' as const,
    severity: 'info' as const,
    eventMessage: 'User location updated successfully',
    payload: null, // { username, location }
    version: '1.0.0'
  },

  // Update location error
  UPDATE_LOCATION_ERROR: {
    eventName: 'system.user.location.selection.update.location.error',
    source: 'user location selection service',
    eventType: 'system' as const,
    severity: 'error' as const,
    eventMessage: 'Error updating user location',
    payload: null, // { username, location, error }
    errorData: null, // Error details
    version: '1.0.0'
  }
};

