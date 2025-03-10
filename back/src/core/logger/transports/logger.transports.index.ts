/**
 * Экспортирует все доступные транспорты для логгера
 */
import { LogTransport } from '../logger.types';
import { consoleTransport } from './logger.console';

/**
 * Словарь всех доступных транспортов
 */
export const transports: Record<string, LogTransport> = {
  console: consoleTransport
};

/**
 * Получение транспорта по имени
 * @param name Имя транспорта
 * @returns Транспорт или undefined, если транспорт не найден
 */
export function getTransport(name: string): LogTransport | undefined {
  return transports[name];
}

/**
 * Получение всех активных транспортов на основе конфигурации
 * @param enabledTransports Массив имен активных транспортов
 * @returns Массив активных транспортов
 */
export function getActiveTransports(enabledTransports: string[]): LogTransport[] {
  return enabledTransports
    .map(name => getTransport(name))
    .filter((transport): transport is LogTransport => transport !== undefined);
}