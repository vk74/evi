/**
 * Коды событий для операций с пользователями
 */
export const UserEvents = {
  CREATION: {
    /** Операция создания пользователя */
    CREATE: {
      /** Успешное создание пользователя */
      SUCCESS: { 
        code: 'ADMIN:USERS:CREATION:CREATE:001', 
        description: 'Пользователь успешно создан' 
      },
      /** Ошибка валидации данных пользователя */
      VALIDATION_ERROR: { 
        code: 'ADMIN:USERS:CREATION:CREATE:002', 
        description: 'Ошибка валидации данных пользователя' 
      },
      /** Пользователь с таким именем уже существует */
      DUPLICATE_USERNAME: { 
        code: 'ADMIN:USERS:CREATION:CREATE:003', 
        description: 'Пользователь с таким именем уже существует' 
      }
    },
    /** Операция проверки пользователя */
    VALIDATE: {
      /** Ошибка проверки сложности пароля */
      PASSWORD_STRENGTH: {
        code: 'ADMIN:USERS:CREATION:VALIDATE:001',
        description: 'Недостаточно сложный пароль'
      },
      /** Ошибка проверки формата email */
      EMAIL_FORMAT: {
        code: 'ADMIN:USERS:CREATION:VALIDATE:002',
        description: 'Неверный формат электронной почты'
      }
    }
  },
  UPDATE: {
    /** Операция обновления пользователя */
    UPDATE: {
      /** Успешное обновление пользователя */
      SUCCESS: {
        code: 'ADMIN:USERS:UPDATE:UPDATE:001',
        description: 'Данные пользователя успешно обновлены'
      },
      /** Пользователь не найден */
      NOT_FOUND: {
        code: 'ADMIN:USERS:UPDATE:UPDATE:002',
        description: 'Пользователь не найден'
      }
    }
  },
  DELETION: {
    /** Операция удаления пользователя */
    DELETE: {
      /** Успешное удаление пользователя */
      SUCCESS: {
        code: 'ADMIN:USERS:DELETION:DELETE:001',
        description: 'Пользователь успешно удален'
      },
      /** Ошибка при удалении пользователя */
      ERROR: {
        code: 'ADMIN:USERS:DELETION:DELETE:002',
        description: 'Ошибка при удалении пользователя'
      }
    }
  }
};