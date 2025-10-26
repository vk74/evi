/**
 * @file service.fetch.public.settings.ts
 * Version: 1.0.1
 * Service for fetching public settings from the backend (no authentication required).
 * Frontend file that provides interface for loading public settings accessible to anonymous users.
 *
 * Functionality:
 * - Fetches public settings from /api/public/ui-settings endpoint
 * - No authentication required
 * - Returns minimal set of public settings for anonymous users
 * - Public settings include: navbar color, catalog card colors, visibility settings
 */

import { api } from '@/core/api/service.axios';
import { PublicUiSettingsResponse } from '@/modules/admin/settings/types.settings';

/**
 * Fetches public settings from the backend
 * These settings are available without authentication
 * 
 * @returns Promise that resolves to public settings response
 * @throws Error if the request fails
 */
export async function fetchPublicUiSettings(): Promise<PublicUiSettingsResponse> {
  try {
    console.log('[Public Settings] Fetching public settings');
    
    // Make GET request to public endpoint (no auth required)
    const response = await api.get<PublicUiSettingsResponse>(
      '/api/public/ui-settings'
    );
    
    if (response.data.success) {
      console.log(`[Public Settings] Successfully fetched ${response.data.settings.length} public settings`);
      return response.data;
    } else {
      throw new Error(response.data.error || 'Failed to fetch public settings');
    }
  } catch (error) {
    console.error('[Public Settings] Error fetching public settings:', error);
    throw error;
  }
}
