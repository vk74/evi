/**
 * types.catalog.ts - frontend file
 * Type definitions for catalog functionality on FRONTEND.
 *
 * This module defines TypeScript types and interfaces for:
 * - API request/response interfaces
 * - Frontend data models
 * - Service interfaces
 * - Error handling types
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
 * Compatible with backend expectations
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
 * Service state interfaces
 */
export interface CatalogSectionsState {
    sections: CatalogSection[]
    loading: boolean
    error: string | null
    lastFetched: number | null
}

/**
 * Service function types
 */
export interface FetchSectionsOptions {
    forceRefresh?: boolean
    sectionId?: string
} 