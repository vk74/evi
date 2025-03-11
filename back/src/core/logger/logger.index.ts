/**
 * Основной экспортный файл для системы логирования
 */

// Экспорт основных типов с использованием 'export type'
export type { 
  LogLevel, 
  LogContext, 
  LogParams, 
  Logger 
} from './logger.types';

// Экспорт enum можно оставить без 'type'
export { OperationType } from './logger.types';

// Экспорт функции создания логгеров
export { 
  createLogger,
  createAppLogger,
  createSystemLogger,
  createSecurityLogger,
  createAuditLogger,
  createIntegrationLogger,
  createPerformanceLogger
} from './logger.factory';

// Экспорт справочника кодов событий
export { Events, getEventDescription } from './codes';

// Экспорт конфигурации
export { getLoggerConfig, updateLoggerConfig } from './logger.config';

// Экспорт функций для работы с транспортами
export { registerTransport } from './transports/logger.transports.index';