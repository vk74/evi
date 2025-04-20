/**
 * Event codes for checking user admin status helper
 */

export const CHECK_IS_USER_ADMIN = {
  PROCESS: {
    START: {
      code: 'CORE:HELPERS:CHECK_IS_USER_ADMIN:PROCESS:START',
      message: 'Checking if user is admin (member of administrators group)'
    },
    SUCCESS: {
      code: 'CORE:HELPERS:CHECK_IS_USER_ADMIN:PROCESS:SUCCESS',
      message: 'User admin status check completed successfully'
    },
    GROUP_NOT_FOUND: {
      code: 'CORE:HELPERS:CHECK_IS_USER_ADMIN:PROCESS:GROUP_NOT_FOUND',
      message: 'Administrator group not found in system'
    },
    USER_IS_ADMIN: {
      code: 'CORE:HELPERS:CHECK_IS_USER_ADMIN:PROCESS:USER_IS_ADMIN',
      message: 'User is an administrator (member of administrators group)'
    },
    USER_NOT_ADMIN: {
      code: 'CORE:HELPERS:CHECK_IS_USER_ADMIN:PROCESS:USER_NOT_ADMIN',
      message: 'User is not an administrator'
    },
    ERROR: {
      code: 'CORE:HELPERS:CHECK_IS_USER_ADMIN:PROCESS:ERROR',
      message: 'Error checking user admin status'
    }
  }
};