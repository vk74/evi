/**
 * state.app.admin.ts
 * 
 * Simple state management for the application settings module using Pinia.
 * Currently only tracks the selected category index for persistence between sessions.
 */

import { defineStore } from 'pinia';

// Define the interface for the store state
interface AppAdminState {
  // Currently only tracking the UI state for selected category
  selectedCategoryIndex: number;
}

/**
 * App Admin Store
 * Currently only manages which settings category is selected
 */
export const useAppAdminStore = defineStore('appAdmin', {
  // Initial state
  state: (): AppAdminState => ({
    selectedCategoryIndex: 0
  }),
  
  // Getters
  getters: {
    // Get the currently selected category index
    getCurrentCategoryIndex: (state) => state.selectedCategoryIndex
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