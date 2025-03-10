/**
 * Конфигурация логгера
 */
import { LogLevel } from './logger.types';

/**
 * Конфигурация логгера по умолчанию
 */
export const loggerConfig = {
  /** Уровень логирования по умолчанию */
  defaultLogLevel: LogLevel.INFO,
  
  /** Активные транспорты для логирования */
  enabledTransports: ['console'],
  
  /** Название приложения */
  appName: 'my-app',
  
  /** Окружение (берется из переменной окружения или значение по умолчанию) */
  environment: process.env.NODE_ENV || 'development',
  
  /** Показывать детальную информацию в production */
  showDetailsInProduction: false,
  
  /** Формат временной метки */
  timestampFormat: 'ISO', // 'ISO' или 'LOCALE'
};

/**
 * Получение конфигурации логгера
 * @returns Текущая конфигурация
 */
export function getLoggerConfig() {
  return loggerConfig;
}

/**
 * Обновление конфигурации логгера
 * @param newConfig Новые настройки
 */
export function updateLoggerConfig(newConfig: Partial<typeof loggerConfig>) {
  Object.assign(loggerConfig, newConfig);
}