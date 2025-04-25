/**
 * Основной экспортный файл для системы логирования
 */

// Экспорт основных типов с использованием 'export type'
export type { 
  LogLevel, 
  LogContext, 
  LogParams, 
  Lgr 
} from './lgr.types';

// Экспорт enum можно оставить без 'type'
export { OperationType } from './lgr.types';

// Экспорт функции создания логгеров
export { 
  createLgr,
  createAppLgr,
  createSystemLgr,
  createSecurityLgr,
  createAuditLgr,
  createIntegrationLgr,
  createPerformanceLgr
} from './lgr.factory';

// Экспорт справочника кодов событий
export { Events, getEventDescription } from './codes';

// Экспорт конфигурации
export { getLgrConfig, updateLgrConfig } from './lgr.config';

// Экспорт функций для работы с транспортами
export { registerTransport } from './transports/lgr.transports.index';