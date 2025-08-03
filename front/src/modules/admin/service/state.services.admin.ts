import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Service } from './types.services.admin'

export const useServicesAdminStore = defineStore('servicesAdmin', () => {
  // State
  const selectedSectionPath = ref('services.serviceslist')
  const activeComponent = ref('services.serviceslist')
  const expandedSections = ref<string[]>(['services'])
  
  // Editor state
  const editorMode = ref<'creation' | 'edit'>('creation')
  const editingServiceId = ref<string | null>(null)
  const editingServiceData = ref<Service | null>(null)
  const activeSection = ref<'details' | 'catalog publication'>('details')

  // Getters
  const getSelectedSectionPath = computed(() => selectedSectionPath.value)
  const getActiveComponent = computed(() => activeComponent.value)
  const getExpandedSections = computed(() => expandedSections.value)
  const getEditorMode = computed(() => editorMode.value)
  const getEditingServiceId = computed(() => editingServiceId.value)
  const getEditingServiceData = computed(() => editingServiceData.value)
  const getActiveSection = computed(() => activeSection.value)

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
  }

  const closeServiceEditor = () => {
    activeComponent.value = 'services.serviceslist'
    editorMode.value = 'creation'
    editingServiceId.value = null
    editingServiceData.value = null
    activeSection.value = 'details'
  }

  const setActiveSection = (section: 'details' | 'catalog publication') => {
    activeSection.value = section
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
    
    // Getters
    getSelectedSectionPath,
    getActiveComponent,
    getExpandedSections,
    getEditorMode,
    getEditingServiceId,
    getEditingServiceData,
    getActiveSection,
    
    // Actions
    setSelectedSection,
    setActiveComponent,
    expandSection,
    collapseSection,
    toggleSection,
    openServiceEditor,
    closeServiceEditor,
    setActiveSection
  }
}) 