/**
 * @file service.assign.product.owner.ts
 * FRONTEND service for assigning product owner in the ItemSelector.
 * 
 * Functionality:
 * - Assigns owner to one or multiple products via the API based on selected user ID
 * - Validates the received data
 * - Handles errors during the operation
 * - Provides logging for key operations
 */
import { api } from '@/core/api/service.axios';
import { useUiStore } from '@/core/state/uistate';
import { useProductsAdminStore } from '@/modules/admin/products/state.products.admin';
import { ActionResult } from './types.item.selector';
import { SearchResult } from './types.search.services';

// Define interfaces for request and response
interface AssignProductOwnerRequest {
  productIds: string[];      // Array of product IDs
  newOwnerUsername: string;  // Username of the new owner
}

interface AssignProductOwnerResponse {
  success: boolean;
  message?: string;
  data?: {
    updatedProducts: Array<{id: string, product_code: string}>;
    errors: Array<{id: string, error: string}>;
    totalRequested: number;
    totalUpdated: number;
    totalErrors: number;
  };
}

// Logger for tracking operations
const logger = {
  info: (message: string, meta?: object) => console.log(`[AssignProductOwnerService] ${message}`, meta || ''),
  error: (message: string, error?: unknown) => console.error(`[AssignProductOwnerService] ${message}`, error || ''),
};

/**
 * Assigns owner to products based on the selected user ID from ItemSelector.
 * @param userIds - Array of user UUIDs selected in ItemSelector (should contain only one item)
 * @param searchResults - Array of search results from the search service
 * @returns Promise with response indicating success or failure
 */
async function assignProductOwner(userIds: string[], searchResults?: SearchResult[]): Promise<ActionResult> {
  const uiStore = useUiStore();
  const productsStore = useProductsAdminStore();

  // Validate input parameters
  if (!userIds || userIds.length === 0) {
    const errorMessage = 'No user selected to be the new owner';
    logger.error(errorMessage);
    uiStore.showErrorSnackbar(errorMessage);
    return { success: false, message: errorMessage };
  }

  // Ensure only one user is selected (ItemSelector should be configured with maxItems=1)
  if (userIds.length > 1) {
    const errorMessage = 'Only one user can be selected as the product owner';
    logger.error(errorMessage);
    uiStore.showErrorSnackbar(errorMessage);
    return { success: false, message: errorMessage };
  }

  // Get productIds from the store
  const productIds = productsStore.assignOwnerProductIds;
  if (!productIds || productIds.length === 0) {
    const errorMessage = 'No products selected for owner assignment';
    logger.error(errorMessage);
    uiStore.showErrorSnackbar(errorMessage);
    return { success: false, message: errorMessage };
  }

  // Get the new owner ID (the only item in the array)
  const selectedUserId = userIds[0];

  // Extract username from search results
  let newOwnerUsername: string | null = null;
  if (searchResults && searchResults.length > 0) {
    const selectedUser = searchResults.find(user => user.uuid === selectedUserId);
    if (selectedUser) {
      newOwnerUsername = selectedUser.username || selectedUser.name || null;
    }
  }

  if (!newOwnerUsername) {
    const errorMessage = 'Unable to determine username for selected user';
    logger.error(errorMessage);
    uiStore.showErrorSnackbar(errorMessage);
    return { success: false, message: errorMessage };
  }

  // Log the sent request with request body
  const requestBody: AssignProductOwnerRequest = {
    productIds,
    newOwnerUsername,
  };
  
  logger.info('Sending request to assign product owner', {
    endpoint: '/api/admin/products/assign-owner',
    requestBody,
  });

  try {
    // Send POST request to the API endpoint
    const response = await api.post<AssignProductOwnerResponse>(
      '/api/admin/products/assign-owner',
      requestBody,
    );

    // Log the received response
    logger.info('Received response from assigning product owner', {
      response: response.data,
    });

    // Check if the request was successful
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to assign product owner');
    }

    // Clear productIds from store after successful operation
    productsStore.clearAssignOwnerProductIds();

    // Show success message with details
    if (response.data.data) {
      const { totalUpdated, totalRequested, totalErrors } = response.data.data;
      if (totalErrors === 0) {
        uiStore.showSuccessSnackbar(`Owner assigned successfully to ${totalUpdated} product(s)`);
      } else if (totalUpdated > 0) {
        uiStore.showSnackbar({
          message: `Owner assigned to ${totalUpdated} of ${totalRequested} products`,
          type: 'warning',
          timeout: 5000,
          closable: true,
          position: 'bottom'
        });
      } else {
        throw new Error(response.data.message || 'Failed to assign owner to any products');
      }
    } else {
      uiStore.showSuccessSnackbar(response.data.message || 'Owner assigned successfully');
    }

    // Return success response
    return {
      success: true,
      message: response.data.message || 'Product owner assigned successfully',
      count: response.data.data?.totalUpdated || 0
    };
  } catch (error) {
    // Log error with request details
    logger.error('Error assigning product owner', error);

    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error occurred while assigning product owner';
    
    uiStore.showErrorSnackbar(errorMessage);

    // Return error response
    return { 
      success: false, 
      message: errorMessage 
    };
  }
}

export default assignProductOwner;
