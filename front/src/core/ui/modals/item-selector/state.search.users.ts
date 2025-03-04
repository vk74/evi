/**
 * @file state.search.users.ts
 * Pinia store for managing the state of search results in the ItemSelector.
 *
 * Functionality:
 * - Stores search results (user UUIDs) as automatically selected items
 * - Provides getters and actions for managing search state
 */

import { defineStore } from 'pinia'
import type { SearchResult } from './types.item.selector'

export const useSearchUsersStore = defineStore('searchUsers', {
  state: () => ({
    searchResults: [] as SearchResult[], // Store search results, automatically selected
    maxItems: 20, // Default maximum number of selectable items (can be overridden by props)
  }),

  getters: {
    getSearchResults(): SearchResult[] {
      return this.searchResults
    },
    getSelectedItems(): string[] {
      return this.searchResults.map(item => item.uuid) // All results are automatically selected
    },
  },

  actions: {
    /**
     * Update search results
     */
    setSearchResults(results: SearchResult[]) {
      console.log('[SearchUsersStore] Setting search results:', results)
      this.searchResults = results
    },

    /**
     * Remove a selected item (user UUID) by clicking the close icon
     */
    removeSelectedItem(itemId: string) {
      console.log('[SearchUsersStore] Removing selected item:', itemId, 'Current searchResults:', this.searchResults)
      this.searchResults = this.searchResults.filter(item => item.uuid !== itemId)
      console.log('[SearchUsersStore] Updated searchResults after removal:', this.searchResults)
    },

    /**
     * Clear search results
     */
    clearSelection() {
      console.log('[SearchUsersStore] Clearing search results')
      this.searchResults = []
    },

    /**
     * Update maxItems limit
     */
    setMaxItems(limit: number) {
      console.log('[SearchUsersStore] Setting maxItems limit:', limit)
      this.maxItems = limit
    },
  },
})

export default useSearchUsersStore