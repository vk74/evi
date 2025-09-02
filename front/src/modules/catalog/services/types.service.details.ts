/*
version: 1.0.1
Frontend file for service details types in catalog module.
Defines TypeScript interfaces for service details view.
File: types.service.details.ts
*/

export type ServicePriority = 'critical' | 'high' | 'medium' | 'low'
export type ServiceStatus = 'in_production'

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


