export interface Section {
  id: string
  name: string
  icon: string
  children?: Section[]
}

export type CatalogSectionId = string

// API Response interfaces
export interface ApiResponse {
  success: boolean
  message: string
}

export interface FetchSectionsResponse extends ApiResponse {
  data: CatalogSection[]
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

// Section status enum
export enum SectionStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  DISABLED = 'disabled',
  SUSPENDED = 'suspended'
}

// Frontend-compatible interface for catalog sections
export interface CatalogSection {
  id: string
  name: string
  owner: string | null
  backup_owner: string | null
  description: string | null
  comments: string | null
  status: SectionStatus | null
  is_public: boolean
  order: number | null
  parent_id: string | null
  icon: string | null
  color: string | null
  created_at: Date
  created_by: string
  modified_at: Date | null
  modified_by: string | null
}
