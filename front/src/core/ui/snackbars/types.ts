/**
 * @file types.ts
 * 
 * Определение типов для компонента уведомлений (снекбар).
 * Включает типы уведомлений и структуру сообщений.
 * 
 * Используется в:
 * - компоненте AppSnackbar.vue
 * - хранилище uistate.js
 * - других компонентах для отображения уведомлений
 */

/** Доступные типы уведомлений */
export const SnackbarType = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
} as const

/** Тип для строковых значений типов уведомлений */
export type SnackbarTypeValue = 'success' | 'error' | 'warning' | 'info';

/**
 * Структура сообщения уведомления
 */
export interface SnackbarMessage {
  /** Тип уведомления */
  type: SnackbarTypeValue;
  /** Текст уведомления */
  message: string;
  /** Время показа в миллисекундах */
  timeout?: number;
  /** Можно ли закрыть вручную */
  closable?: boolean;
  /** Позиция на экране */
  position?: string;
}