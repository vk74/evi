/**
 * types.users.admin.ts
 * Типы для модуля управления пользователями
 */

export type UserSectionId = 'users-proto' | 'groups' | 'user-editor' | 'group-editor'

export interface UsersAdminState {
  activeSection: UserSectionId
}

export interface Section {
  id: UserSectionId
  title: string
  icon: string
  visible?: boolean
}