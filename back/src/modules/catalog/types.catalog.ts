/**
 * types.catalog.ts - backend file
 * Type definitions for catalog functionality on BACKEND.
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
    owner: string | null          // uuid
    backup_owner: string | null   // uuid
    description: string | null    // text
    comments: string | null       // text
    status: SectionStatus | null  // app.section_status
    is_public: boolean           // boolean
    order: number | null         // integer
    parent_id: string | null     // uuid
    icon_name: string | null     // character varying
    color: string | null         // character varying
    created_at: Date             // timestamp with time zone
    created_by: string           // uuid
    modified_at: Date | null     // timestamp with time zone
    modified_by: string | null   // uuid
}

/**
 * Frontend-compatible interface for catalog sections
 * Contains only fields needed for catalog display
 */
export interface CatalogSection {
    id: string
    name: string
    description: string | null
    icon_name: string | null
    color: string | null
    order: number | null
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