/**
 * @file utils.device.fingerprint.ts
 * Version: 1.0.0
 * Utility functions for device fingerprint operations.
 * Backend file that handles device fingerprint hashing, validation, and logging.
 */

import crypto from 'crypto';
import { DeviceFingerprint, FingerprintHash } from './types.auth';
import { createAndPublishEvent } from '@/core/eventBus/fabric.events';
import { AUTH_DEVICE_FINGERPRINT_EVENTS } from './events.auth';

/**
 * Hashes device fingerprint using SHA-256
 */
export function hashFingerprint(fingerprint: DeviceFingerprint): FingerprintHash {
  try {
    // Create a string representation of the fingerprint
    const fingerprintString = JSON.stringify(fingerprint, Object.keys(fingerprint).sort())
    
    // Generate SHA-256 hash
    const hash = crypto.createHash('sha256').update(fingerprintString).digest('hex')
    
    return {
      hash,
      shortHash: hash.substring(0, 16)
    }
  } catch (error) {
    createAndPublishEvent({
      eventName: AUTH_DEVICE_FINGERPRINT_EVENTS.DEVICE_FINGERPRINT_HASHING_ERROR.eventName,
      payload: {
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      errorData: error instanceof Error ? error.message : undefined
    });
    return {
      hash: '',
      shortHash: ''
    }
  }
}

/**
 * Validates device fingerprint by comparing hashes
 */
export function validateFingerprint(
  currentFingerprint: DeviceFingerprint,
  storedFingerprintHash: string
): boolean {
  try {
    const currentHash = hashFingerprint(currentFingerprint)
    
    // Compare short hash for quick validation
    const storedShortHash = storedFingerprintHash.substring(0, 16)
    
    const isValid = currentHash.shortHash === storedShortHash
    
    console.log('[Device Fingerprint] Fingerprint validation:', {
      currentShortHash: currentHash.shortHash,
      storedShortHash,
      isValid
    })
    
    return isValid
  } catch (error) {
    createAndPublishEvent({
      eventName: AUTH_DEVICE_FINGERPRINT_EVENTS.DEVICE_FINGERPRINT_VALIDATION_ERROR.eventName,
      payload: {
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      errorData: error instanceof Error ? error.message : undefined
    });
    return false
  }
}

/**
 * Extracts device fingerprint from request
 */
export function extractDeviceFingerprintFromRequest(req: any): DeviceFingerprint | null {
  try {
    if (!req.body || !req.body.deviceFingerprint) {
      console.warn('[Device Fingerprint] No device fingerprint in request body')
      return null
    }
    
    const fingerprint = req.body.deviceFingerprint as DeviceFingerprint
    
    // Basic validation
    if (!fingerprint.screen || !fingerprint.userAgent) {
      console.warn('[Device Fingerprint] Invalid device fingerprint structure')
      return null
    }
    
    return fingerprint
  } catch (error) {
    createAndPublishEvent({
      eventName: AUTH_DEVICE_FINGERPRINT_EVENTS.DEVICE_FINGERPRINT_EXTRACTION_ERROR.eventName,
      payload: {
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      errorData: error instanceof Error ? error.message : undefined
    });
    return null
  }
}

/**
 * Logs device fingerprint for security monitoring
 */
export function logDeviceFingerprint(
  userUuid: string,
  fingerprint: DeviceFingerprint,
  action: 'login' | 'refresh' | 'logout'
): void {
  try {
    console.log(`[Device Fingerprint] ${action} fingerprint for user ${userUuid}:`, {
      screen: fingerprint.screen,
      timezone: fingerprint.timezone,
      language: fingerprint.language,
      userAgent: fingerprint.userAgent.substring(0, 100) + '...', // Truncate for logging
      touchSupport: fingerprint.touchSupport,
      hardwareConcurrency: fingerprint.hardwareConcurrency,
      platform: fingerprint.platform
    })
  } catch (error) {
    createAndPublishEvent({
      eventName: AUTH_DEVICE_FINGERPRINT_EVENTS.DEVICE_FINGERPRINT_LOGGING_ERROR.eventName,
      payload: {
        userUuid,
        action,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      errorData: error instanceof Error ? error.message : undefined
    });
  }
} 