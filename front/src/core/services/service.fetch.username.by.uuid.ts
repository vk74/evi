/**
 * service.fetch.username.by.uuid.ts
 * Service for fetching username by user UUID from the API.
 * 
 * Functionality:
 * - Retrieves username for a given user UUID
 * - Handles API requests and error handling
 * - Provides a reusable function for components
 */

import { api } from '../api/service.axios';

// Define types locally in the file
interface ApiResponse {
  success: boolean;
  message: string;
}

interface FetchUsernameResponse extends ApiResponse {
  data: {
    username: string;
  } | null;
}

/**
 * Fetches username for a given user UUID
 * @param userId UUID of the user
 * @returns Promise<string> resolving to the username
 * @throws Error if the request fails or username is not found
 */
export async function fetchUsernameByUuid(userId: string): Promise<string> {
  try {
    console.log(`[FetchUsernameService] Fetching username for userId: ${userId}`);
    
    const response = await api.get<FetchUsernameResponse>(
      `/api/admin/users/fetch-username-by-uuid/${userId}`
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch username');
    }

    if (!response.data.data?.username) {
      throw new Error('Username not found for the given UUID');
    }

    console.log(`[FetchUsernameService] Successfully fetched username: ${response.data.data.username}`);
    return response.data.data.username;

  } catch (error) {
    console.error(`[FetchUsernameService] Error fetching username for userId: ${userId}`, error);
    throw error instanceof Error ? error : new Error('Failed to fetch username');
  }
}

export default fetchUsernameByUuid;