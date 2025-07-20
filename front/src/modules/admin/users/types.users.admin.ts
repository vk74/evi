/**
 * @file types.users.admin.ts
 * Version: 1.0.0
 * Type definitions for user administration module.
 * Frontend file that defines TypeScript types and interfaces for user admin functionality.
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