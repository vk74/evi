/**
 * Основной экспортный файл для системы логирования
 */

// Экспорт основных типов
export { LogLevel, LogContext, LogParams, Logger } from './logger.types';

// Экспорт функции создания логгера
export { createLogger } from './logger.factory';

// Экспорт справочника кодов событий
export { EventIds, getEventDescription } from './logger.codes';

// Экспорт конфигурации
export { getLoggerConfig, updateLoggerConfig } from './logger.config';