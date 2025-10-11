/**
 * @file service.fetch.public.ui.settings.ts
 * Version: 1.0.0
 * Service for fetching public UI settings from the backend (no authentication required).
 * Frontend file that provides interface for loading public UI settings accessible to anonymous users.
 *
 * Functionality:
 * - Fetches public UI settings from /api/public/ui-settings endpoint
 * - No authentication required
 * - Returns minimal set of UI settings for anonymous users
 * - Public settings include: navbar color, catalog card colors, visibility settings
 */

import { api } from '@/core/api/service.axios';
import { PublicUiSettingsResponse } from '@/modules/admin/settings/types.settings';

/**
 * Fetches public UI settings from the backend
 * These settings are available without authentication
 * 
 * @returns Promise that resolves to public UI settings response
 * @throws Error if the request fails
 */
export async function fetchPublicUiSettings(): Promise<PublicUiSettingsResponse> {
  try {
    console.log('[Public UI Settings] Fetching public UI settings');
    
    // Make GET request to public endpoint (no auth required)
    const response = await api.get<PublicUiSettingsResponse>(
      '/api/public/ui-settings'
    );
    
    // Check if request was successful
    if (response.data.success && response.data.settings) {
      console.log(`[Public UI Settings] Successfully fetched ${response.data.settings.length} settings`);
      return response.data;
    } else {
      // Handle unsuccessful response
      const errorMessage = response.data.error || 'Unknown error fetching public UI settings';
      console.error('[Public UI Settings] Error:', errorMessage);
      
      throw new Error(errorMessage);
    }
  } catch (error) {
    // Handle exception
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Public UI Settings] Exception:', errorMessage);
    
    throw new Error(`Failed to fetch public UI settings: ${errorMessage}`);
  }
}

