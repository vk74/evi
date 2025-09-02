/**
 * @file types.services.admin.ts
 * Version: 1.0.0
 * Type definitions for services administration module.
 * Frontend file that defines TypeScript types and interfaces for services admin functionality.
 */

// Service priority enum
export enum ServicePriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

// Service status enum
export enum ServiceStatus {
  DRAFTED = 'drafted',
  BEING_DEVELOPED = 'being_developed',
  BEING_TESTED = 'being_tested',
  NON_COMPLIANT = 'non_compliant',
  PENDING_APPROVAL = 'pending_approval',
  IN_PRODUCTION = 'in_production',
  UNDER_MAINTENANCE = 'under_maintenance',
  SUSPENDED = 'suspended',
  BEING_UPGRADED = 'being_upgraded',
  DISCONTINUED = 'discontinued'
}

// Service user roles enum
export enum ServiceUserRole {
  OWNER = 'owner',
  BACKUP_OWNER = 'backup_owner',
  TECHNICAL_OWNER = 'technical_owner',
  BACKUP_TECHNICAL_OWNER = 'backup_technical_owner',
  DISPATCHER = 'dispatcher',
  ACCESS_DENIED = 'access_denied'
}

// Service group roles enum
export enum ServiceGroupRole {
  SUPPORT_TIER1 = 'support_tier1',
  SUPPORT_TIER2 = 'support_tier2',
  SUPPORT_TIER3 = 'support_tier3',
  ACCESS_ALLOWED = 'access_allowed',
  ACCESS_DENIED = 'access_denied'
}

// Service interface - полная версия для редактора и списка
export interface Service {
  id: string
  name: string
  icon_name: string | null
  support_tier1: string | null
  support_tier2: string | null
  support_tier3: string | null
  owner: string | null
  backup_owner: string | null
  technical_owner: string | null
  backup_technical_owner: string | null
  dispatcher: string | null
  priority: ServicePriority
  status: ServiceStatus | null
  description_short: string | null
  description_long: string | null
  purpose: string | null
  comments: string | null
  is_public: boolean
  access_allowed_groups: string | null
  access_denied_groups: string | null
  access_denied_users: string | null
  // Visibility preferences for service card roles - опциональные для обратной совместимости
  show_owner?: boolean
  show_backup_owner?: boolean
  show_technical_owner?: boolean
  show_backup_technical_owner?: boolean
  show_dispatcher?: boolean
  show_support_tier1?: boolean
  show_support_tier2?: boolean
  show_support_tier3?: boolean
  created_at: Date
  created_by: string
  modified_at: Date | null
  modified_by: string | null
}

// API Response interfaces
export interface ApiResponse {
  success: boolean
  message: string
}

export interface FetchServicesResponse extends ApiResponse {
  data: Service[]
}

// Error handling interfaces
export interface ApiError {
  message: string
  code?: string
  details?: Record<string, unknown>
}

export interface ServiceError {
  code?: string
  message: string
  details?: unknown
}

// Error handling interfaces
export interface ApiError {
  message: string
  code?: string
  details?: Record<string, unknown>
}

export interface ServiceError {
  code?: string
  message: string
  details?: unknown
}

// Create service request interface
export interface CreateServiceRequest {
  name: string
  icon_name?: string
  support_tier1?: string
  support_tier2?: string
  support_tier3?: string
  owner?: string
  backup_owner?: string
  technical_owner?: string
  backup_technical_owner?: string
  dispatcher?: string
  priority: ServicePriority
  status?: ServiceStatus
  description_short?: string
  description_long?: string
  purpose?: string
  comments?: string
  is_public?: boolean
  access_allowed_groups?: string | string[]
  access_denied_groups?: string | string[]
  access_denied_users?: string | string[]
  // Visibility preferences for service card roles
  show_owner?: boolean
  show_backup_owner?: boolean
  show_technical_owner?: boolean
  show_backup_technical_owner?: boolean
  show_dispatcher?: boolean
  show_support_tier1?: boolean
  show_support_tier2?: boolean
  show_support_tier3?: boolean
}

// Create service response interface
export interface CreateServiceResponse extends ApiResponse {
  data?: {
    id: string
    name: string
  }
}

// Update service interface
export interface UpdateService {
  name?: string
  icon_name?: string
  support_tier1?: string
  support_tier2?: string
  support_tier3?: string
  owner?: string
  backup_owner?: string
  technical_owner?: string
  backup_technical_owner?: string
  dispatcher?: string
  priority?: ServicePriority
  status?: ServiceStatus
  description_short?: string
  description_long?: string
  purpose?: string
  comments?: string
  is_public?: boolean
  access_allowed_groups?: string
  access_denied_groups?: string
  access_denied_users?: string
  // Visibility preferences for service card roles
  show_owner?: boolean
  show_backup_owner?: boolean
  show_technical_owner?: boolean
  show_backup_technical_owner?: boolean
  show_dispatcher?: boolean
  show_support_tier1?: boolean
  show_support_tier2?: boolean
  show_support_tier3?: boolean
}

// Update service response interface
export interface UpdateServiceResponse extends ApiResponse {
  data?: {
    id: string
    name: string
  }
}

// Delete service request interface
export interface DeleteServiceRequest {
  ids: string[]
}

// Delete service response interface
export interface DeleteServiceResponse extends ApiResponse {
  data?: {
    deleted: Array<{
      id: string
      name: string
    }>
    failed: Array<{
      id: string
      name?: string
      error: string
      code: string
    }>
    totalRequested: number
    totalDeleted: number
    totalFailed: number
  }
}

// Navigation section interface
export interface Section {
  id: string
  name: string
  icon: string
  children?: Section[]
}

// Publishing section interface
export interface PublishingSection {
  id: string
  name: string
  owner: string | null
  status: string | null
  is_public: boolean
  selected?: boolean
}

// Fetch publishing sections response interface
export interface FetchPublishingSectionsResponse extends ApiResponse {
  data: PublishingSection[]
} 