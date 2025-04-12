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
      /** Настройка успешно получена */
      SUCCESS: { 
        code: 'CORE:SETTINGS:GET:BY_NAME:001', 
        description: 'Настройка успешно получена из кэша' 
      },
      /** Настройка не найдена в кэше */
      NOT_FOUND: { 
        code: 'CORE:SETTINGS:GET:BY_NAME:002', 
        description: 'Настройка не найдена в кэше' 
      }
    },
    /** Операция получения настроек по секции */
    BY_SECTION: {
      /** Настройки секции успешно получены */
      SUCCESS: { 
        code: 'CORE:SETTINGS:GET:BY_SECTION:001', 
        description: 'Настройки секции успешно получены из кэша' 
      },
      /** Настройки секции не найдены */
      NOT_FOUND: { 
        code: 'CORE:SETTINGS:GET:BY_SECTION:002', 
        description: 'Настройки секции не найдены в кэше' 
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
  }
};