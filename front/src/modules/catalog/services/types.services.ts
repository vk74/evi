/*
version: 1.0.0
Frontend file for service types in catalog module.
TypeScript interfaces for catalog services.
File: types.services.ts
*/

export interface CatalogService {
  id: number;
  name: string;
  description: string;
  priority: string;
  status: string;
  owner: string;
  category: string;
  icon: string;
  color: string;
} 