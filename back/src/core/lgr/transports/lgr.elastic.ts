/**
 * Elasticsearch транспорт для логгера
 */
import { LogMessage, LogTransport } from '../lgr.types';
import { getLgrConfig } from '../lgr.config';

/**
 * Преобразует сообщение логгера в формат ECS (Elastic Common Schema)
 * @param message Сообщение для форматирования
 * @returns Объект в формате ECS
 */
function formatElasticMessage(message: LogMessage): Record<string, any> {
  const { timestamp, level, code, message: text, source, details, error } = message;
  const config = getLgrConfig();
  
  // Создаем базовую структуру объекта
  const ecsLog: Record<string, any> = {
    "@timestamp": timestamp,
    "log.level": level,
    "event.module": source.module,
    "event.code": code,
    "event.type": source.operationType || "app",
    "message": text,
    "app.name": config.appName,
    "app.environment": config.environment
  };
  
  // Добавляем поля источника
  if (source.userId) ecsLog["user.id"] = source.userId;
  if (source.fileName) ecsLog["file.name"] = source.fileName;
  
  // Добавляем остальные поля из source в labels
  const labels: Record<string, any> = {};
  Object.entries(source).forEach(([key, value]) => {
    if (!['module', 'fileName', 'operationType', 'userId'].includes(key) && value !== undefined) {
      labels[key] = value;
    }
  });
  
  if (Object.keys(labels).length > 0) {
    ecsLog["labels"] = labels;
  }
  
  // Добавляем детали, если они есть
  if (details) {
    ecsLog["event.details"] = details;
  }
  
  // Добавляем информацию об ошибке, если она есть
  if (error) {
    ecsLog["error"] = {
      "message": error.message,
      "type": error.name,
      "stack_trace": error.stack
    };
  }
  
  return ecsLog;
}

/**
 * Отправка лога в Elasticsearch
 * @param logData Данные для отправки
 */
async function sendToElastic(logData: Record<string, any>): Promise<void> {
  const config = getLgrConfig();
  
  if (!config.siem.endpoint) {
    console.error('Elasticsearch endpoint not configured');
    return;
  }
  
  try {
    // В реальном приложении здесь был бы код отправки данных в Elasticsearch
    // Для демонстрации просто выводим в консоль
    console.log('Sending to Elasticsearch:', JSON.stringify(logData));
  } catch (error) {
    console.error('Failed to send log to Elasticsearch:', error);
  }
}

/**
 * Elasticsearch транспорт для логгера
 */
export const elasticTransport: LogTransport = {
  name: 'elastic',
  
  log(message: LogMessage): void {
    const elasticMessage = formatElasticMessage(message);
    sendToElastic(elasticMessage).catch(err => {
      console.error('Error sending log to Elasticsearch:', err);
    });
  }
};