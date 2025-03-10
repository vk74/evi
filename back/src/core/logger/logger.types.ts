/**
 * Типы и интерфейсы для системы логирования
 */

/**
 * Уровни логирования
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

/**
 * Контекст логгера, содержит информацию об источнике события
 */
export interface LogContext {
  /** Название модуля (например, "AdminGroupService") */
  module: string;
  /** Имя файла источника (например, "service.create.group.ts") */
  fileName?: string;
  /** ID пользователя в системе */
  userId?: string;
  /** Дополнительные контекстные данные */
  [key: string]: any;
}

/**
 * Параметры для методов логирования
 */
export interface LogParams {
  /** Код события в формате "MODULE:FUNCTION:OPERATION:TYPE:NUMBER" */
  code: string;
  /** Сообщение (может быть заменено или дополнено описанием из справочника) */
  message?: string;
  /** Детали события (дополнительные данные) */
  details?: Record<string, any>;
  /** Объект ошибки (для уровней error и fatal) */
  error?: Error | unknown;
}

/**
 * Полное сообщение логирования
 */
export interface LogMessage extends Omit<LogParams, 'error'> {
  /** Временная метка события */
  timestamp: string;
  /** Уровень логирования */
  level: LogLevel;
  /** Сообщение события */
  message: string;
  /** Источник события */
  source: LogContext;
  /** Объект ошибки (для уровней error и fatal) */
  error?: {
    name?: string;
    message?: string;
    stack?: string;
    [key: string]: any;
  };
}

/**
 * Интерфейс для транспортов логирования
 */
export interface LogTransport {
  /** Название транспорта */
  name: string;
  /** Функция для отправки сообщения в транспорт */
  log: (message: LogMessage) => void;
}

/**
 * Опции при создании логгера
 */
export interface LoggerOptions {
  /** Минимальный уровень логирования (сообщения с уровнем ниже не будут обрабатываться) */
  minLevel?: LogLevel;
  /** Список используемых транспортов */
  transports?: string[];
}

/**
 * Интерфейс экземпляра логгера
 */
export interface Logger {
  /** Логирование отладочной информации */
  debug: (params: LogParams) => void;
  /** Логирование информационных сообщений */
  info: (params: LogParams) => void;
  /** Логирование предупреждений */
  warn: (params: LogParams) => void;
  /** Логирование ошибок */
  error: (params: LogParams) => void;
  /** Логирование критических ошибок */
  fatal: (params: LogParams) => void;
  /** Создание нового логгера с расширенным контекстом */
  withContext: (additionalContext: Partial<LogContext>) => Logger;
}