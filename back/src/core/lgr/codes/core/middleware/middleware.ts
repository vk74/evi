/**
 * @file middleware.ts
 * Коды событий для middleware контроллеров в core
 */

/**
 * Коды событий для контроллера получения имени пользователя по UUID
 */
export const GET_USERNAME_BY_UUID = {
  REQUEST: {
    RECEIVED: {
      code: 'CORE:MIDDLEWARE:GET_USERNAME_BY_UUID:REQUEST:RECEIVED',
      message: 'Received request to fetch username by UUID'
    },
    VALIDATION_ERROR: {
      code: 'CORE:MIDDLEWARE:GET_USERNAME_BY_UUID:REQUEST:VALIDATION_ERROR',
      message: 'Validation error in username request'
    }
  },
  RESPONSE: {
    SUCCESS: {
      code: 'CORE:MIDDLEWARE:GET_USERNAME_BY_UUID:RESPONSE:SUCCESS',
      message: 'Successfully retrieved username'
    },
    NOT_FOUND: {
      code: 'CORE:MIDDLEWARE:GET_USERNAME_BY_UUID:RESPONSE:NOT_FOUND',
      message: 'User not found by UUID'
    },
    ERROR: {
      code: 'CORE:MIDDLEWARE:GET_USERNAME_BY_UUID:RESPONSE:ERROR',
      message: 'Error fetching username'
    }
  }
};