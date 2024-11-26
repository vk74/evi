/**
 * adminstate.js
 * Хранилище состояния для модуля администрирования.
 * Управляет состоянием активного подмодуля, режимом отображения бокового меню
 * и активной секцией в модуле управления сервисами.
 */
import { defineStore } from 'pinia';

export const useAdminStore = defineStore('admin', {
    state: () => ({
        activeSubModule: 'SubModuleServiceAdmin',
        drawerMode: 'auto', // Режимы: 'auto', 'opened', 'closed'
        previousModule: null, // Для хранения предыдущего модуля
        activeSection: 'active-services', // Активная секция в модуле управления сервисами
        previousSection: null, // Для хранения предыдущей секции
    }),

    getters: {
        /**
         * Получение текущей активной секции
         * @returns {string} ID активной секции
         */
        getCurrentSection: (state) => state.activeSection,
    },

    actions: {
        /**
         * Установка активного подмодуля с сохранением предыдущего состояния
         * @param {string} module - Имя модуля для активации
         */
        setActiveSubModule(module) {
            if (this.activeSubModule !== module) {
                this.previousModule = this.activeSubModule;
                this.activeSubModule = module;
            }
        },

        /**
         * Установка режима отображения бокового меню
         * @param {'auto' | 'opened' | 'closed'} mode - Новый режим отображения
         */
        setDrawerMode(mode) {
            if (['auto', 'opened', 'closed'].includes(mode)) {
                this.drawerMode = mode;
            } else {
                console.warn('Invalid drawer mode:', mode);
            }
        },

        /**
         * Возврат к предыдущему активному модулю
         */
        returnToPreviousModule() {
            if (this.previousModule) {
                this.activeSubModule = this.previousModule;
                this.previousModule = null;
            }
        },

        /**
         * Установка активной секции в модуле управления сервисами
         * @param {'active-services' | 'all-services'} sectionId - ID секции для активации
         */
        setActiveSection(sectionId) {
            if (this.activeSection !== sectionId) {
                this.previousSection = this.activeSection;
                this.activeSection = sectionId;
            }
        },

        /**
         * Возврат к предыдущей активной секции
         */
        returnToPreviousSection() {
            if (this.previousSection) {
                this.activeSection = this.previousSection;
                this.previousSection = null;
            }
        }
    },
});