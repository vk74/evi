/**
 * state.app.settings.ts
 * 
 * State management for the application settings module using Pinia.
 * Tracks the selected section ID and expanded sections for hierarchical menu.
 */

import { defineStore } from 'pinia';

// Define the interface for the store state
interface AppSettingsState {
  selectedSectionId: string;
  expandedSections: string[];
}

/**
 * App Settings Store
 * Manages which settings section is selected and which sections are expanded
 */
export const useAppSettingsStore = defineStore('appSettings', {
  // Initial state
  state: (): AppSettingsState => ({
    selectedSectionId: 'application', // Default to application section
    expandedSections: [] // Start with all sections collapsed
  }),
  
  // Getters
  getters: {
    // Get the currently selected section ID
    getSelectedSectionId: (state): string => {
      return state.selectedSectionId;
    },
    
    // Get all expanded section IDs
    getExpandedSections: (state): string[] => {
      return state.expandedSections;
    }
  },
  
  // Actions
  actions: {
    // Set the selected section
    setSelectedSection(id: string) {
      this.selectedSectionId = id;
    },
    
    // Expand a section
    expandSection(id: string) {
      if (!this.expandedSections.includes(id)) {
        this.expandedSections.push(id);
      }
    },
    
    // Collapse a section
    collapseSection(id: string) {
      this.expandedSections = this.expandedSections.filter(sectionId => sectionId !== id);
    },
    
    // Toggle a section's expanded state
    toggleSection(id: string) {
      if (this.expandedSections.includes(id)) {
        this.collapseSection(id);
      } else {
        this.expandSection(id);
      }
    }
  },
  
  // Enable persistence to keep state between sessions
  persist: true
});