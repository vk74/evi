/**
 * Коды событий для операций основного сервера
 */
export const ServerEvents = {
  /**
   * События связанные с запуском сервера
   */
  STARTUP: {
    /** Операции инициализации */
    INIT: {
      /** Начало инициализации сервера */
      START: {
        code: 'CORE:SERVER:STARTUP:INIT:001',
        description: 'Начало инициализации сервера'
      },
      /** Успешная инициализация */
      SUCCESS: {
        code: 'CORE:SERVER:STARTUP:INIT:002',
        description: 'Сервер успешно инициализирован'
      },
      /** Ошибка инициализации */
      ERROR: {
        code: 'CORE:SERVER:STARTUP:INIT:003',
        description: 'Ошибка инициализации сервера'
      }
    },
    /** Операции загрузки ключей */
    KEYS: {
      /** Успешная загрузка ключей */
      SUCCESS: {
        code: 'CORE:SERVER:STARTUP:KEYS:001',
        description: 'Приватный ключ успешно загружен'
      },
      /** Ошибка загрузки ключей */
      ERROR: {
        code: 'CORE:SERVER:STARTUP:KEYS:002',
        description: 'Ошибка загрузки приватного ключа'
      }
    },
    /** Операции настройки CORS и middleware */
    MIDDLEWARE: {
      /** Успешная настройка middleware */
      SUCCESS: {
        code: 'CORE:SERVER:STARTUP:MIDDLEWARE:001',
        description: 'Middleware успешно настроены'
      }
    },
    /** Операции регистрации маршрутов */
    ROUTES: {
      /** Успешная регистрация маршрутов */
      SUCCESS: {
        code: 'CORE:SERVER:STARTUP:ROUTES:001',
        description: 'Маршруты успешно зарегистрированы'
      }
    },
    /** Операции запуска HTTP сервера */
    HTTP: {
      /** Начало прослушивания порта */
      LISTENING: {
        code: 'CORE:SERVER:STARTUP:HTTP:001',
        description: 'Сервер начал прослушивать порт'
      },
      /** Ошибка при прослушивании порта */
      ERROR: {
        code: 'CORE:SERVER:STARTUP:HTTP:002',
        description: 'Ошибка при запуске HTTP сервера'
      }
    }
  },
  /**
   * События связанные с запросами
   */
  REQUEST: {
    /** Операции проверки готовности сервера */
    READINESS: {
      /** Сервер еще не готов к обработке запросов */
      NOT_READY: {
        code: 'CORE:SERVER:REQUEST:READINESS:001',
        description: 'Сервер не готов к обработке запросов, настройки загружаются'
      },
      /** Сервер готов к обработке запросов */
      READY: {
        code: 'CORE:SERVER:REQUEST:READINESS:002',
        description: 'Сервер готов к обработке запросов'
      }
    }
  },
  /**
   * События связанные с прототипами Excel
   */
  EXCEL: {
    /** Операции с Excel протоипами */
    PROTOTYPE: {
      /** Успешная генерация Excel файла */
      SUCCESS: {
        code: 'CORE:SERVER:EXCEL:PROTOTYPE:001',
        description: 'Excel файл успешно сгенерирован'
      },
      /** Ошибка генерации Excel файла */
      ERROR: {
        code: 'CORE:SERVER:EXCEL:PROTOTYPE:002',
        description: 'Ошибка при генерации Excel файла'
      }
    }
  }
};