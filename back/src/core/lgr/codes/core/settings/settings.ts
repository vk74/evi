/**
 * Коды событий для операций с настройками системы
 */
export const SettingsEvents = {
  /**
   * События связанные с загрузкой настроек
   */
  LOAD: {
    /** Операция запуска загрузки */
    START: {
      /** Начата загрузка настроек */
      INITIATED: { 
        code: 'CORE:SETTINGS:LOAD:START:001', 
        description: 'Начата загрузка настроек из базы данных' 
      },
      /** Ошибка при запуске загрузки настроек */
      ERROR: { 
        code: 'CORE:SETTINGS:LOAD:START:002', 
        description: 'Ошибка при запуске загрузки настроек' 
      }
    },
    /** Операция выполнения загрузки */
    PROCESS: {
      /** Успешная загрузка настроек */
      SUCCESS: { 
        code: 'CORE:SETTINGS:LOAD:PROCESS:001', 
        description: 'Настройки успешно загружены из базы данных' 
      },
      /** Настройки не найдены в базе данных */
      EMPTY: { 
        code: 'CORE:SETTINGS:LOAD:PROCESS:002', 
        description: 'Настройки не найдены в базе данных' 
      },
      /** Ошибка при загрузке настроек */
      ERROR: { 
        code: 'CORE:SETTINGS:LOAD:PROCESS:003', 
        description: 'Ошибка при загрузке настроек из базы данных' 
      }
    }
  },
  /**
   * События связанные с кэшированием настроек
   */
  CACHE: {
    /** Операция обновления кэша */
    UPDATE: {
      /** Успешное обновление кэша */
      SUCCESS: { 
        code: 'CORE:SETTINGS:CACHE:UPDATE:001', 
        description: 'Кэш настроек успешно обновлен' 
      },
      /** Ошибка при обновлении кэша */
      ERROR: { 
        code: 'CORE:SETTINGS:CACHE:UPDATE:002', 
        description: 'Ошибка при обновлении кэша настроек' 
      }
    },
    /** Операция очистки кэша */
    CLEAR: {
      /** Успешная очистка кэша */
      SUCCESS: { 
        code: 'CORE:SETTINGS:CACHE:CLEAR:001', 
        description: 'Кэш настроек успешно очищен' 
      },
      /** Ошибка при очистке кэша */
      ERROR: { 
        code: 'CORE:SETTINGS:CACHE:CLEAR:002', 
        description: 'Ошибка при очистке кэша настроек' 
      }
    }
  },
  /**
   * События связанные с получением настроек
   */
  GET: {
    /** Операция получения настройки по имени */
    BY_NAME: {
      /** Инициировано получение настройки по имени */
      INITIATED: {
        code: 'CORE:SETTINGS:GET:BY_NAME:000',
        description: 'Инициировано получение настройки по имени'
      },
      /** Настройка успешно получена */
      SUCCESS: { 
        code: 'CORE:SETTINGS:GET:BY_NAME:001', 
        description: 'Настройка успешно получена из кэша' 
      },
      /** Настройка не найдена в кэше */
      NOT_FOUND: { 
        code: 'CORE:SETTINGS:GET:BY_NAME:002', 
        description: 'Настройка не найдена в кэше' 
      },
      /** Настройка конфиденциальна */
      CONFIDENTIAL: {
        code: 'CORE:SETTINGS:GET:BY_NAME:003',
        description: 'Доступ к конфиденциальной настройке запрещен'
      },
      /** Ошибка при получении настройки */
      ERROR: {
        code: 'CORE:SETTINGS:GET:BY_NAME:004',
        description: 'Ошибка при получении настройки по имени'
      }
    },
    /** Операция получения настроек по секции */
    BY_SECTION: {
      /** Инициировано получение настроек по секции */
      INITIATED: {
        code: 'CORE:SETTINGS:GET:BY_SECTION:000',
        description: 'Инициировано получение настроек по секции'
      },
      /** Настройки секции успешно получены */
      SUCCESS: { 
        code: 'CORE:SETTINGS:GET:BY_SECTION:001', 
        description: 'Настройки секции успешно получены из кэша' 
      },
      /** Настройки секции не найдены */
      NOT_FOUND: { 
        code: 'CORE:SETTINGS:GET:BY_SECTION:002', 
        description: 'Настройки секции не найдены в кэше' 
      },
      /** Ошибка при получении настроек секции */
      ERROR: {
        code: 'CORE:SETTINGS:GET:BY_SECTION:003',
        description: 'Ошибка при получении настроек по секции'
      }
    },
    /** Операция получения всех настроек */
    ALL: {
      /** Инициировано получение всех настроек */
      INITIATED: {
        code: 'CORE:SETTINGS:GET:ALL:000',
        description: 'Инициировано получение всех настроек'
      },
      /** Все настройки успешно получены */
      SUCCESS: {
        code: 'CORE:SETTINGS:GET:ALL:001',
        description: 'Все настройки успешно получены из кэша'
      },
      /** Ошибка при получении всех настроек */
      ERROR: {
        code: 'CORE:SETTINGS:GET:ALL:002',
        description: 'Ошибка при получении всех настроек'
      }
    }
  },
  /**
   * События связанные с инициализацией модуля настроек
   */
  INIT: {
    /** Операция инициализации */
    PROCESS: {
      /** Начало инициализации */
      START: { 
        code: 'CORE:SETTINGS:INIT:PROCESS:001', 
        description: 'Начата инициализация модуля настроек' 
      },
      /** Успешная инициализация */
      SUCCESS: { 
        code: 'CORE:SETTINGS:INIT:PROCESS:002', 
        description: 'Модуль настроек успешно инициализирован' 
      },
      /** Ошибка инициализации */
      ERROR: { 
        code: 'CORE:SETTINGS:INIT:PROCESS:003', 
        description: 'Ошибка при инициализации модуля настроек' 
      }
    }
  },
  /**
   * События связанные с API запросами настроек
   */
  API: {
    /** Операции запроса настроек */
    FETCH: {
      /** Запрос получен */
      RECEIVED: {
        code: 'CORE:SETTINGS:API:FETCH:001', 
        description: 'Получен запрос на получение настроек'
      },
      /** Запрос обработан успешно */
      SUCCESS: {
        code: 'CORE:SETTINGS:API:FETCH:002',
        description: 'Запрос на получение настроек успешно обработан'
      },
      /** Ошибка валидации запроса */
      VALIDATION_ERROR: {
        code: 'CORE:SETTINGS:API:FETCH:003',
        description: 'Ошибка валидации запроса на получение настроек'
      },
      /** Ошибка обработки запроса */
      ERROR: {
        code: 'CORE:SETTINGS:API:FETCH:004',
        description: 'Ошибка при обработке запроса на получение настроек'
      }
    }
  },
  /**
   * События связанные с обновлением настроек
   */
  UPDATE: {
    /** Операция начала обновления настройки */
    START: {
      /** Инициировано обновление настройки */
      INITIATED: { 
        code: 'CORE:SETTINGS:UPDATE:START:001', 
        description: 'Инициировано обновление настройки' 
      },
      /** Получен запрос на обновление настройки */
      RECEIVED: {
        code: 'CORE:SETTINGS:UPDATE:START:002',
        description: 'Получен запрос на обновление настройки'
      }
    },
    /** Операция выполнения обновления настройки */
    PROCESS: {
      /** Настройка не найдена в кэше */
      CACHE_MISS: {
        code: 'CORE:SETTINGS:UPDATE:PROCESS:001',
        description: 'Настройка не найдена в кэше при обновлении'
      },
      /** Кэш обновлен с новым значением настройки */
      CACHE_UPDATE: {
        code: 'CORE:SETTINGS:UPDATE:PROCESS:002',
        description: 'Кэш обновлен с новым значением настройки'
      },
      /** Ошибка валидации запроса */
      VALIDATION_ERROR: {
        code: 'CORE:SETTINGS:UPDATE:PROCESS:003',
        description: 'Ошибка валидации данных для обновления настройки'
      },
      /** Успешное обновление настройки */
      SUCCESS: { 
        code: 'CORE:SETTINGS:UPDATE:PROCESS:004', 
        description: 'Настройка успешно обновлена' 
      },
      /** Ошибка при обновлении настройки */
      ERROR: { 
        code: 'CORE:SETTINGS:UPDATE:PROCESS:005', 
        description: 'Ошибка при обновлении настройки' 
      }
    }
  },
  /**
   * События связанные с валидацией настроек
   */
  VALIDATE: {
    /** Операция выполнения валидации */
    PROCESS: {
      /** Начало валидации */
      START: { 
        code: 'CORE:SETTINGS:VALIDATE:PROCESS:001', 
        description: 'Начата валидация значения настройки по схеме' 
      },
      /** Валидация пропущена (нет схемы) */
      SKIP: { 
        code: 'CORE:SETTINGS:VALIDATE:PROCESS:002', 
        description: 'Валидация пропущена - схема отсутствует' 
      },
      /** Успешная валидация */
      SUCCESS: { 
        code: 'CORE:SETTINGS:VALIDATE:PROCESS:003', 
        description: 'Значение настройки успешно валидировано' 
      },
      /** Ошибка валидации */
      ERROR: { 
        code: 'CORE:SETTINGS:VALIDATE:PROCESS:004', 
        description: 'Ошибка валидации значения настройки' 
      }
    }
  }
};