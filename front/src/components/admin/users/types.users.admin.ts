/**
 * types.users.admin.ts
 * Типы для модуля управления пользователями
 */

export type UserSectionId = 'users' | 'groups' | 'user-editor' | 'group-editor'

export interface UsersAdminState {
  activeSection: UserSectionId
}