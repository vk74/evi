/**
 * service.admin.change.password.ts
 * Service for handling admin password reset operations.
 * Makes API calls to backend admin reset password endpoint.
 */

import { api } from '@/core/api/service.axios';
import { AxiosError } from 'axios';
import { AdminResetPasswordRequest, ChangePasswordResponse } from './types.change.password';
import { useUserStore } from '@/core/state/userstate';

/**
 * Send request to reset user's password (admin function)
 * @param {AdminResetPasswordRequest} data - Password reset request data
 * @returns {Promise<ChangePasswordResponse>} API response
 */
export async function resetPassword(data: AdminResetPasswordRequest): Promise<ChangePasswordResponse> {
  const userStore = useUserStore();
  const adminId = userStore.userID;
  const adminUsername = userStore.username;
  
  console.log(`[Admin Reset Password Service] Preparing to reset password for user: ${data.username} (${data.uuid})`);
  console.log(`[Admin Reset Password Service] Admin performing reset: ${adminUsername} (${adminId})`);
  
  // Log request data safely (without exposing password)
  console.log('[Admin Reset Password Service] Request data:', JSON.stringify({
    uuid: data.uuid || 'undefined',
    username: data.username || 'undefined',
    newPassword: data.newPassword ? '[REDACTED]' : 'undefined'
  }, null, 2));
  
  // Validate required parameters
  if (!data.uuid || !data.username || !data.newPassword) {
    console.error('[Admin Reset Password Service] Missing required fields:', {
      uuid: !!data.uuid, 
      username: !!data.username, 
      newPassword: !!data.newPassword
    });
    
    return {
      success: false,
      message: 'Missing required parameters for password reset',
      error: 'Invalid request data'
    };
  }
  
  try {
    // Log before API call
    console.log('[Admin Reset Password Service] Sending request to endpoint: /api/core/users/admin-change-password');
    
    const response = await api.post<ChangePasswordResponse>(
      '/api/core/users/admin-change-password',
      data
    );
    
    console.log('[Admin Reset Password Service] Password reset response received:', {
      success: response.data.success,
      message: response.data.message
    });
    
    return response.data;
  } catch (error) {
    // Detailed error logging
    if (error instanceof AxiosError) {
      if (error.response) {
        console.error('[Admin Reset Password Service] Server response error:', 
          error.response.status, error.response.statusText);
        console.error('[Admin Reset Password Service] Error details:', error.response.data);
      } else if (error.request) {
        console.error('[Admin Reset Password Service] No response received. Network error details:', error.message);
      } else {
        console.error('[Admin Reset Password Service] Request setup error:', error.message);
      }
      
      if (error.response) {
        return error.response.data as ChangePasswordResponse;
      }
    } else {
      console.error('[Admin Reset Password Service] Unexpected error type:', error);
    }
    
    // Generic error response
    return {
      success: false,
      message: 'Failed to reset password',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export default resetPassword;