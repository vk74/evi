/**
 * types.change.password.ts
 * Type definitions for password changing functionality.
 * Supports both user self-change and admin password reset scenarios.
 */

// Request interfaces
export interface SelfChangePasswordRequest {
  uuid: string;
  username: string;
  currentPassword: string;
  newPassword: string;
}

export interface AdminResetPasswordRequest {
  uuid: string;
  username: string;
  newPassword: string;
}

// Response interfaces
export interface ChangePasswordResponse {
  success: boolean;
  message?: string; // Optional message that can be used for both success and error cases
  error?: string; // Optional detailed error message
}

// Enum for password change modes
export enum PasswordChangeMode {
  SELF = 'self',
  ADMIN = 'admin'
}