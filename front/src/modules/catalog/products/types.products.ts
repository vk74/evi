/*
version: 1.4.0
Frontend file for product types in catalog module.
TypeScript interfaces for catalog products based on database structure.
File: types.products.ts

Changes in v1.2.3:
- Added published_at field to CatalogProduct interface

Changes in v1.2.4:
- Added published_at field to CatalogProductDetails interface

Changes in v1.3.0:
- Extended ProductPriceInfo with roundingPrecision metadata

Changes in v1.4.0:
- Removed JSONB fields (area_specifics, industry_specifics, key_features, product_overview) from CatalogProductDetails interface

Changes in v1.5.0:
- Added region parameter to FetchActiveProductsOptions for region-based product filtering
*/

export type ProductStatus = 'published' | 'draft' | 'archived'

export interface CatalogMetadata {
  serviceCardColor: string;
  productCardColor: string;
}

export interface CatalogProduct {
  id: string;
  name: string;
  description: string | null;
  product_code: string | null;
  status: ProductStatus;
  created_at: string;
  created_by: string;
  published_at: string | null;
}

export interface FetchActiveProductsResponse {
  success: boolean;
  message: string;
  data: CatalogProduct[];
  metadata?: CatalogMetadata;
}

export interface FetchActiveProductsOptions {
  forceRefresh?: boolean;
  sectionId?: string;
  region?: string;
}

export interface CatalogProductDetails {
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

export interface FetchProductDetailsResponse {
  success: boolean;
  message: string;
  data: CatalogProductDetails | null;
}

export interface FetchProductDetailsOptions {
  forceRefresh?: boolean;
} 

// UI type for product options in product card
export interface CatalogProductOption {
  product_id: string;
  option_name: string;
  product_code: string | null;
  is_published: boolean;
  is_required: boolean;
  units_count: number | null;
  unit_price?: number | null;
}

export interface FetchProductOptionsResponse {
  success: boolean;
  message: string;
  data: Array<{
    option_product_id: string;
    option_name: string;
    product_code: string | null;
    is_published: boolean;
    is_required: boolean;
    units_count: number | null;
    unit_price?: number | null;
  }>;
}

// Price information for products
export interface ProductPriceInfo {
  price: number;
  currencySymbol: string;
  roundingPrecision: number | null;
}