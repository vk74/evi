/**
 * JSON транспорт для логгера
 */
import { LogMessage, LogTransport } from '../logger.types';

/**
 * Преобразует сообщение логгера в JSON формат
 * @param message Сообщение для форматирования
 * @returns Строка в формате JSON
 */
function formatJsonMessage(message: LogMessage): string {
  const { timestamp, level, code, message: text, source, details, error } = message;
  
  // Создаем базовый объект JSON
  const jsonLog: Record<string, any> = {
    timestamp,
    level,
    code,
    message: text
  };
  
  // Добавляем информацию об источнике
  const sourceObj: Record<string, any> = {
    module: source.module,
    operationType: source.operationType || 'unknown'
  };
  
  // Добавляем опциональные поля источника
  if (source.fileName) sourceObj.fileName = source.fileName;
  if (source.userId) sourceObj.userId = source.userId;
  
  // Добавляем другие поля из source
  Object.entries(source).forEach(([key, value]) => {
    if (!['module', 'fileName', 'operationType', 'userId'].includes(key) && value !== undefined) {
      sourceObj[key] = value;
    }
  });
  
  jsonLog.source = sourceObj;
  
  // Добавляем детали, если они есть
  if (details) {
    jsonLog.details = details;
  }
  
  // Добавляем информацию об ошибке, если она есть
  if (error) {
    jsonLog.error = {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }
  
  return JSON.stringify(jsonLog);
}

/**
 * JSON транспорт для логгера
 */
export const jsonTransport: LogTransport = {
  name: 'json',
  
  log(message: LogMessage): void {
    const jsonMessage = formatJsonMessage(message);
    console.log(jsonMessage);
  }
};