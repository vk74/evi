/**
 * Коды событий для операций с группами
 */
export const GroupEvents = {
  CREATION: {
    /** Операция получения запроса */
    REQUEST: {
      /** Получен запрос на создание группы */
      RECEIVED: { 
        code: 'ADMIN:USERS:GROUPS:REQUEST:001', 
        description: 'Получен запрос на создание группы' 
      }
    },
    /** Операция валидации */
    VALIDATE: {
      /** Успешная валидация полей */
      SUCCESS: { 
        code: 'ADMIN:USERS:GROUPS:VALIDATE:001', 
        description: 'Валидация полей группы успешна' 
      },
      /** Ошибка обязательного поля */
      REQUIRED_FIELD: { 
        code: 'ADMIN:USERS:GROUPS:VALIDATE:002', 
        description: 'Отсутствует обязательное поле группы' 
      },
      /** Ошибка формата имени группы */
      NAME_FORMAT: { 
        code: 'ADMIN:USERS:GROUPS:VALIDATE:003', 
        description: 'Неверный формат имени группы' 
      },
      /** Ошибка формата email */
      EMAIL_FORMAT: { 
        code: 'ADMIN:USERS:GROUPS:VALIDATE:004', 
        description: 'Неверный формат email группы' 
      },
      /** Ошибка формата описания */
      DESCRIPTION_FORMAT: { 
        code: 'ADMIN:USERS:GROUPS:VALIDATE:005', 
        description: 'Неверный формат описания группы' 
      },
      /** Ошибка формата статуса */
      STATUS_FORMAT: { 
        code: 'ADMIN:USERS:GROUPS:VALIDATE:006', 
        description: 'Неверный статус группы' 
      }
    },
    /** Операция проверки уникальности */
    CHECK: {
      /** Ошибка уникальности имени группы */
      NAME_EXISTS: { 
        code: 'ADMIN:USERS:GROUPS:CHECK:001', 
        description: 'Группа с таким именем уже существует' 
      },
      /** Ошибка существования владельца */
      OWNER_NOT_FOUND: { 
        code: 'ADMIN:USERS:GROUPS:CHECK:002', 
        description: 'Владелец группы не найден' 
      }
    },
    /** Операция сохранения в БД */
    DATABASE: {
      /** Начало транзакции */
      TRANSACTION_START: { 
        code: 'ADMIN:USERS:GROUPS:DATABASE:001', 
        description: 'Начата транзакция создания группы' 
      },
      /** Успешное сохранение */
      SUCCESS: { 
        code: 'ADMIN:USERS:GROUPS:DATABASE:002', 
        description: 'Группа успешно сохранена в базе данных' 
      },
      /** Ошибка при сохранении */
      ERROR: { 
        code: 'ADMIN:USERS:GROUPS:DATABASE:003', 
        description: 'Ошибка при сохранении группы в базе данных' 
      }
    },
    /** Операция обновления кеша */
    CACHE: {
      /** Успешная очистка кеша */
      CLEARED: { 
        code: 'ADMIN:USERS:GROUPS:CACHE:001', 
        description: 'Кеш групп успешно очищен' 
      },
      /** Ошибка очистки кеша */
      ERROR: { 
        code: 'ADMIN:USERS:GROUPS:CACHE:002', 
        description: 'Ошибка при очистке кеша групп' 
      }
    },
    /** Операция создания группы (общая) */
    CREATE: {
      /** Успешное создание группы */
      SUCCESS: { 
        code: 'ADMIN:USERS:GROUPS:CREATE:001', 
        description: 'Группа успешно создана' 
      },
      /** Ошибка при создании группы */
      ERROR: { 
        code: 'ADMIN:USERS:GROUPS:CREATE:002', 
        description: 'Ошибка при создании группы' 
      }
    }
  }
};