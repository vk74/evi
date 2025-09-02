import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Service, PublishingSection } from './types.services.admin'
import { ServiceStatus, ServicePriority } from './types.services.admin'

export const useServicesAdminStore = defineStore('servicesAdmin', () => {
  // State
  const selectedSectionPath = ref('services.serviceslist')
  const activeComponent = ref('services.serviceslist')
  const expandedSections = ref<string[]>(['services'])
  
  // Editor state
  const editorMode = ref<'creation' | 'edit'>('creation')
  const editingServiceId = ref<string | null>(null)
  const editingServiceData = ref<Service | null>(null)
  const activeSection = ref<'details' | 'preferences' | 'catalog publication'>('details')
  
  // Form data state for synchronization between sections
  const formData = ref({
    // Basic service data
    name: '',
    iconName: '',
    supportTier1: '',
    supportTier2: '',
    supportTier3: '',
    owner: '',
    backupOwner: '',
    technicalOwner: '',
    backupTechnicalOwner: '',
    dispatcher: '',
    priority: ServicePriority.LOW,
    status: ServiceStatus.DRAFTED,
    descriptionShort: '',
    descriptionLong: '',
    purpose: '',
    comments: '',
    isPublic: false,
    accessAllowedGroups: [] as string[],
    accessDeniedGroups: [] as string[],
    accessDeniedUsers: [] as string[],
    // Visibility preferences for service card roles
    showOwner: false,
    showBackupOwner: false,
    showTechnicalOwner: false,
    showBackupTechnicalOwner: false,
    showDispatcher: false,
    showSupportTier1: false,
    showSupportTier2: false,
    showSupportTier3: false
  })
  
  // Publishing sections state
  const publishingSections = ref<PublishingSection[]>([])
  const isPublishingSectionsLoading = ref(false)
  const publishingSectionsError = ref<string | null>(null)

  // Getters
  const getSelectedSectionPath = computed(() => selectedSectionPath.value)
  const getActiveComponent = computed(() => activeComponent.value)
  const getExpandedSections = computed(() => expandedSections.value)
  const getEditorMode = computed(() => editorMode.value)
  const getEditingServiceId = computed(() => editingServiceId.value)
  const getEditingServiceData = computed(() => editingServiceData.value)
  const getActiveSection = computed(() => activeSection.value)
  const getFormData = computed(() => formData.value)
  
  // Publishing sections getters
  const getPublishingSections = computed(() => publishingSections.value)
  const getIsPublishingSectionsLoading = computed(() => isPublishingSectionsLoading.value)
  const getPublishingSectionsError = computed(() => publishingSectionsError.value)

  // Actions
  const setSelectedSection = (sectionPath: string) => {
    selectedSectionPath.value = sectionPath
  }

  const setActiveComponent = (componentId: string) => {
    activeComponent.value = componentId
  }

  const expandSection = (sectionId: string) => {
    if (!expandedSections.value.includes(sectionId)) {
      expandedSections.value.push(sectionId)
    }
  }

  const collapseSection = (sectionId: string) => {
    const index = expandedSections.value.indexOf(sectionId)
    if (index > -1) {
      expandedSections.value.splice(index, 1)
    }
  }

  const toggleSection = (sectionId: string) => {
    if (expandedSections.value.includes(sectionId)) {
      collapseSection(sectionId)
    } else {
      expandSection(sectionId)
    }
  }

  // Editor actions
  const openServiceEditor = (mode: 'creation' | 'edit', serviceId?: string, serviceData?: Service) => {
    activeComponent.value = 'ServiceEditor'
    selectedSectionPath.value = 'services.serviceeditor'
    editorMode.value = mode
    editingServiceId.value = serviceId || null
    editingServiceData.value = serviceData || null
    activeSection.value = 'details' // По умолчанию открываем секцию "данные сервиса"
    
    if (mode === 'edit' && serviceData) {
      populateFormDataFromService(serviceData)
    } else {
      resetFormData()
    }
  }

  const closeServiceEditor = () => {
    activeComponent.value = 'services.serviceslist'
    editorMode.value = 'creation'
    editingServiceId.value = null
    editingServiceData.value = null
    activeSection.value = 'details'
    resetFormData()
  }

  const setActiveSection = (section: 'details' | 'preferences' | 'catalog publication') => {
    activeSection.value = section
  }
  
  // Form data actions
  const updateFormData = (updates: Partial<typeof formData.value>) => {
    Object.assign(formData.value, updates)
  }
  
  const updateFormField = <K extends keyof typeof formData.value>(field: K, value: typeof formData.value[K]) => {
    formData.value[field] = value
  }
  
  const resetFormData = () => {
    formData.value = {
      name: '',
      iconName: '',
      supportTier1: '',
      supportTier2: '',
      supportTier3: '',
      owner: '',
      backupOwner: '',
      technicalOwner: '',
      backupTechnicalOwner: '',
      dispatcher: '',
      priority: ServicePriority.LOW,
      status: ServiceStatus.DRAFTED,
      descriptionShort: '',
      descriptionLong: '',
      purpose: '',
      comments: '',
      isPublic: false,
      accessAllowedGroups: [],
      accessDeniedGroups: [],
      accessDeniedUsers: [],
      showOwner: false,
      showBackupOwner: false,
      showTechnicalOwner: false,
      showBackupTechnicalOwner: false,
      showDispatcher: false,
      showSupportTier1: false,
      showSupportTier2: false,
      showSupportTier3: false
    }
  }
  
  const populateFormDataFromService = (service: Service) => {
    formData.value = {
      name: service.name,
      iconName: service.icon_name || '',
      supportTier1: service.support_tier1 || '',
      supportTier2: service.support_tier2 || '',
      supportTier3: service.support_tier3 || '',
      owner: service.owner || '',
      backupOwner: service.backup_owner || '',
      technicalOwner: service.technical_owner || '',
      backupTechnicalOwner: service.backup_technical_owner || '',
      dispatcher: service.dispatcher || '',
      priority: service.priority,
      status: service.status || ServiceStatus.DRAFTED,
      descriptionShort: service.description_short || '',
      descriptionLong: service.description_long || '',
      purpose: service.purpose || '',
      comments: service.comments || '',
      isPublic: service.is_public,
      accessAllowedGroups: service.access_allowed_groups && typeof service.access_allowed_groups === 'string' && service.access_allowed_groups.trim() ? service.access_allowed_groups.split(',').map(g => g.trim()).filter(g => g) : [],
      accessDeniedGroups: service.access_denied_groups && typeof service.access_denied_groups === 'string' && service.access_denied_groups.trim() ? service.access_denied_groups.split(',').map(g => g.trim()).filter(g => g) : [],
      accessDeniedUsers: service.access_denied_users && typeof service.access_denied_users === 'string' && service.access_denied_users.trim() ? service.access_denied_users.split(',').map(u => u.trim()).filter(u => u) : [],
      showOwner: service.show_owner ?? false,
      showBackupOwner: service.show_backup_owner ?? false,
      showTechnicalOwner: service.show_technical_owner ?? false,
      showBackupTechnicalOwner: service.show_backup_technical_owner ?? false,
      showDispatcher: service.show_dispatcher ?? false,
      showSupportTier1: service.show_support_tier1 ?? false,
      showSupportTier2: service.show_support_tier2 ?? false,
      showSupportTier3: service.show_support_tier3 ?? false
    }
  }
  
  // Publishing sections actions
  const setPublishingSections = (sections: PublishingSection[]) => {
    publishingSections.value = sections
  }
  
  const setPublishingSectionsLoading = (loading: boolean) => {
    isPublishingSectionsLoading.value = loading
  }
  
  const setPublishingSectionsError = (error: string | null) => {
    publishingSectionsError.value = error
  }
  
  const clearPublishingSectionsError = () => {
    publishingSectionsError.value = null
  }

  return {
    // State
    selectedSectionPath,
    activeComponent,
    expandedSections,
    editorMode,
    editingServiceId,
    editingServiceData,
    activeSection,
    formData,
    publishingSections,
    isPublishingSectionsLoading,
    publishingSectionsError,
    
    // Getters
    getSelectedSectionPath,
    getActiveComponent,
    getExpandedSections,
    getEditorMode,
    getEditingServiceId,
    getEditingServiceData,
    getActiveSection,
    getFormData,
    getPublishingSections,
    getIsPublishingSectionsLoading,
    getPublishingSectionsError,
    
    // Actions
    setSelectedSection,
    setActiveComponent,
    expandSection,
    collapseSection,
    toggleSection,
    openServiceEditor,
    closeServiceEditor,
    setActiveSection,
    updateFormData,
    updateFormField,
    resetFormData,
    populateFormDataFromService,
    setPublishingSections,
    setPublishingSectionsLoading,
    setPublishingSectionsError,
    clearPublishingSectionsError
  }
}) 