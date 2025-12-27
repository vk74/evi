/**
 * @file types.app.ts
 * Version: 1.2.0
 * Type definitions for the application
 * 
 * Changes in v1.2.0:
 * - Added 'About' module to ModuleName type
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
  | 'About'
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