/**
 * Коды событий для операций с сервисами
 */
export const ServicesEvents = {
  GROUPS: {
    /** Операция создания группы */
    CREATE: {
      /** Успешное создание группы */
      SUCCESS: { 
        code: 'ADMIN:SERVICES:GROUPS:CREATE:001', 
        description: 'Группа успешно создана' 
      },
      /** Ошибка валидации имени группы */
      NAME_VALIDATION_ERROR: { 
        code: 'ADMIN:SERVICES:GROUPS:CREATE:002', 
        description: 'Ошибка валидации имени группы' 
      },
      /** Ошибка доступа к базе данных */
      DATABASE_ERROR: { 
        code: 'ADMIN:SERVICES:GROUPS:CREATE:003', 
        description: 'Ошибка доступа к базе данных при создании группы' 
      },
      /** Недостаточно прав для создания группы */
      PERMISSION_DENIED: { 
        code: 'ADMIN:SERVICES:GROUPS:CREATE:004', 
        description: 'Недостаточно прав для создания группы' 
      }
    },
    /** Операция обновления группы */
    UPDATE: {
      /** Успешное обновление группы */
      SUCCESS: {
        code: 'ADMIN:SERVICES:GROUPS:UPDATE:001',
        description: 'Группа успешно обновлена'
      },
      /** Группа не найдена */
      NOT_FOUND: {
        code: 'ADMIN:SERVICES:GROUPS:UPDATE:002',
        description: 'Группа не найдена'
      }
    },
    /** Операция удаления группы */
    DELETE: {
      /** Успешное удаление группы */
      SUCCESS: {
        code: 'ADMIN:SERVICES:GROUPS:DELETE:001',
        description: 'Группа успешно удалена'
      },
      /** Ошибка при удалении группы */
      ERROR: {
        code: 'ADMIN:SERVICES:GROUPS:DELETE:002',
        description: 'Ошибка при удалении группы'
      }
    },
    /** Операции с участниками группы */
    MEMBERS: {
      /** Успешное удаление участников группы */
      REMOVE_SUCCESS: {
        code: 'ADMIN:SERVICES:GROUPS:MEMBERS:001',
        description: 'Участники успешно удалены из группы'
      },
      /** Успешное добавление участников в группу */
      ADD_SUCCESS: {
        code: 'ADMIN:SERVICES:GROUPS:MEMBERS:002',
        description: 'Участники успешно добавлены в группу'
      }
    }
  }
};