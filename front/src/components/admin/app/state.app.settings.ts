/**
 * state.app.settings.ts
 * 
 * Simple state management for the application settings module using Pinia.
 * Tracks the selected category path for persistence between sessions.
 * The path format is "mainCategoryIndex:subcategoryIndex" for subcategories
 * or just "mainCategoryIndex" for main categories.
 */

import { defineStore } from 'pinia';

// Define the interface for the store state
interface AppSettingsState {
  // Track the category path (main category and optional subcategory)
  selectedCategoryPath: string;
}

/**
 * App Settings Store
 * Manages which settings category/subcategory is selected
 */
export const useAppSettingsStore = defineStore('appSettings', {
  // Initial state
  state: (): AppSettingsState => ({
    selectedCategoryPath: '0' // Default to first main category
  }),
  
  // Getters
  getters: {
    // Get the currently selected main category index
    getMainCategoryIndex: (state): number => {
      const [mainIndex] = state.selectedCategoryPath.split(':');
      return parseInt(mainIndex, 10) || 0;
    },
    
    // Get the currently selected subcategory index, -1 if no subcategory
    getSubcategoryIndex: (state): number => {
      const parts = state.selectedCategoryPath.split(':');
      return parts.length > 1 ? parseInt(parts[1], 10) : -1;
    },
    
    // For backward compatibility with existing code
    getCurrentCategoryIndex: (state): number => {
      return parseInt(state.selectedCategoryPath.split(':')[0], 10) || 0;
    }
  },
  
  // Actions
  actions: {
    // Set the selected category path
    setSelectedCategoryPath(path: string) {
      this.selectedCategoryPath = path;
    },
    
    // For backward compatibility with existing code
    setSelectedCategory(index: number) {
      this.selectedCategoryPath = index.toString();
    }
  },
  
  // Enable persistence to keep selected category between sessions
  persist: true
});