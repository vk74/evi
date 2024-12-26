/**
 * uitate.js
 * Store для управления ...
 */
import { defineStore } from 'pinia';
import { SNACKBAR_DEFAULTS } from '../ui/snackbars/constants';
import { SnackbarType } from '../ui/snackbars/types';

export const useUiStore = defineStore('ui', {
  state: () => ({
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
    showSnackbar({ message, type, timeout, closable, position }) {
      // Сначала скрываем snackbar
      this.snackbar.show = false;
      
      // Используем setTimeout, чтобы дать Vue время обработать изменение show
      setTimeout(() => {
        this.snackbar = {
          show: true,
          message,
          type,
          timeout: timeout || SNACKBAR_DEFAULTS.TIMEOUT,
          closable: closable ?? SNACKBAR_DEFAULTS.CLOSABLE,
          position: position || SNACKBAR_DEFAULTS.POSITION
        };
      }, 100); // Небольшая задержка для гарантированного повторного показа
    },

    // Закрытие snackbar
    hideSnackbar() {
      this.snackbar.show = false;
    },

    // Удобные методы для разных типов уведомлений
    showSuccessSnackbar(message, options = {}) {
      this.showSnackbar({
        message,
        type: SnackbarType.SUCCESS,
        ...options
      });
    },

    showErrorSnackbar(message, options = {}) {
      this.showSnackbar({
        message,
        type: SnackbarType.ERROR,
        ...options
      });
    },

    showWarningSnackbar(message, options = {}) {
      this.showSnackbar({
        message,
        type: SnackbarType.WARNING,
        ...options
      });
    },

    showInfoSnackbar(message, options = {}) {
      this.showSnackbar({
        message,
        type: SnackbarType.INFO,
        ...options
      });
    }
  }
});