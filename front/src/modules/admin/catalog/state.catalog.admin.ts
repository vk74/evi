import { defineStore } from 'pinia'

export const useCatalogAdminStore = defineStore('catalogAdmin', {
  state: () => ({
    selectedSectionPath: 'Catalog.Sections' as string,
    expandedSections: ['Catalog'] as string[],
    isLoading: false,
    activeComponent: 'Catalog.Sections' as 'Catalog.Sections' | 'CatalogSectionEditor',
    editorMode: 'creation' as 'creation' | 'edit',
    editingSectionId: null as string | null
  }),

  getters: {
    getSelectedSectionPath: (state) => state.selectedSectionPath,
    getExpandedSections: (state) => state.expandedSections,
    getIsLoading: (state) => state.isLoading,
    getActiveComponent: (state) => state.activeComponent,
    getEditorMode: (state) => state.editorMode,
    getEditingSectionId: (state) => state.editingSectionId
  },

  actions: {
    setSelectedSection(sectionPath: string) {
      this.selectedSectionPath = sectionPath
    },

    setActiveSection(sectionId: string) {
      this.selectedSectionPath = sectionId
    },

    expandSection(sectionId: string) {
      if (!this.expandedSections.includes(sectionId)) {
        this.expandedSections.push(sectionId)
      }
    },

    collapseSection(sectionId: string) {
      const index = this.expandedSections.indexOf(sectionId)
      if (index > -1) {
        this.expandedSections.splice(index, 1)
      }
    },

    toggleSection(sectionId: string) {
      if (this.expandedSections.includes(sectionId)) {
        this.collapseSection(sectionId)
      } else {
        this.expandSection(sectionId)
      }
    },

    setLoading(loading: boolean) {
      this.isLoading = loading
    },

    // Новые методы для управления редактором
    openSectionEditor(mode: 'creation' | 'edit', sectionId?: string) {
      this.activeComponent = 'CatalogSectionEditor'
      this.editorMode = mode
      this.editingSectionId = sectionId || null
    },

    closeSectionEditor() {
      this.activeComponent = 'Catalog.Sections'
      this.editorMode = 'creation'
      this.editingSectionId = null
    },

    setActiveComponent(componentId: string) {
      this.activeComponent = componentId as 'Catalog.Sections' | 'CatalogSectionEditor'
    }
  }
})
