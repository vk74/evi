/**
 * types.admin.regions.ts - version 1.0.0
 * Type definitions for regions administration module.
 * 
 * Contains TypeScript interfaces and types for regions admin functionality.
 * 
 * File: types.admin.regions.ts
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

// Create region request interface
export interface CreateRegionRequest {
    region_name: string
}

// Create region response interface
export interface CreateRegionResponse extends ApiResponse {
    data?: Region
}

// Update region request interface
export interface UpdateRegionRequest {
    region_id: number
    region_name: string
}

// Update region response interface
export interface UpdateRegionResponse extends ApiResponse {
    data?: Region
}

// Delete regions request interface
export interface DeleteRegionsRequest {
    region_ids: number[]
}

// Delete regions response interface
export interface DeleteRegionsResponse extends ApiResponse {
    data?: {
        deletedRegions: Array<{region_id: number, region_name: string}>
        errors: Array<{region_id: number, error: string}>
        totalRequested: number
        totalDeleted: number
        totalErrors: number
    }
}

