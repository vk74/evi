/*
version: 1.2.0
Frontend file for service types in catalog module.
TypeScript interfaces for catalog services and service details.
File: types.services.ts
*/

export type ServicePriority = 'critical' | 'high' | 'medium' | 'low'
export type ServiceStatus = 'in_production'

export interface CatalogService {
  id: string;
  name: string;
  description: string | null;
  priority: ServicePriority;
  status: ServiceStatus;
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

export interface CatalogServiceDetails {
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

export interface FetchServiceDetailsResponse {
  success: boolean;
  message: string;
  data: CatalogServiceDetails | null;
}

export interface FetchServiceDetailsOptions {
  forceRefresh?: boolean;
}