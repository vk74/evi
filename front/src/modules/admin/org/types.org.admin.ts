/**
 * @file types.org.admin.ts
 * Version: 1.0.0
 * Type definitions for organization administration module.
 * Frontend file that defines TypeScript types and interfaces for organization admin functionality.
 */

export type UserSectionId = 'users-proto' | 'groups' | 'user-editor' | 'group-editor'

export interface OrgAdminState {
  activeSection: UserSectionId
}

export interface Section {
  id: UserSectionId
  title: string
  icon: string
  visible?: boolean
}