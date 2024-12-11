/**
 * @file uiStateTypes.ts
 * 
 * Типы для хранилища состояния UI компонентов.
 * Используется совместно с uistate.js
 * 
 * Определяет интерфейсы для:
 * - Состояния snackbar компонента
 * - Параметров отображения уведомлений
 * - Методов работы с UI элементами
 */

import { SNACKBAR_DEFAULTS } from '@/components/ui/snackbars/constants'
import type { SnackbarTypeValue } from '@/components/ui/snackbars/types'

/** Состояние снекбара */
export interface SnackbarState {
  show: boolean;
  message: string;
  type: SnackbarTypeValue | '';
  timeout: typeof SNACKBAR_DEFAULTS.TIMEOUT;
  closable: typeof SNACKBAR_DEFAULTS.CLOSABLE;
  position: typeof SNACKBAR_DEFAULTS.POSITION;
}

/** Параметры для отображения снекбара */
export interface SnackbarOptions {
  message: string;
  type: SnackbarTypeValue;
  timeout?: number;
  closable?: boolean;
  position?: string;
}

/** Состояние UI хранилища */
export interface UiState {
  snackbar: SnackbarState;
}

/** Методы UI хранилища */
export interface UiActions {
  showSnackbar: (options: SnackbarOptions) => void;
  hideSnackbar: () => void;
  showSuccessSnackbar: (message: string, options?: Partial<Omit<SnackbarOptions, 'message' | 'type'>>) => void;
  showErrorSnackbar: (message: string, options?: Partial<Omit<SnackbarOptions, 'message' | 'type'>>) => void;
  showWarningSnackbar: (message: string, options?: Partial<Omit<SnackbarOptions, 'message' | 'type'>>) => void;
  showInfoSnackbar: (message: string, options?: Partial<Omit<SnackbarOptions, 'message' | 'type'>>) => void;
}