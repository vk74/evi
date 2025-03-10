/**
 * Справочник кодов событий и их описаний
 */

/**
 * Структура кодов событий (EVENT ID) по модулям
 */
export const EventIds = {
  /**
   * Коды для модуля администрирования
   */
  ADMIN: {
    /**
     * Операции с группами
     */
    GROUPS: {
      /**
       * Операция создания группы
       */
      CREATION: {
        /** Успешное создание группы */
        SUCCESS: 'ADMIN:GROUPS:CREATION:INFO:001',
        /** Ошибка валидации имени группы */
        NAME_VALIDATION_ERROR: 'ADMIN:GROUPS:CREATION:ERROR:001',
        /** Ошибка доступа к базе данных */
        DATABASE_ERROR: 'ADMIN:GROUPS:CREATION:ERROR:002',
        /** Недостаточно прав для создания группы */
        PERMISSION_DENIED: 'ADMIN:GROUPS:CREATION:ERROR:003'
      },
      /**
       * Операция обновления группы
       */
      UPDATE: {
        /** Успешное обновление группы */
        SUCCESS: 'ADMIN:GROUPS:UPDATE:INFO:001',
        /** Группа не найдена */
        NOT_FOUND: 'ADMIN:GROUPS:UPDATE:ERROR:001'
      },
      /**
       * Операция удаления группы
       */
      DELETION: {
        /** Успешное удаление группы */
        SUCCESS: 'ADMIN:GROUPS:DELETION:INFO:001',
        /** Ошибка при удалении группы */
        ERROR: 'ADMIN:GROUPS:DELETION:ERROR:001'
      },
      /**
       * Операции с участниками группы
       */
      MEMBERS: {
        /** Успешное удаление участников группы */
        REMOVAL_SUCCESS: 'ADMIN:GROUPS:MEMBERS:INFO:001'
      }
    },
    /**
     * Операции с пользователями
     */
    USERS: {
      /**
       * Операция создания пользователя
       */
      CREATION: {
        /** Успешное создание пользователя */
        SUCCESS: 'ADMIN:USERS:CREATION:INFO:001',
        /** Ошибка валидации данных пользователя */
        VALIDATION_ERROR: 'ADMIN:USERS:CREATION:ERROR:001',
        /** Пользователь с таким именем уже существует */
        DUPLICATE_USERNAME: 'ADMIN:USERS:CREATION:ERROR:002'
      }
    }
  },
  /**
   * Коды для модуля аутентификации
   */
  AUTH: {
    /**
     * Операция входа в систему
     */
    LOGIN: {
      /** Успешный вход в систему */
      SUCCESS: 'AUTH:LOGIN:ATTEMPT:INFO:001',
      /** Неверные учетные данные */
      INVALID_CREDENTIALS: 'AUTH:LOGIN:ATTEMPT:ERROR:001',
      /** Пользователь заблокирован */
      USER_BLOCKED: 'AUTH:LOGIN:ATTEMPT:ERROR:002'
    },
    /**
     * Операции с JWT
     */
    JWT: {
      /** Ошибка валидации токена */
      VALIDATION_ERROR: 'AUTH:JWT:VALIDATION:ERROR:001',
      /** Истек срок действия токена */
      EXPIRED: 'AUTH:JWT:VALIDATION:ERROR:002'
    }
  }
};

/**
 * Описания для кодов событий
 */
export const EventDescriptions: Record<string, string> = {
  // Группы
  [EventIds.ADMIN.GROUPS.CREATION.SUCCESS]: 'Группа успешно создана',
  [EventIds.ADMIN.GROUPS.CREATION.NAME_VALIDATION_ERROR]: 'Ошибка валидации имени группы',
  [EventIds.ADMIN.GROUPS.CREATION.DATABASE_ERROR]: 'Ошибка доступа к базе данных при создании группы',
  [EventIds.ADMIN.GROUPS.CREATION.PERMISSION_DENIED]: 'Недостаточно прав для создания группы',
  [EventIds.ADMIN.GROUPS.UPDATE.SUCCESS]: 'Группа успешно обновлена',
  [EventIds.ADMIN.GROUPS.UPDATE.NOT_FOUND]: 'Группа не найдена',
  [EventIds.ADMIN.GROUPS.DELETION.SUCCESS]: 'Группа успешно удалена',
  [EventIds.ADMIN.GROUPS.DELETION.ERROR]: 'Ошибка при удалении группы',
  [EventIds.ADMIN.GROUPS.MEMBERS.REMOVAL_SUCCESS]: 'Участники успешно удалены из группы',
  
  // Пользователи
  [EventIds.ADMIN.USERS.CREATION.SUCCESS]: 'Пользователь успешно создан',
  [EventIds.ADMIN.USERS.CREATION.VALIDATION_ERROR]: 'Ошибка валидации данных пользователя',
  [EventIds.ADMIN.USERS.CREATION.DUPLICATE_USERNAME]: 'Пользователь с таким именем уже существует',
  
  // Аутентификация
  [EventIds.AUTH.LOGIN.SUCCESS]: 'Успешный вход в систему',
  [EventIds.AUTH.LOGIN.INVALID_CREDENTIALS]: 'Неверные учетные данные',
  [EventIds.AUTH.LOGIN.USER_BLOCKED]: 'Пользователь заблокирован',
  [EventIds.AUTH.JWT.VALIDATION_ERROR]: 'Ошибка валидации JWT токена',
  [EventIds.AUTH.JWT.EXPIRED]: 'Истек срок действия JWT токена'
};

/**
 * Получение описания для кода события
 * @param eventId Код события
 * @returns Описание события или undefined, если описание не найдено
 */
export function getEventDescription(eventId: string): string | undefined {
  return EventDescriptions[eventId];
}