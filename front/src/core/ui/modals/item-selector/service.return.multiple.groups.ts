/**
 * File: service.return.multiple.groups.ts
 * Version: 1.0.0
 * Description: FRONTEND service for returning multiple selected groups from ItemSelector
 * Purpose: Returns multiple selected groups for use in forms, validates data, handles errors
 * Frontend file
 * Created: 2024-12-19
 * Last updated: 2024-12-19
 */
import { ActionResult } from './types.item.selector';
import { SearchResult } from './types.search.services';
import { useUiStore } from '@/core/state/uistate';

// Define interfaces for the selected groups
interface SelectedGroup {
  uuid: string;
  name: string;
  [key: string]: any;
}

// Logger for tracking operations
const logger = {
  info: (message: string, meta?: object) => console.log(`[ReturnMultipleGroupsService] ${message}`, meta || ''),
  error: (message: string, error?: unknown) => console.error(`[ReturnMultipleGroupsService] ${message}`, error || ''),
};

/**
 * Returns multiple selected groups for use in forms.
 * @param groupIds - Array of group UUIDs selected in ItemSelector
 * @param searchResults - Array of search results from the search service
 * @returns Promise with response containing the selected groups
 */
async function returnMultipleGroups(groupIds: string[], searchResults?: SearchResult[]): Promise<ActionResult> {
  const uiStore = useUiStore();

  // Validate input parameters
  if (!groupIds || groupIds.length === 0) {
    const errorMessage = 'No groups selected';
    logger.error(errorMessage);
    uiStore.showErrorSnackbar(errorMessage);
    return { success: false, message: errorMessage };
  }

  logger.info('Groups selected for return', { selectedGroupIds: groupIds, count: groupIds.length });

  try {
    // Find the selected groups in search results
    const selectedGroups: SelectedGroup[] = [];
    
    if (searchResults && searchResults.length > 0) {
      // Find groups in search results by UUID
      for (const groupId of groupIds) {
        const foundGroup = searchResults.find(group => group.uuid === groupId);
        
        if (foundGroup) {
          selectedGroups.push({
            name: foundGroup.name || 'Unknown Group',
            ...foundGroup // Include all other properties including uuid
          });
          logger.info('Found group in search results', { group: foundGroup });
        } else {
          // Create fallback for group not found in search results
          selectedGroups.push({
            uuid: groupId,
            name: `Group ${groupId.substring(0, 8)}`, // Fallback name based on UUID
          });
          logger.info('Group not found in search results, using fallback', { groupId });
        }
      }
    } else {
      // Create fallbacks for all groups if no search results
      for (const groupId of groupIds) {
        selectedGroups.push({
          uuid: groupId,
          name: `Group ${groupId.substring(0, 8)}`, // Fallback name based on UUID
        });
      }
      logger.info('No search results available, using fallbacks for all groups');
    }

    logger.info('Groups return successful', { selectedGroups, count: selectedGroups.length });

    // Return success response with the selected groups data
    return {
      success: true,
      message: `${selectedGroups.length} groups returned successfully`,
      selectedItems: selectedGroups,
      groups: selectedGroups, // Alternative property name for compatibility
      count: selectedGroups.length
    };
  } catch (error) {
    // Log error
    logger.error('Error returning groups', error);

    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error occurred while returning groups';
    
    uiStore.showErrorSnackbar(errorMessage);

    // Return error response
    return { success: false, message: errorMessage };
  }
}

export default returnMultipleGroups; 