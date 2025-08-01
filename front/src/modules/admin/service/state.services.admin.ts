import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useServicesAdminStore = defineStore('servicesAdmin', () => {
  // State
  const selectedSectionPath = ref('Services.List')
  const activeComponent = ref('Services.List')
  const expandedSections = ref<string[]>(['Services'])
  
  // Editor state
  const editorMode = ref<'creation' | 'edit'>('creation')
  const editingServiceId = ref<string | null>(null)

  // Getters
  const getSelectedSectionPath = computed(() => selectedSectionPath.value)
  const getActiveComponent = computed(() => activeComponent.value)
  const getExpandedSections = computed(() => expandedSections.value)
  const getEditorMode = computed(() => editorMode.value)
  const getEditingServiceId = computed(() => editingServiceId.value)

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
  const openServiceEditor = (mode: 'creation' | 'edit', serviceId?: string) => {
    activeComponent.value = 'ServiceEditor'
    editorMode.value = mode
    editingServiceId.value = serviceId || null
  }

  const closeServiceEditor = () => {
    activeComponent.value = 'Services.List'
    editorMode.value = 'creation'
    editingServiceId.value = null
  }

  return {
    // State
    selectedSectionPath,
    activeComponent,
    expandedSections,
    editorMode,
    editingServiceId,
    
    // Getters
    getSelectedSectionPath,
    getActiveComponent,
    getExpandedSections,
    getEditorMode,
    getEditingServiceId,
    
    // Actions
    setSelectedSection,
    setActiveComponent,
    expandSection,
    collapseSection,
    toggleSection,
    openServiceEditor,
    closeServiceEditor
  }
}) 