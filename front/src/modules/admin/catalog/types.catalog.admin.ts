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
  icon_name: string | null
  color: string | null
  created_at: Date
  created_by: string
  modified_at: Date | null
  modified_by: string | null
}

// Create section request interface
export interface CreateSectionRequest {
  name: string
  owner: string
  order: number
  description?: string
  comments?: string
  backup_owner?: string
  parent_id?: string
  color?: string
  is_public?: boolean
  icon_name?: string
}

// Create section response interface
export interface CreateSectionResponse extends ApiResponse {
  data?: {
    id: string
    name: string
  }
}

// Update section request interface
export interface UpdateSectionRequest {
  name?: string
  owner?: string
  order?: number
  description?: string
  comments?: string
  backup_owner?: string
  parent_id?: string
  color?: string
  status?: SectionStatus
  is_public?: boolean
  icon_name?: string
}

// Update section response interface
export interface UpdateSectionResponse extends ApiResponse {
  data?: {
    id: string
    name: string
  }
}

// Delete section request interface
export interface DeleteSectionRequest {
    ids: string[]
}

// Delete section response interface
export interface DeleteSectionResponse extends ApiResponse {
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
