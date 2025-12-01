/**
 * types.admin.regions.ts - version 1.1.0
 * Type definitions for regions administration module.
 * 
 * Contains TypeScript interfaces and types for regions admin functionality.
 * 
 * File: types.admin.regions.ts
 * 
 * Changes in v1.1.0:
 * - Removed individual create/update/delete request/response types
 * - Added UpdateRegionsRequest and UpdateRegionsResponse for batch operations
 * - Unified update service now handles create, update, delete in one operation
 */

// Region interface - matches backend structure
export interface Region {
    region_id: number
    region_name: string
    created_at: Date
    updated_at: Date | null
}

// API Response interfaces
export interface ApiResponse {
    success: boolean
    message: string
}

export interface FetchRegionsResponse extends ApiResponse {
    data?: Region[]
}

// Request for updating regions (full table state)
// Handles create, update, delete operations in batch
export interface UpdateRegionsRequest {
    regions: Array<{
        region_id?: number // optional, negative for new regions
        region_name: string
        _delete?: boolean // flag for deletion
    }>
}

// Response for update regions
export interface UpdateRegionsResponse extends ApiResponse {
    data?: {
        totalRecords: number
    }
}

