/**
 * types.app.admin.ts
 * Типы для модуля управления настройками приложения
 */

/**
 * Идентификаторы доступных секций в модуле настроек приложения
 */
export type AppSectionId = 'settings' | 'visualization'

/**
 * Интерфейс состояния хранилища модуля настроек приложения
 */
export interface AppAdminState {
  activeSection: AppSectionId
}

/**
 * Интерфейс секции навигации
 */
export interface Section {
  id: AppSectionId
  title: string
  icon: string
}