/**
 * service.self.change.password.ts
 * Service for handling user self password change operations.
 * Makes API calls to backend self change password endpoint.
 */

import axios from 'axios';
import { SelfChangePasswordRequest, ChangePasswordResponse } from './types.change.password';
import { generateDeviceFingerprint } from '@/modules/account/helper.generate.device.fingerprint';

/**
 * Send request to change user's own password
 * @param {SelfChangePasswordRequest} data - Password change request data
 * @returns {Promise<ChangePasswordResponse>} API response
 */
export async function changePassword(data: SelfChangePasswordRequest): Promise<ChangePasswordResponse> {
  console.log('[Self Change Password Service] Preparing to change password for user:', data.username);
  
  try {
    // Generate device fingerprint for security validation
    console.log('[Self Change Password Service] Generating device fingerprint...');
    const deviceFingerprint = generateDeviceFingerprint();
    
    // Convert fingerprint to string for API
    const deviceFingerprintString = JSON.stringify(deviceFingerprint);
    
    // Add device fingerprint to request data
    const requestData = {
      ...data,
      deviceFingerprint: deviceFingerprintString
    };
    
    console.log('[Self Change Password Service] Sending password change request with device fingerprint');
    
    const response = await axios.post<ChangePasswordResponse>(
      '/api/core/users/self-change-password',
      requestData
    );
    
    console.log('[Self Change Password Service] Password change successful');
    return response.data;
  } catch (error) {
    console.error('[Self Change Password Service] Error changing password:', error);
    
    // Handle axios error responses
    if (axios.isAxiosError(error) && error.response) {
      return error.response.data as ChangePasswordResponse;
    }
    
    // Handle other errors
    return {
      success: false,
      message: 'Failed to change password',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export default changePassword;