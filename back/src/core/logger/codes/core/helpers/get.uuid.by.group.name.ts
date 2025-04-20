/**
 * Event codes for group UUID by name helper
 */

export const GET_UUID_BY_GROUP_NAME = {
  PROCESS: {
    START: {
      code: 'CORE:HELPERS:GET_UUID_BY_GROUP_NAME:PROCESS:START',
      message: 'Getting group UUID by name'
    },
    SUCCESS: {
      code: 'CORE:HELPERS:GET_UUID_BY_GROUP_NAME:PROCESS:SUCCESS',
      message: 'Group UUID retrieved successfully'
    },
    NOT_FOUND: {
      code: 'CORE:HELPERS:GET_UUID_BY_GROUP_NAME:PROCESS:NOT_FOUND',
      message: 'Group not found by name'
    },
    ERROR: {
      code: 'CORE:HELPERS:GET_UUID_BY_GROUP_NAME:PROCESS:ERROR',
      message: 'Error getting group UUID'
    }
  }
};