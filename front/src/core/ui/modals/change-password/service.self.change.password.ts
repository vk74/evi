/**
 * service.self.change.password.ts
 * Service for handling user self password change operations.
 * Makes API calls to backend self change password endpoint.
 */

import { api } from '@/core/api/service.axios';
import { AxiosError } from 'axios';
import { SelfChangePasswordRequest, ChangePasswordResponse } from './types.change.password';
import { generateDeviceFingerprint } from '@/core/auth/helper.generate.device.fingerprint';

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
    
    const response = await api.post<ChangePasswordResponse>(
      '/api/core/users/self-change-password',
      requestData
    );
    
    // Log the actual response
    if (response.data.success) {
      console.log('[Self Change Password Service] Password change successful:', response.data.message);
    } else {
      console.error('[Self Change Password Service] Password change failed:', response.data.message);
    }
    
    return response.data;
  } catch (error) {
    console.error('[Self Change Password Service] Error changing password:', error);
    
    // Handle axios error responses
    if (error instanceof AxiosError && error.response) {
      const errorResponse = error.response.data as ChangePasswordResponse;
      console.error('[Self Change Password Service] Server error response:', errorResponse);
      return errorResponse;
    }
    
    // Handle other errors
    const errorResponse: ChangePasswordResponse = {
      success: false,
      message: 'Failed to change password',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    
    console.error('[Self Change Password Service] Generic error response:', errorResponse);
    return errorResponse;
  }
}

export default changePassword;