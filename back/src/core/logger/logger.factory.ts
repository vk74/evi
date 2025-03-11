/**
 * Фабрика для создания логгеров
 */
import { 
  LogContext, 
  LogLevel, 
  LogMessage, 
  LogParams,
  Logger,
  LoggerOptions,
  OperationType
} from './logger.types';
import { getLoggerConfig } from './logger.config';
import { getEventDescription } from './codes';
import { getActiveTransports } from './transports/logger.transports.index';

/**
 * Преобразует объект ошибки в структуру для логирования
 * @param error Объект ошибки
 * @returns Структурированное представление ошибки
 */
function formatError(error: unknown): LogMessage['error'] {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }
  
  if (typeof error === 'object' && error !== null) {
    return { ...error };
  }
  
  return {
    message: String(error)
  };
}

/**
 * Создает новый экземпляр логгера
 * @param context Базовый контекст логгера
 * @param options Опции логгера
 * @returns Экземпляр логгера
 */
export function createLogger(context: LogContext, options?: LoggerOptions): Logger {
  // Получаем конфигурацию
  const config = getLoggerConfig();
  
  // Определяем минимальный уровень логирования
  const minLevel = options?.minLevel || config.defaultLogLevel;
  
  // Получаем активные транспорты
  const activeTransports = getActiveTransports(
    options?.transports || config.enabledTransports
  );
  
  /**
   * Проверяет, должно ли сообщение данного уровня обрабатываться
   * @param level Уровень сообщения
   * @returns true, если сообщение должно быть обработано
   */
  function shouldLog(level: LogLevel): boolean {
    const levels = Object.values(LogLevel);
    const minLevelIndex = levels.indexOf(minLevel);
    const currentLevelIndex = levels.indexOf(level);
    
    return currentLevelIndex >= minLevelIndex;
  }
  
  /**
   * Создает сообщение для логирования
   * @param level Уровень логирования
   * @param params Параметры логирования
   * @returns Полное сообщение для логирования
   */
  function createLogMessage(level: LogLevel, params: LogParams): LogMessage {
    const { code, message, details, error } = params;
    
    // Получаем описание из справочника
    const description = getEventDescription(code);
    
    // Формируем итоговое сообщение
    const finalMessage: LogMessage = {
      timestamp: new Date().toISOString(),
      level,
      code,
      message: message || description || code,
      source: context,
      details
    };
    
    // Добавляем информацию об ошибке, если она есть
    if (error) {
      finalMessage.error = formatError(error);
    }
    
    return finalMessage;
  }
  
  /**
   * Отправляет сообщение во все активные транспорты
   * @param level Уровень логирования
   * @param params Параметры логирования
   */
  function log(level: LogLevel, params: LogParams): void {
    // Проверяем, нужно ли обрабатывать сообщение данного уровня
    if (!shouldLog(level)) {
      return;
    }
    
    // Создаем сообщение
    const message = createLogMessage(level, params);
    
    // Отправляем во все активные транспорты
    for (const transport of activeTransports) {
      transport.log(message);
    }
  }
  
  // Создаем и возвращаем экземпляр логгера
  return {
    debug: (params: LogParams) => log(LogLevel.DEBUG, params),
    info: (params: LogParams) => log(LogLevel.INFO, params),
    warn: (params: LogParams) => log(LogLevel.WARN, params),
    error: (params: LogParams) => log(LogLevel.ERROR, params),
    fatal: (params: LogParams) => log(LogLevel.FATAL, params),
    
    withContext: (additionalContext: Partial<LogContext>) => {
      // Создаем новый контекст, объединяя текущий с дополнительным
      const newContext: LogContext = {
        ...context,
        ...additionalContext
      };
      
      // Создаем новый логгер с расширенным контекстом
      return createLogger(newContext, options);
    }
  };
}

/**
 * Создаёт логгер для бизнес-операций
 * @param context Контекст логгера (без типа операции)
 * @param options Опции логгера
 * @returns Экземпляр логгера для бизнес-операций
 */
export function createAppLogger(context: Omit<LogContext, 'operationType'>, options?: LoggerOptions): Logger {
  return createLogger({ ...context, operationType: OperationType.APP } as LogContext, options);
}

/**
 * Создаёт логгер для системных операций
 * @param context Контекст логгера (без типа операции)
 * @param options Опции логгера
 * @returns Экземпляр логгера для системных операций
 */
export function createSystemLogger(context: Omit<LogContext, 'operationType'>, options?: LoggerOptions): Logger {
  return createLogger({ ...context, operationType: OperationType.SYSTEM } as LogContext, options);
}

/**
 * Создаёт логгер для событий безопасности
 * @param context Контекст логгера (без типа операции)
 * @param options Опции логгера
 * @returns Экземпляр логгера для событий безопасности
 */
export function createSecurityLogger(context: Omit<LogContext, 'operationType'>, options?: LoggerOptions): Logger {
  return createLogger({ ...context, operationType: OperationType.SECURITY } as LogContext, options);
}

/**
 * Создаёт логгер для событий аудита
 * @param context Контекст логгера (без типа операции)
 * @param options Опции логгера
 * @returns Экземпляр логгера для событий аудита
 */
export function createAuditLogger(context: Omit<LogContext, 'operationType'>, options?: LoggerOptions): Logger {
  return createLogger({ ...context, operationType: OperationType.AUDIT } as LogContext, options);
}

/**
 * Создаёт логгер для событий интеграции
 * @param context Контекст логгера (без типа операции)
 * @param options Опции логгера
 * @returns Экземпляр логгера для событий интеграции
 */
export function createIntegrationLogger(context: Omit<LogContext, 'operationType'>, options?: LoggerOptions): Logger {
  return createLogger({ ...context, operationType: OperationType.INTGRN } as LogContext, options);
}

/**
 * Создаёт логгер для событий производительности
 * @param context Контекст логгера (без типа операции)
 * @param options Опции логгера
 * @returns Экземпляр логгера для событий производительности
 */
export function createPerformanceLogger(context: Omit<LogContext, 'operationType'>, options?: LoggerOptions): Logger {
  return createLogger({ ...context, operationType: OperationType.PERFORMANCE } as LogContext, options);
}