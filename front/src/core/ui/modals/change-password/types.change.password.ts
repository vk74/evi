/**
 * FRONTEND types.change.password.ts
 * Type definitions for password change component and related services.
 * Supports both user self-change and admin password reset scenarios.
 */

// Enum for password change modes
export enum PasswordChangeMode {
  SELF = 'self',
  ADMIN = 'admin'
}

// Props interface for ChangePassword component
export interface ChangePasswordProps {
  title: string;       // Title for modal window
  uuid: string;        // User's UUID
  username: string;    // Username
  mode: PasswordChangeMode; // Mode: self or admin
  onClose: () => void; // Callback function to close modal
}

// Request interfaces for API calls
export interface SelfChangePasswordRequest {
  uuid: string;
  username: string;
  currentPassword: string;
  newPassword: string;
  deviceFingerprint?: string; // Device fingerprint for security validation
}

export interface AdminResetPasswordRequest {
  uuid: string;
  username: string;
  newPassword: string;
}

// Response interface from API
export interface ChangePasswordResponse {
  success: boolean;
  message?: string;
  error?: string;
}