/**
 * uistate.ts
 * Store для управления UI состоянием приложения
 */
import { defineStore } from 'pinia';
import { SNACKBAR_DEFAULTS } from '../ui/snackbars/constants';
import { SnackbarType } from '../ui/snackbars/types';

interface SnackbarState {
  show: boolean;
  message: string;
  type: string;
  timeout: number;
  closable: boolean;
  position: string;
}

interface SnackbarOptions {
  message: string;
  type: typeof SnackbarType[keyof typeof SnackbarType];
  timeout?: number;
  closable?: boolean;
  position?: string;
}

interface UiState {
  snackbar: SnackbarState;
}

export const useUiStore = defineStore('ui', {
  state: (): UiState => ({
    snackbar: {
      show: false,           // флаг отображения
      message: '',           // текст сообщения
      type: '',             // тип уведомления
      timeout: SNACKBAR_DEFAULTS.TIMEOUT,  // время показа
      closable: SNACKBAR_DEFAULTS.CLOSABLE, // можно ли закрыть
      position: SNACKBAR_DEFAULTS.POSITION  // позиция
    }
  }),

  actions: {
    showSnackbar(options: SnackbarOptions): void {
      // Сначала скрываем snackbar
      this.snackbar.show = false;
      
      // Используем setTimeout, чтобы дать Vue время обработать изменение show
      setTimeout(() => {
        this.snackbar = {
          show: true,
          message: options.message,
          type: options.type,
          timeout: options.timeout || SNACKBAR_DEFAULTS.TIMEOUT,
          closable: options.closable ?? SNACKBAR_DEFAULTS.CLOSABLE,
          position: options.position || SNACKBAR_DEFAULTS.POSITION
        };
      }, 100); // Небольшая задержка для гарантированного повторного показа
    },

    // Закрытие snackbar
    hideSnackbar(): void {
      this.snackbar.show = false;
    },

    // Удобные методы для разных типов уведомлений
    showSuccessSnackbar(message: string, options: Partial<SnackbarOptions> = {}): void {
      this.showSnackbar({
        message,
        type: SnackbarType.SUCCESS,
        ...options
      });
    },

    showErrorSnackbar(message: string, options: Partial<SnackbarOptions> = {}): void {
      this.showSnackbar({
        message,
        type: SnackbarType.ERROR,
        ...options
      });
    },

    showWarningSnackbar(message: string, options: Partial<SnackbarOptions> = {}): void {
      this.showSnackbar({
        message,
        type: SnackbarType.WARNING,
        ...options
      });
    },

    showInfoSnackbar(message: string, options: Partial<SnackbarOptions> = {}): void {
      this.showSnackbar({
        message,
        type: SnackbarType.INFO,
        ...options
      });
    }
  }
}); 