/**
 * controller.public.registration.status.ts - backend file
 * version: 1.0.0
 * Controller for public registration status endpoint.
 * Provides registration page availability status without authentication.
 * Uses existing settings cache and service layer.
 */

import { Request, Response } from 'express';
import { fetchSettingByName } from '../../modules/admin/settings/service.fetch.settings';
import { connectionHandler } from '../helpers/connection.handler';
import { Environment } from '../../modules/admin/settings/types.settings';

/**
 * Interface for registration status response
 */
interface RegistrationStatusResponse {
  success: boolean;
  enabled: boolean;
  error?: string;
}

/**
 * Business logic for fetching registration status
 * @param req Express request
 * @param res Express response
 */
async function getRegistrationStatusLogic(req: Request, res: Response): Promise<RegistrationStatusResponse> {
  try {
    // Fetch registration setting from cache using existing service
    const setting = await fetchSettingByName({
      sectionPath: 'AdminOrgMgmt',
      settingName: 'registration.page.enabled',
      environment: Environment.ALL,
      includeConfidential: false
    }, req);

    // If setting not found, default to disabled
    if (!setting) {
      return {
        success: true,
        enabled: false
      };
    }

    // Parse the setting value
    const enabled = Boolean(setting.value);

    return {
      success: true,
      enabled
    };

  } catch (error) {
    console.error('Error fetching registration status:', error);
    
    // Return disabled on error for security
    return {
      success: true,
      enabled: false,
      error: 'Failed to fetch registration status'
    };
  }
}

/**
 * Public registration status controller
 * Wraps business logic with connection handler
 */
const getRegistrationStatusController = connectionHandler(getRegistrationStatusLogic, 'PublicRegistrationStatusController');

export default getRegistrationStatusController;
