/**
 * Коды событий для операций с компонентом ItemSelector
 */
export const ItemSelectorEvents = {
  /**
   * События, связанные с поиском пользователей
   */
  SEARCH_USERS: {
    /** Операция получения запроса */
    REQUEST: {
      /** Получен запрос на поиск пользователей */
      RECEIVED: { 
        code: 'CORE:ITEM_SELECTOR:SEARCH:REQUEST:001', 
        description: 'Получен запрос на поиск пользователей' 
      },
      /** Некорректный запрос на поиск пользователей */
      INVALID: { 
        code: 'CORE:ITEM_SELECTOR:SEARCH:REQUEST:002', 
        description: 'Некорректный запрос на поиск пользователей' 
      }
    },
    /** Операция формирования ответа */
    RESPONSE: {
      /** Успешный ответ на запрос поиска пользователей */
      SUCCESS: { 
        code: 'CORE:ITEM_SELECTOR:SEARCH:RESPONSE:001', 
        description: 'Успешный ответ на запрос поиска пользователей' 
      },
      /** Ошибка при формировании ответа на запрос поиска пользователей */
      ERROR: { 
        code: 'CORE:ITEM_SELECTOR:SEARCH:RESPONSE:002', 
        description: 'Ошибка при формировании ответа на запрос поиска пользователей' 
      }
    }
  },
  
  /**
   * События, связанные с добавлением пользователей в группу
   */
  ADD_USERS: {
    /** Операция получения запроса */
    REQUEST: {
      /** Получен запрос на добавление пользователей в группу */
      RECEIVED: { 
        code: 'CORE:ITEM_SELECTOR:ADD_USERS:REQUEST:001', 
        description: 'Получен запрос на добавление пользователей в группу' 
      },
      /** Некорректный запрос на добавление пользователей */
      INVALID: { 
        code: 'CORE:ITEM_SELECTOR:ADD_USERS:REQUEST:002', 
        description: 'Некорректный запрос на добавление пользователей в группу' 
      }
    },
    /** Операция валидации данных */
    VALIDATE: {
      /** Успешная валидация данных */
      SUCCESS: { 
        code: 'CORE:ITEM_SELECTOR:ADD_USERS:VALIDATE:001', 
        description: 'Успешная валидация данных для добавления пользователей в группу' 
      },
      /** Ошибка валидации группы */
      GROUP_NOT_FOUND: { 
        code: 'CORE:ITEM_SELECTOR:ADD_USERS:VALIDATE:002', 
        description: 'Группа не найдена при добавлении пользователей' 
      },
      /** Ошибка валидации пользователей */
      USERS_NOT_FOUND: { 
        code: 'CORE:ITEM_SELECTOR:ADD_USERS:VALIDATE:003', 
        description: 'Пользователи не найдены при добавлении в группу' 
      },
      /** Начало проверки статуса учетной записи */
      ACCOUNT_STATUS_START: { 
        code: 'CORE:ITEM_SELECTOR:ADD_USERS:VALIDATE:004', 
        description: 'Начата проверка статуса учетной записи пользователя' 
      },
      /** Пользователь имеет активный статус */
      ACCOUNT_STATUS_ACTIVE: { 
        code: 'CORE:ITEM_SELECTOR:ADD_USERS:VALIDATE:005', 
        description: 'Пользователь имеет активный статус учетной записи' 
      },
      /** Пользователь имеет неактивный статус */
      ACCOUNT_STATUS_INACTIVE: { 
        code: 'CORE:ITEM_SELECTOR:ADD_USERS:VALIDATE:006', 
        description: 'Пользователь имеет неактивный статус учетной записи' 
      },
      /** Проверка настроек приложения для неактивных пользователей */
      ACCOUNT_STATUS_CHECK_SETTINGS: { 
        code: 'CORE:ITEM_SELECTOR:ADD_USERS:VALIDATE:007', 
        description: 'Проверка настроек приложения для добавления неактивных пользователей' 
      },
      /** Учетная запись не найдена */
      ACCOUNT_NOT_FOUND: { 
        code: 'CORE:ITEM_SELECTOR:ADD_USERS:VALIDATE:008', 
        description: 'Учетная запись пользователя не найдена' 
      },
      /** Ошибка проверки статуса учетной записи */
      ACCOUNT_STATUS_ERROR: { 
        code: 'CORE:ITEM_SELECTOR:ADD_USERS:VALIDATE:009', 
        description: 'Ошибка при проверке статуса учетной записи' 
      }
    },
    /** Операция добавления пользователей в группу */
    PROCESS: {
      /** Начало процесса добавления пользователей */
      INITIATED: { 
        code: 'CORE:ITEM_SELECTOR:ADD_USERS:PROCESS:001', 
        description: 'Начат процесс добавления пользователей в группу' 
      },
      /** Успешное добавление пользователей */
      SUCCESS: { 
        code: 'CORE:ITEM_SELECTOR:ADD_USERS:PROCESS:002', 
        description: 'Пользователи успешно добавлены в группу' 
      },
      /** Ошибка при добавлении пользователей */
      ERROR: { 
        code: 'CORE:ITEM_SELECTOR:ADD_USERS:PROCESS:003', 
        description: 'Ошибка при добавлении пользователей в группу' 
      }
    },
    /** Операция формирования ответа */
    RESPONSE: {
      /** Успешный ответ на запрос добавления пользователей */
      SUCCESS: { 
        code: 'CORE:ITEM_SELECTOR:ADD_USERS:RESPONSE:001', 
        description: 'Успешный ответ на запрос добавления пользователей в группу' 
      },
      /** Ошибка при формировании ответа */
      ERROR: { 
        code: 'CORE:ITEM_SELECTOR:ADD_USERS:RESPONSE:002', 
        description: 'Ошибка при формировании ответа на запрос добавления пользователей' 
      }
    }
  },
  
  /**
   * События, связанные со сменой владельца группы
   */
  GROUP_OWNER: {
    /** Операция получения запроса */
    REQUEST: {
      /** Получен запрос на смену владельца группы */
      RECEIVED: { 
        code: 'CORE:ITEM_SELECTOR:GROUP_OWNER:REQUEST:001', 
        description: 'Получен запрос на смену владельца группы' 
      },
      /** Некорректный запрос на смену владельца */
      INVALID: { 
        code: 'CORE:ITEM_SELECTOR:GROUP_OWNER:REQUEST:002', 
        description: 'Некорректный запрос на смену владельца группы' 
      }
    },
    /** Операция валидации данных */
    VALIDATE: {
      /** Успешная валидация входных данных */
      SUCCESS: { 
        code: 'CORE:ITEM_SELECTOR:GROUP_OWNER:VALIDATE:001', 
        description: 'Успешная валидация данных для смены владельца группы' 
      },
      /** Отсутствует обязательное поле */
      REQUIRED_FIELD: { 
        code: 'CORE:ITEM_SELECTOR:GROUP_OWNER:VALIDATE:002', 
        description: 'Отсутствует обязательное поле для смены владельца группы' 
      },
      /** Валидация существования группы */
      GROUP: { 
        code: 'CORE:ITEM_SELECTOR:GROUP_OWNER:VALIDATE:003', 
        description: 'Валидация существования группы при смене владельца' 
      },
      /** Группа не найдена */
      GROUP_NOT_FOUND: { 
        code: 'CORE:ITEM_SELECTOR:GROUP_OWNER:VALIDATE:004', 
        description: 'Группа не найдена при смене владельца' 
      },
      /** Валидация существования пользователя (нового владельца) */
      USER: { 
        code: 'CORE:ITEM_SELECTOR:GROUP_OWNER:VALIDATE:005', 
        description: 'Валидация существования пользователя при смене владельца группы' 
      },
      /** Пользователь не найден */
      USER_NOT_FOUND: { 
        code: 'CORE:ITEM_SELECTOR:GROUP_OWNER:VALIDATE:006', 
        description: 'Пользователь для смены владельца не найден' 
      }
    },
    /** Операция смены владельца */
    CHANGE: {
      /** Начало процесса смены владельца */
      INITIATED: { 
        code: 'CORE:ITEM_SELECTOR:GROUP_OWNER:CHANGE:001', 
        description: 'Начат процесс смены владельца группы' 
      },
      /** Обновление данных о владельце группы */
      UPDATING: { 
        code: 'CORE:ITEM_SELECTOR:GROUP_OWNER:CHANGE:002', 
        description: 'Обновление данных о владельце группы' 
      },
      /** Текущий владелец совпадает с новым (смена не требуется) */
      NO_CHANGE: { 
        code: 'CORE:ITEM_SELECTOR:GROUP_OWNER:CHANGE:003', 
        description: 'Текущий владелец совпадает с новым, смена не требуется' 
      },
      /** Успешная смена владельца группы */
      SUCCESS: { 
        code: 'CORE:ITEM_SELECTOR:GROUP_OWNER:CHANGE:004', 
        description: 'Владелец группы успешно изменен' 
      },
      /** Ошибка при смене владельца группы */
      ERROR: { 
        code: 'CORE:ITEM_SELECTOR:GROUP_OWNER:CHANGE:005', 
        description: 'Ошибка при смене владельца группы' 
      }
    },
    /** Операции с базой данных */
    DATABASE: {
      /** Начало транзакции */
      TRANSACTION_START: { 
        code: 'CORE:ITEM_SELECTOR:GROUP_OWNER:DATABASE:001', 
        description: 'Начата транзакция смены владельца группы' 
      },
      /** Успешное выполнение операции в БД */
      SUCCESS: { 
        code: 'CORE:ITEM_SELECTOR:GROUP_OWNER:DATABASE:002', 
        description: 'Успешное выполнение операции в БД при смене владельца группы' 
      },
      /** Ошибка при выполнении операции в БД */
      ERROR: { 
        code: 'CORE:ITEM_SELECTOR:GROUP_OWNER:DATABASE:003', 
        description: 'Ошибка при выполнении операции в БД при смене владельца группы' 
      }
    },
    /** Операция формирования ответа */
    RESPONSE: {
      /** Успешный ответ на запрос смены владельца */
      SUCCESS: { 
        code: 'CORE:ITEM_SELECTOR:GROUP_OWNER:RESPONSE:001', 
        description: 'Успешный ответ на запрос смены владельца группы' 
      },
      /** Ошибка при формировании ответа */
      ERROR: { 
        code: 'CORE:ITEM_SELECTOR:GROUP_OWNER:RESPONSE:002', 
        description: 'Ошибка при формировании ответа на запрос смены владельца группы' 
      },
      /** Внутренняя ошибка сервера */
      INTERNAL_ERROR: { 
        code: 'CORE:ITEM_SELECTOR:GROUP_OWNER:RESPONSE:003', 
        description: 'Внутренняя ошибка сервера при обработке запроса смены владельца группы' 
      }
    }
  },
  
  /**
   * Общие события для операций с базой данных
   */
  DATABASE: {
    /** Освобождение клиента базы данных */
    CLIENT_RELEASED: { 
      code: 'CORE:ITEM_SELECTOR:DATABASE:001', 
      description: 'Клиент базы данных освобожден' 
    }
  }
};