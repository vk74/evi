export type ServiceSectionId = 'active-services' | 'all-services' | 'editor';

export interface ServiceSection {
  id: ServiceSectionId;
  title: string;
  icon: string;
}

export interface ServiceAdminState {
  activeSection: ServiceSectionId;
}