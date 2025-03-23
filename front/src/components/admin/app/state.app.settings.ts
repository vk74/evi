/**
 * state.app.settings.ts
 * 
 * Simple state management for the application settings module using Pinia.
 * Tracks the selected category index for persistence between sessions.
 */

import { defineStore } from 'pinia';

// Define the interface for the store state
interface AppSettingsState {
  selectedCategoryIndex: number;
}

/**
 * App Settings Store
 * Manages which settings category is selected
 */
export const useAppSettingsStore = defineStore('appSettings', {
  // Initial state
  state: (): AppSettingsState => ({
    selectedCategoryIndex: 0 // Default to first category
  }),
  
  // Getters
  getters: {
    // Get the currently selected category index
    getCurrentCategoryIndex: (state): number => {
      return state.selectedCategoryIndex;
    }
  },
  
  // Actions
  actions: {
    // Set the selected category
    setSelectedCategory(index: number) {
      this.selectedCategoryIndex = index;
    }
  },
  
  // Enable persistence to keep selected category between sessions
  persist: true
});