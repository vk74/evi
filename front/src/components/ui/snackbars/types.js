// Определяет доступные типы уведомлений 

export const SnackbarType = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
  }
  
  /**
   * @typedef {Object} SnackbarMessage
   * @property {string} type - Тип уведомления из SnackbarType
   * @property {string} message - Текст уведомления
   * @property {number} [timeout] - Время показа в миллисекундах
   * @property {boolean} [closable] - Можно ли закрыть вручную
   * @property {string} [position] - Позиция на экране
   */