/**
 * Коды событий для хелперов core
 */

/**
 * Коды событий для кеша хелперов
 */
export const CACHE = {
  INIT: {
    SUCCESS: {
      code: 'CORE:HELPERS:CACHE:INIT:SUCCESS',
      message: 'Helper cache initialized successfully'
    }
  },
  GET: {
    HIT: {
      code: 'CORE:HELPERS:CACHE:GET:HIT',
      message: 'Cache hit'
    },
    MISS: {
      code: 'CORE:HELPERS:CACHE:GET:MISS',
      message: 'Cache miss'
    },
    EXPIRED: {
      code: 'CORE:HELPERS:CACHE:GET:EXPIRED',
      message: 'Cache entry expired'
    },
    INVALID_KEY: {
      code: 'CORE:HELPERS:CACHE:GET:INVALID_KEY',
      message: 'Invalid cache key format'
    }
  },
  SET: {
    SUCCESS: {
      code: 'CORE:HELPERS:CACHE:SET:SUCCESS',
      message: 'Cache entry set successfully'
    },
    EVICT: {
      code: 'CORE:HELPERS:CACHE:SET:EVICT',
      message: 'Cache entry evicted due to size limit'
    },
    INVALID_KEY: {
      code: 'CORE:HELPERS:CACHE:SET:INVALID_KEY',
      message: 'Invalid cache key format'
    }
  },
  DELETE: {
    SUCCESS: {
      code: 'CORE:HELPERS:CACHE:DELETE:SUCCESS',
      message: 'Cache entry deleted successfully'
    },
    NOT_FOUND: {
      code: 'CORE:HELPERS:CACHE:DELETE:NOT_FOUND',
      message: 'Cache entry not found for deletion'
    },
    INVALID_KEY: {
      code: 'CORE:HELPERS:CACHE:DELETE:INVALID_KEY',
      message: 'Invalid cache key format'
    }
  },
  CLEAR: {
    TYPE: {
      code: 'CORE:HELPERS:CACHE:CLEAR:TYPE',
      message: 'Cleared all cache entries for type'
    },
    ALL: {
      code: 'CORE:HELPERS:CACHE:CLEAR:ALL',
      message: 'Cleared all cache entries from all types'
    },
    TYPE_NOT_FOUND: {
      code: 'CORE:HELPERS:CACHE:CLEAR:TYPE_NOT_FOUND',
      message: 'Cache type not found for clearing'
    }
  },
  STATS: {
    REPORT: {
      code: 'CORE:HELPERS:CACHE:STATS:REPORT',
      message: 'Cache statistics report'
    }
  }
};

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

/**
 * Коды событий для получения имени пользователя по UUID
 */
export const GET_USERNAME_BY_UUID = {
  PROCESS: {
    START: {
      code: 'CORE:HELPERS:GET_USERNAME_BY_UUID:PROCESS:START',
      message: 'Fetching username by user UUID'
    },
    SUCCESS: {
      code: 'CORE:HELPERS:GET_USERNAME_BY_UUID:PROCESS:SUCCESS',
      message: 'Username retrieved successfully'
    },
    NOT_FOUND: {
      code: 'CORE:HELPERS:GET_USERNAME_BY_UUID:PROCESS:NOT_FOUND',
      message: 'User not found by UUID'
    },
    ERROR: {
      code: 'CORE:HELPERS:GET_USERNAME_BY_UUID:PROCESS:ERROR',
      message: 'Error fetching username'
    }
  }
};