/**
 * Event codes for user account status helper
 */

export const GET_USER_ACCOUNT_STATUS = {
  PROCESS: {
    START: {
      code: 'CORE:HELPERS:GET_USER_ACCOUNT_STATUS:PROCESS:START',
      message: 'Getting user account status by UUID'
    },
    SUCCESS: {
      code: 'CORE:HELPERS:GET_USER_ACCOUNT_STATUS:PROCESS:SUCCESS',
      message: 'User account status retrieved successfully'
    },
    NOT_FOUND: {
      code: 'CORE:HELPERS:GET_USER_ACCOUNT_STATUS:PROCESS:NOT_FOUND',
      message: 'User not found by UUID'
    },
    ERROR: {
      code: 'CORE:HELPERS:GET_USER_ACCOUNT_STATUS:PROCESS:ERROR',
      message: 'Error getting user account status'
    }
  }
};