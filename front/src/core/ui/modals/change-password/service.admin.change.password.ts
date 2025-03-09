/**
 * service.admin.change.password.ts
 * Service for handling admin password reset operations.
 * Makes API calls to backend admin reset password endpoint.
 */

import { api } from '@/core/api/service.axios';
import { AxiosError } from 'axios';
import { AdminResetPasswordRequest, ChangePasswordResponse } from './types.change.password';

/**
 * Send request to reset user's password (admin function)
 * @param {AdminResetPasswordRequest} data - Password reset request data
 * @returns {Promise<ChangePasswordResponse>} API response
 */
export async function resetPassword(data: AdminResetPasswordRequest): Promise<ChangePasswordResponse> {
  console.log('[Admin Reset Password Service] Preparing to reset password for user:', data.username);
  
  try {
    const response = await api.post<ChangePasswordResponse>(
      '/api/core/users/admin-change-password',
      data
    );
    
    console.log('[Admin Reset Password Service] Password reset successful');
    return response.data;
  } catch (error) {
    console.error('[Admin Reset Password Service] Error resetting password:', error);
    
    // Handle axios error responses
    if (error instanceof AxiosError && error.response) {
      return error.response.data as ChangePasswordResponse;
    }
    
    // Handle other errors
    return {
      success: false,
      message: 'Failed to reset password',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export default resetPassword;