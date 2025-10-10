/*
version: 1.2.0
Frontend file for product types in catalog module.
TypeScript interfaces for catalog products based on database structure.
File: types.products.ts
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
}

export interface CatalogProductDetails {
  id: string;
  name: string;
  product_code: string | null;
  status: ProductStatus;
  short_description: string | null;
  long_description: string | null;
  tech_specs: Record<string, any> | null;
  area_specifics: Record<string, any> | null;
  industry_specifics: Record<string, any> | null;
  key_features: Record<string, any> | null;
  product_overview: Record<string, any> | null;
  created_at: string;
  created_by: string;
  updated_at: string | null;
  updated_by: string | null;
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