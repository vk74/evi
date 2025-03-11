/**
 * Консольный транспорт для логгера
 */
import { LogLevel, LogMessage, LogTransport, OperationType } from '../logger.types';
import { getLoggerConfig } from '../logger.config';

/**
 * Цвета для разных уровней логирования
 */
const LEVEL_COLORS = {
  [LogLevel.DEBUG]: '\x1b[34m', // Синий
  [LogLevel.INFO]: '\x1b[32m',  // Зеленый
  [LogLevel.WARN]: '\x1b[33m',  // Желтый
  [LogLevel.ERROR]: '\x1b[31m', // Красный
  [LogLevel.FATAL]: '\x1b[35m', // Пурпурный
  RESET: '\x1b[0m'              // Сброс цвета
};

/**
 * Префиксы для разных типов операций
 */
const OPERATION_TYPE_PREFIX = {
  [OperationType.APP]: '[APP]',
  [OperationType.SYSTEM]: '[SYS]',
  [OperationType.SECURITY]: '[SEC]',
  [OperationType.AUDIT]: '[AUDIT]',
  [OperationType.INTGRN]: '[INTGRN]',
  [OperationType.PERFORMANCE]: '[PERF]'
};

/**
 * Форматирует сообщение для вывода в консоль
 * @param message Сообщение для форматирования
 * @returns Отформатированная строка
 */
function formatConsoleMessage(message: LogMessage): string {
  const { timestamp, level, code, message: text, source, details, error } = message;
  const config = getLoggerConfig();
  
  // Формат времени
  const time = config.timestampFormat === 'ISO' 
    ? timestamp 
    : new Date(timestamp).toLocaleString();
  
  // Получаем префикс типа операции
  const operationType = source.operationType;
  const typePrefix = operationType ? `${OPERATION_TYPE_PREFIX[operationType]} ` : '';
  
  // Основная часть сообщения
  const levelColor = LEVEL_COLORS[level];
  const reset = LEVEL_COLORS.RESET;
  
  // Базовая строка сообщения с префиксом типа операции
  let result = `${time} ${typePrefix}${levelColor}[${level.toUpperCase()}]${reset} [${code}] ${text}`;
  
  // Добавляем информацию об источнике
  const sourceInfo = Object.entries(source)
    .filter(([key, value]) => value !== undefined && key !== 'operationType') // Исключаем operationType, так как он уже добавлен
    .map(([key, value]) => `${key}=${value}`)
    .join(' ');
  
  if (sourceInfo) {
    result += ` | ${sourceInfo}`;
  }
  
  // Добавляем детали, если они есть и разрешены настройками
  if (details && (config.environment !== 'production' || config.showDetailsInProduction)) {
    result += ` | details: ${JSON.stringify(details)}`;
  }
  
  // Добавляем информацию об ошибке, если она есть
  if (error) {
    result += `\n${levelColor}Error:${reset} ${error.name}: ${error.message}`;
    
    if (error.stack && (config.environment !== 'production' || config.showDetailsInProduction)) {
      result += `\n${error.stack}`;
    }
  }
  
  return result;
}

/**
 * Консольный транспорт для логгера
 */
export const consoleTransport: LogTransport = {
  name: 'console',
  
  log(message: LogMessage): void {
    const formattedMessage = formatConsoleMessage(message);
    
    // Выбираем соответствующий метод консоли в зависимости от уровня
    switch (message.level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(formattedMessage);
        break;
      default:
        console.log(formattedMessage);
    }
  }
};