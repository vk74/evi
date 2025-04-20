/**
 * Коды событий для хелперов core
 */

/**
 * Коды событий для получения статуса учетной записи пользователя
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

/**
 * Коды событий для получения UUID группы по названию
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

/**
 * Коды событий для проверки административных прав пользователя
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