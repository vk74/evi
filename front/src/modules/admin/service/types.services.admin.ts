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

// Service interface
export interface Service {
  id: string
  name: string
  priority: ServicePriority
  status: ServiceStatus | null
  owner: string | null
  technical_owner: string | null
  is_public: boolean
  description_short: string | null
  purpose: string | null
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

// Create service request interface
export interface CreateServiceRequest {
  name: string
  priority: ServicePriority
  status?: ServiceStatus
  owner?: string
  technical_owner?: string
  is_public?: boolean
  description_short?: string
  purpose?: string
}

// Create service response interface
export interface CreateServiceResponse extends ApiResponse {
  data?: {
    id: string
    name: string
  }
}

// Update service request interface
export interface UpdateServiceRequest {
  name?: string
  priority?: ServicePriority
  status?: ServiceStatus
  owner?: string
  technical_owner?: string
  is_public?: boolean
  description_short?: string
  purpose?: string
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