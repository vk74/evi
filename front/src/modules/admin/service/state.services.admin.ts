import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useServicesAdminStore = defineStore('servicesAdmin', () => {
  // State
  const selectedSectionPath = ref('Services.List')
  const activeComponent = ref('Services.List')
  const expandedSections = ref<string[]>(['Services'])

  // Getters
  const getSelectedSectionPath = computed(() => selectedSectionPath.value)
  const getActiveComponent = computed(() => activeComponent.value)
  const getExpandedSections = computed(() => expandedSections.value)

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

  return {
    // State
    selectedSectionPath,
    activeComponent,
    expandedSections,
    
    // Getters
    getSelectedSectionPath,
    getActiveComponent,
    getExpandedSections,
    
    // Actions
    setSelectedSection,
    setActiveComponent,
    expandSection,
    collapseSection,
    toggleSection
  }
}) 