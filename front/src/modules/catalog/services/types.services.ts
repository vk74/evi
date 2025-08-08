/*
version: 1.1.0
Frontend file for service types in catalog module.
TypeScript interfaces for catalog services.
File: types.services.ts
*/

export interface CatalogService {
  id: string;
  name: string;
  description: string | null;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'in_production';
  owner: string | null;
  icon: string | null;
} 

export interface FetchActiveServicesResponse {
  success: boolean;
  message: string;
  data: CatalogService[];
}

export interface FetchActiveServicesOptions {
  forceRefresh?: boolean;
}