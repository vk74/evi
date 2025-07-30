/**
 * types.catalog.sections.ts - backend file
 * Type definitions for catalog sections functionality on BACKEND.
 *
 * This module defines TypeScript types and interfaces for:
 * - Database models and operations
 * - API request/response interfaces
 * - Shared enums and types
 * - Validation and error handling
 */

/**
 * Section status enum
 */
export enum SectionStatus {
    DRAFT = 'draft',
    ACTIVE = 'active',
    ARCHIVED = 'archived',
    DISABLED = 'disabled',
    SUSPENDED = 'suspended'
}

/**
 * Database interface for catalog sections
 * Representing the actual structure in PostgreSQL table app.catalog_sections
 */
export interface DbCatalogSection {
    id: string                    // uuid PRIMARY KEY
    name: string                  // character varying
    owner: string | null          // uuid (will be replaced with username)
    backup_owner: string | null   // uuid (will be replaced with username)
    description: string | null    // text
    comments: string | null       // text
    status: SectionStatus | null  // app.section_status
    is_public: boolean           // boolean
    order: number | null         // integer
    parent_id: string | null     // uuid
    icon: string | null          // character varying
    color: string | null         // character varying
    created_at: Date             // timestamp with time zone
    created_by: string           // uuid (will be replaced with username)
    modified_at: Date | null     // timestamp with time zone
    modified_by: string | null   // uuid (will be replaced with username)
}

/**
 * Frontend-compatible interface with resolved usernames/groupnames
 */
export interface CatalogSection {
    id: string
    name: string
    owner: string | null          // username instead of UUID
    backup_owner: string | null   // username instead of UUID
    description: string | null
    comments: string | null
    status: SectionStatus | null
    is_public: boolean
    order: number | null
    parent_id: string | null
    icon: string | null
    color: string | null
    created_at: Date
    created_by: string            // username instead of UUID
    modified_at: Date | null
    modified_by: string | null    // username instead of UUID
}

/**
 * API Response interfaces
 * Compatible with frontend expectations
 */
export interface ApiResponse {
    success: boolean
    message: string
}

export interface FetchSectionsResponse extends ApiResponse {
    data: CatalogSection[]
}

/**
 * Create section request interface
 */
export interface CreateSectionRequest {
    name: string
    owner: string
    order: number
    description?: string
    comments?: string
    backup_owner?: string
    parent_id?: string
    color?: string
}

/**
 * Create section response interface
 */
export interface CreateSectionResponse extends ApiResponse {
    data?: {
        id: string
        name: string
    }
}

/**
 * Error handling interfaces
 */
export interface ApiError {
    message: string
    code?: string
    details?: Record<string, unknown>
}

export interface ServiceError {
    code?: string;
    message: string;
    details?: unknown;
}

/**
 * Validation interfaces
 */
export interface ValidationError extends ServiceError {
    code: 'VALIDATION_ERROR' | 'REQUIRED_FIELD_ERROR' | string
    field?: string
}

export interface RequiredFieldError extends ValidationError {
    code: 'REQUIRED_FIELD_ERROR'
    field: string
} 