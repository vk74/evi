/**
 * types.catalog.ts - backend file
 * version: 1.1.1
 * Type definitions for catalog functionality on BACKEND.
 * 
 * Changes in v1.1.1:
 * - Added published_at field to DbProductDetails interface
 * - Added published_at field to CatalogProductDetailsDTO interface
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
 * Catalog metadata for UI configuration
 * Contains dynamic settings like card colors
 */
export interface CatalogMetadata {
    serviceCardColor: string;
    productCardColor: string;
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

/**
 * Service enums (match DB enum labels)
 */
export enum ServicePriority {
    CRITICAL = 'critical',
    HIGH = 'high',
    MEDIUM = 'medium',
    LOW = 'low',
}

export enum ServiceStatus {
    IN_PRODUCTION = 'in_production',
}

/**
 * Database interface for services (join with owner username)
 */
export interface DbService {
    id: string;
    name: string;
    priority: ServicePriority;
    status: ServiceStatus; // constrained to in_production in query
    description_short: string | null;
    icon_name: string | null;
    owner: string | null; // username
}

/**
 * Frontend-compatible DTO for catalog services (backend side)
 */
export interface CatalogServiceDTO {
    id: string;
    name: string;
    description: string | null;
    priority: ServicePriority;
    status: ServiceStatus;
    owner: string | null;
    icon: string | null;
}

export interface FetchServicesResponse extends ApiResponse {
    data: CatalogServiceDTO[];
    metadata?: CatalogMetadata;
}

/**
 * Database interface for single service details
 */
export interface DbServiceDetails {
    id: string;
    name: string;
    priority: ServicePriority;
    status: ServiceStatus; // constrained to in_production in query
    description_long: string | null;
    purpose: string | null;
    icon_name: string | null;
    created_at: string;
    owner: string | null;
    backup_owner: string | null;
    technical_owner: string | null;
    backup_technical_owner: string | null;
    dispatcher: string | null;
    support_tier1: string | null;
    support_tier2: string | null;
    support_tier3: string | null;
    show_owner: boolean | null;
    show_backup_owner: boolean | null;
    show_technical_owner: boolean | null;
    show_backup_technical_owner: boolean | null;
    show_dispatcher: boolean | null;
    show_support_tier1: boolean | null;
    show_support_tier2: boolean | null;
    show_support_tier3: boolean | null;
}

/**
 * Frontend-compatible DTO for single service details (backend side)
 */
export interface CatalogServiceDetailsDTO {
    id: string;
    name: string;
    priority: ServicePriority;
    status: ServiceStatus;
    description_long: string | null;
    purpose: string | null;
    icon: string | null;
    created_at: string;
    owner: string | null;
    backup_owner: string | null;
    technical_owner: string | null;
    backup_technical_owner: string | null;
    dispatcher: string | null;
    support_tier1: string | null;
    support_tier2: string | null;
    support_tier3: string | null;
    show_owner: boolean | null;
    show_backup_owner: boolean | null;
    show_technical_owner: boolean | null;
    show_backup_technical_owner: boolean | null;
    show_dispatcher: boolean | null;
    show_support_tier1: boolean | null;
    show_support_tier2: boolean | null;
    show_support_tier3: boolean | null;
}

export interface FetchServiceDetailsResponse extends ApiResponse {
    data: CatalogServiceDetailsDTO | null;
}

/**
 * Product enums (match DB enum labels)
 */
export enum ProductStatus {
    PUBLISHED = 'published',
    DRAFT = 'draft',
    ARCHIVED = 'archived',
}

/**
 * Database interface for products (join with translations)
 */
export interface DbProduct {
    product_id: string;
    product_code: string | null;
    translation_key: string;
    is_published: boolean;
    name: string;
    short_desc: string | null;
    long_desc: string | null;
    tech_specs: Record<string, any> | null;
    created_at: string;
    created_by: string;
    published_at: string | null;
}

/**
 * Frontend-compatible DTO for catalog products (backend side)
 */
export interface CatalogProductDTO {
    id: string;
    name: string;
    description: string | null;
    product_code: string | null;
    status: ProductStatus;
    created_at: string;
    created_by: string;
    published_at: string | null;
}

/**
 * Database interface for single product details
 */
export interface DbProductDetails {
    product_id: string;
    product_code: string | null;
    translation_key: string;
    is_published: boolean;
    name: string;
    short_desc: string | null;
    long_desc: string | null;
    tech_specs: Record<string, any> | null;
    created_at: string;
    created_by: string;
    updated_at: string | null;
    updated_by: string | null;
    published_at: string | null;
}

/**
 * Frontend-compatible DTO for single product details (backend side)
 */
export interface CatalogProductDetailsDTO {
    id: string;
    name: string;
    product_code: string | null;
    status: ProductStatus;
    short_description: string | null;
    long_description: string | null;
    tech_specs: Record<string, any> | null;
    created_at: string;
    created_by: string;
    updated_at: string | null;
    updated_by: string | null;
    published_at: string | null;
}

export interface FetchProductsResponse extends ApiResponse {
    data: CatalogProductDTO[];
    metadata?: CatalogMetadata;
}

export interface FetchProductDetailsResponse extends ApiResponse {
    data: CatalogProductDetailsDTO | null;
}

/**
 * Product options DTOs for catalog product card
 */
export interface CatalogProductOptionDTO {
    option_product_id: string;
    option_name: string;
    product_code: string | null;
    is_published: boolean;
    is_required: boolean;
    units_count: number | null;
    unit_price?: number | null;
}

export interface ReadProductOptionsRequestDTO {
    productId: string;
    locale: string; // must be provided by frontend
}

export interface ReadProductOptionsResponseDTO extends ApiResponse {
    data: CatalogProductOptionDTO[];
}