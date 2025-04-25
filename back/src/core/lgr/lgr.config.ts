/**
 * Конфигурация логгера
 */
import { LogLevel } from './lgr.types';

/**
 * Конфигурация логгера по умолчанию
 */
export const lgrConfig = {
  /** Уровень логирования по умолчанию */
  defaultLogLevel: LogLevel.INFO,
  
  /** Активные транспорты для логирования */
  enabledTransports: ['console'],
  
  /** Название приложения */
  appName: 'admin-panel',
  
  /** Окружение (берется из переменной окружения или значение по умолчанию) */
  environment: process.env.NODE_ENV || 'development',
  
  /** Показывать детальную информацию в production */
  showDetailsInProduction: true,
  
  /** Формат временной метки */
  timestampFormat: 'ISO',
  
  /** Формат вывода (console, json, elastic) */
  outputFormat: process.env.LOG_FORMAT || 'console',
    /** SIEM-специфичные настройки */
  siem: {
    /** Адрес SIEM-системы */
    endpoint: process.env.SIEM_ENDPOINT,
    /** Ключ API для SIEM */
    apiKey: process.env.SIEM_API_KEY,
    /** Тип форматирования */
    format: process.env.SIEM_FORMAT || 'json'
  }
};

/**
 * Получение конфигурации логгера
 * @returns Текущая конфигурация
 */
export function getLgrConfig() {
  return lgrConfig;
}

/**
 * Обновление конфигурации логгера
 * @param newConfig Новые настройки
 */
export function updateLgrConfig(newConfig: Partial<typeof lgrConfig>) {
  Object.assign(lgrConfig, newConfig);
}