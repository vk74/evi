/**
 * Коды событий для системных операций
 */
export const SystemEvents = {
  CLEANUP: {
    /** Операция запуска очистки */
    START: {
      /** Успешный запуск очистки */
      SUCCESS: {
        code: 'ADMIN:SYSTEM:CLEANUP:START:001',
        description: 'Начата процедура очистки устаревших данных'
      },
      /** Ошибка запуска очистки */
      ERROR: {
        code: 'ADMIN:SYSTEM:CLEANUP:START:002',
        description: 'Ошибка при запуске процедуры очистки'
      }
    },
    /** Операция очистки данных */
    PROCESS: {
      /** Успешное завершение очистки */
      SUCCESS: {
        code: 'ADMIN:SYSTEM:CLEANUP:PROCESS:001',
        description: 'Процедура очистки успешно завершена'
      },
      /** Ошибка при очистке данных */
      ERROR: {
        code: 'ADMIN:SYSTEM:CLEANUP:PROCESS:002',
        description: 'Ошибка при обработке данных во время очистки'
      }
    }
  },
  BACKUP: {
    /** Операция создания резервной копии */
    CREATE: {
      /** Успешное создание резервной копии */
      SUCCESS: {
        code: 'ADMIN:SYSTEM:BACKUP:CREATE:001',
        description: 'Резервная копия успешно создана'
      },
      /** Ошибка создания резервной копии */
      ERROR: {
        code: 'ADMIN:SYSTEM:BACKUP:CREATE:002',
        description: 'Ошибка при создании резервной копии'
      }
    },
    /** Операция восстановления из резервной копии */
    RESTORE: {
      /** Успешное восстановление из резервной копии */
      SUCCESS: {
        code: 'ADMIN:SYSTEM:BACKUP:RESTORE:001',
        description: 'Данные успешно восстановлены из резервной копии'
      },
      /** Ошибка восстановления из резервной копии */
      ERROR: {
        code: 'ADMIN:SYSTEM:BACKUP:RESTORE:002',
        description: 'Ошибка при восстановлении данных из резервной копии'
      }
    }
  }
};