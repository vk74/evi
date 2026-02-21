/**
 * Version: 1.2.2
 * Description: Type definitions for about module components
 * Purpose: Defines interfaces and types for about module functionality
 * Type: Frontend file - types.about.ts
 *
 * Changes in v1.2.2:
 * - Added deployKit: ComponentSection to ComponentsData (Deployment kit block in About)
 *
 * Changes in v1.2.1:
 * - Renamed carrierLabel/carrierVersion to domainLabel/domainVersion in ComponentSection
 *
 * Changes in v1.2.0:
 * - Added ComponentSection (domainLabel, domainVersion, items) for section headers with version
 * - Replaced flat arrays in ComponentsData with ComponentSection; removed adminTools; added pgAdmin
 *
 * Changes in v1.1.0:
 * - Added ComponentItem interface for components with source URL
 * - Extended ComponentsData with hostOs, reverseProxy, adminTools sections
 */

// Component item with name and source URL for ModuleComponents
export interface ComponentItem {
  name: string;
  url: string;
}

// Section with domain label, optional version, and list of components (for About components block)
export interface ComponentSection {
  domainLabel: string;
  domainVersion: string;
  items: ComponentItem[];
}

// Session data interface for ModuleSessionData component
export interface SessionData {
  username: string;
  jwt: string;
  isLoggedIn: boolean;
  userID: string;
  issuedAt: string;
  issuer: string;
  expiresAt: string;
  timeUntilExpiry: number;
}

// About module navigation items
export interface AboutMenuItem {
  id: string;
  title: string;
  icon: string;
  route: string;
  description?: string;
}

// License data interface for ModuleLicense component
export interface LicenseData {
  title: string;
  message: string;
  isHidden: boolean;
}

// Developer info interface for ModuleDeveloperInfo component
export interface DeveloperInfoData {
  title: string;
  message: string;
  isHidden: boolean;
}

// Components info interface for ModuleComponents component
export interface ComponentsData {
  title: string;
  frontend: ComponentSection;
  backend: ComponentSection;
  database: ComponentSection;
  reverseProxy: ComponentSection;
  pgAdmin: ComponentSection;
  deployKit: ComponentSection;
  hostOs: ComponentSection;
}

// About module state interface
export interface AboutModuleState {
  sessionData: SessionData | null;
  licenseData: LicenseData | null;
  developerInfoData: DeveloperInfoData | null;
  componentsData: ComponentsData | null;
  isSessionDataVisible: boolean;
  isLicenseVisible: boolean;
  isDeveloperInfoVisible: boolean;
  isComponentsVisible: boolean;
  activeMenuItem: string | null;
}
