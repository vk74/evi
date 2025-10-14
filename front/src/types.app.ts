/**
 * @file types.app.ts
 * Version: 1.1.0
 * Type definitions for the application
 */

// Module names
export type ModuleName = 
  | 'Login'
  | 'Catalog'
  | 'Work'
  | 'AR'
  | 'Admin'
  | 'XLS'
  | 'Account'
  | 'Settings'
  | 'SessionData'
  | 'License'
  | 'DeveloperInfo'
  | 'Components'
  | 'KnowledgeBase'
  | 'NewUserRegistration';

// Drawer modes
export type DrawerMode = 'opened' | 'closed';

// Admin sub-modules
export type AdminSubModule = 
  | 'catalogAdmin'
  | 'serviceAdmin'
  | 'orgAdmin'
  | 'appAdmin'
  | 'productsAdmin'
  | 'pricingAdmin';

// Work module visibility setting interface
export interface WorkModuleVisibility {
  setting_name: string;
  value: boolean;
  section_path: string;
}

// Reports module visibility setting interface
export interface ReportsModuleVisibility {
  setting_name: string;
  value: boolean;
  section_path: string;
}

// KnowledgeBase module visibility setting interface
export interface KnowledgeBaseModuleVisibility {
  setting_name: string;
  value: boolean;
  section_path: string;
} 