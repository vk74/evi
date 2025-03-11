/**
 * Коды событий для операций с каталогом
 */
export const CatalogEvents = {
  ITEMS: {
    /** Операция создания элемента каталога */
    CREATE: {
      /** Успешное создание элемента */
      SUCCESS: { 
        code: 'ADMIN:CATALOG:ITEMS:CREATE:001', 
        description: 'Элемент каталога успешно создан' 
      },
      /** Ошибка валидации данных элемента */
      VALIDATION_ERROR: { 
        code: 'ADMIN:CATALOG:ITEMS:CREATE:002', 
        description: 'Ошибка валидации данных элемента каталога' 
      }
    },
    /** Операция обновления элемента каталога */
    UPDATE: {
      /** Успешное обновление элемента */
      SUCCESS: {
        code: 'ADMIN:CATALOG:ITEMS:UPDATE:001',
        description: 'Элемент каталога успешно обновлен'
      },
      /** Элемент не найден */
      NOT_FOUND: {
        code: 'ADMIN:CATALOG:ITEMS:UPDATE:002',
        description: 'Элемент каталога не найден'
      }
    },
    /** Операция удаления элемента каталога */
    DELETE: {
      /** Успешное удаление элемента */
      SUCCESS: {
        code: 'ADMIN:CATALOG:ITEMS:DELETE:001',
        description: 'Элемент каталога успешно удален'
      },
      /** Ошибка при удалении элемента */
      ERROR: {
        code: 'ADMIN:CATALOG:ITEMS:DELETE:002',
        description: 'Ошибка при удалении элемента каталога'
      }
    }
  },
  CATEGORIES: {
    /** Операция создания категории каталога */
    CREATE: {
      /** Успешное создание категории */
      SUCCESS: {
        code: 'ADMIN:CATALOG:CATEGORIES:CREATE:001',
        description: 'Категория каталога успешно создана'
      },
      /** Ошибка валидации данных категории */
      VALIDATION_ERROR: {
        code: 'ADMIN:CATALOG:CATEGORIES:CREATE:002',
        description: 'Ошибка валидации данных категории каталога'
      }
    },
    /** Операция обновления категории каталога */
    UPDATE: {
      /** Успешное обновление категории */
      SUCCESS: {
        code: 'ADMIN:CATALOG:CATEGORIES:UPDATE:001',
        description: 'Категория каталога успешно обновлена'
      },
      /** Категория не найдена */
      NOT_FOUND: {
        code: 'ADMIN:CATALOG:CATEGORIES:UPDATE:002',
        description: 'Категория каталога не найдена'
      }
    }
  }
};