/*
version: 1.0.0
Frontend file for product types in catalog module.
TypeScript interfaces for catalog products.
File: types.products.ts
*/

export interface CatalogProduct {
  id: number;
  name: string;
  sku: string;
  category: string;
  subcategory: string;
  description: string;
  price: string;
  image: string;
  color: string;
} 