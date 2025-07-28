import { defineStore } from 'pinia'

export const useCatalogAdminStore = defineStore('catalogAdmin', {
  state: () => ({
    selectedSectionPath: 'Catalog.Sections' as string,
    expandedSections: ['Catalog'] as string[],
    isLoading: false
  }),

  getters: {
    getSelectedSectionPath: (state) => state.selectedSectionPath,
    getExpandedSections: (state) => state.expandedSections,
    getIsLoading: (state) => state.isLoading
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
    }
  }
})
