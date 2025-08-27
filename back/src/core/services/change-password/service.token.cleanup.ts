/**
 * service.token.cleanup.ts - version 1.0.02
 * BACKEND service for token cleanup operations during password changes
 * 
 * Handles cleanup of refresh tokens when passwords are changed
 * File: service.token.cleanup.ts
 */

import { Pool } from 'pg';
import { pool as pgPool } from '../../db/maindb';
import { getSetting } from '../../../modules/admin/settings/cache.settings';
import { createAndPublishEvent } from '@/core/eventBus/fabric.events';
import { TOKEN_CLEANUP_EVENTS } from './events.change.password';

// SQL queries for token operations
const tokenQueries = {
  // Get all active tokens for user by UUID
  getActiveTokensForUser: {
    text: `
      SELECT id, user_uuid, token_hash, issued_at, expires_at, revoked, device_fingerprint_hash
      FROM app.tokens
      WHERE user_uuid = $1 AND revoked = false AND expires_at > NOW()
      ORDER BY issued_at DESC
    `,
    values: ['userUuid']
  },

  // Revoke specific token by ID
  revokeTokenById: {
    text: `
      UPDATE app.tokens
      SET revoked = true
      WHERE id = $1
      RETURNING id, user_uuid, token_hash, issued_at, expires_at, revoked, device_fingerprint_hash
    `,
    values: ['tokenId']
  }
};

// Type assertion for pool
const pool = pgPool as Pool;

/**
 * Parse setting value to boolean
 * @param setting Setting object
 * @returns {boolean} Parsed boolean value
 */
function parseSettingValue(setting: any): boolean {
  if (typeof setting.value === 'boolean') {
    return setting.value;
  }
  if (typeof setting.value === 'string') {
    return setting.value.toLowerCase() === 'true';
  }
  if (typeof setting.value === 'number') {
    return setting.value !== 0;
  }
  return false;
}

/**
 * Get setting value for token cleanup on user password change
 * @returns {boolean} Setting value or throws error if not found
 */
function getTokenCleanupSetting(): boolean {
  const settingName = 'drop.refresh.tokens.on.user.change.password';
  
  createAndPublishEvent({
    eventName: TOKEN_CLEANUP_EVENTS.LOADING_TOKEN_CLEANUP_SETTING.eventName,
    payload: {
      settingName
    }
  });
  
  const setting = getSetting('Application.Security.SessionManagement', settingName);
  
  if (!setting) {
    createAndPublishEvent({
      eventName: TOKEN_CLEANUP_EVENTS.CRITICAL_SETTING_NOT_FOUND.eventName,
      payload: {
        settingName
      }
    });
    throw new Error('Critical setting not found: drop.refresh.tokens.on.user.change.password. Please ensure settings are loaded.');
  }
  
  const value = parseSettingValue(setting);
  const isEnabled = Boolean(value);
  
  createAndPublishEvent({
    eventName: TOKEN_CLEANUP_EVENTS.TOKEN_CLEANUP_SETTING_VALUE.eventName,
    payload: {
      settingName,
      value: isEnabled
    }
  });
  
  return isEnabled;
}

/**
 * Get setting value for token cleanup on admin password reset
 * @returns {boolean} Setting value or throws error if not found
 */
function getAdminTokenCleanupSetting(): boolean {
  const settingName = 'drop.refresh.tokens.on.admin.password.change';
  
  createAndPublishEvent({
    eventName: TOKEN_CLEANUP_EVENTS.LOADING_TOKEN_CLEANUP_SETTING.eventName,
    payload: {
      settingName
    }
  });
  
  const setting = getSetting('Application.Security.SessionManagement', settingName);
  
  if (!setting) {
    createAndPublishEvent({
      eventName: TOKEN_CLEANUP_EVENTS.CRITICAL_SETTING_NOT_FOUND.eventName,
      payload: {
        settingName
      }
    });
    throw new Error('Critical setting not found: drop.refresh.tokens.on.admin.password.change. Please ensure settings are loaded.');
  }
  
  const value = parseSettingValue(setting);
  const isEnabled = Boolean(value);
  
  createAndPublishEvent({
    eventName: TOKEN_CLEANUP_EVENTS.TOKEN_CLEANUP_SETTING_VALUE.eventName,
    payload: {
      settingName,
      value: isEnabled
    }
  });
  
  return isEnabled;
}

/**
 * Calculate similarity percentage between two fingerprint hashes
 * @param hash1 First fingerprint hash
 * @param hash2 Second fingerprint hash
 * @returns {number} Similarity percentage (0-100)
 */
function calculateFingerprintSimilarity(hash1: string, hash2: string): number {
  if (!hash1 || !hash2) return 0;
  
  // Simple similarity calculation based on hash comparison
  // In production, you might want to use more sophisticated algorithms
  let matches = 0;
  const minLength = Math.min(hash1.length, hash2.length);
  
  for (let i = 0; i < minLength; i++) {
    if (hash1[i] === hash2[i]) {
      matches++;
    }
  }
  
  return (matches / minLength) * 100;
}

/**
 * Find the most recent token with the closest fingerprint match
 * @param tokens Array of active tokens
 * @param currentFingerprintHash Current device fingerprint hash
 * @returns {string | null} Token ID to keep, or null if no good match found
 */
function findTokenToKeep(tokens: any[], currentFingerprintHash: string): string | null {
  if (tokens.length === 0) return null;
  
  createAndPublishEvent({
    eventName: TOKEN_CLEANUP_EVENTS.FINDING_TOKEN_TO_KEEP.eventName,
    payload: {
      tokenCount: tokens.length
    }
  });
  
  let bestMatch = null;
  let bestSimilarity = 0;
  let bestMatchTime = new Date(0);
  let mostRecentToken = null;
  let mostRecentTime = new Date(0);
  
  for (const token of tokens) {
    const tokenTime = new Date(token.issued_at);
    
    // Always track the most recent token as fallback
    if (tokenTime > mostRecentTime) {
      mostRecentTime = tokenTime;
      mostRecentToken = token.id;
    }
    
    // If token has fingerprint, calculate similarity
    if (token.device_fingerprint_hash) {
      const similarity = calculateFingerprintSimilarity(
        token.device_fingerprint_hash,
        currentFingerprintHash
      );
      
      createAndPublishEvent({
        eventName: TOKEN_CLEANUP_EVENTS.TOKEN_SIMILARITY.eventName,
        payload: {
          tokenId: token.id,
          similarity: similarity.toFixed(2)
        }
      });
      
      // If this is a better match OR same match but newer token
      if (similarity > bestSimilarity || 
          (similarity === bestSimilarity && tokenTime > bestMatchTime)) {
        bestSimilarity = similarity;
        bestMatchTime = tokenTime;
        bestMatch = token.id;
      }
    }
  }
  
  // Return best match if similarity is above threshold, otherwise most recent
  const SIMILARITY_THRESHOLD = 80; // 80% similarity threshold
  return bestSimilarity >= SIMILARITY_THRESHOLD ? bestMatch : mostRecentToken;
}

/**
 * Clean up user's refresh tokens (self password change)
 * @param userUuid User UUID
 * @param currentFingerprintHash Current device fingerprint hash
 */
export async function cleanupUserTokens(userUuid: string, currentFingerprintHash: string): Promise<void> {
  try {
    // Check if token cleanup is enabled
    const isEnabled = getTokenCleanupSetting();
    
    if (!isEnabled) {
      createAndPublishEvent({
        eventName: TOKEN_CLEANUP_EVENTS.TOKEN_CLEANUP_DISABLED.eventName,
        payload: {
          settingName: 'drop.refresh.tokens.on.user.change.password'
        }
      });
      return;
    }
    
    createAndPublishEvent({
      eventName: TOKEN_CLEANUP_EVENTS.TOKEN_CLEANUP_ENABLED.eventName,
      payload: {
        settingName: 'drop.refresh.tokens.on.user.change.password'
      }
    });
    
    // Get all active tokens for user
    const result = await pool.query(tokenQueries.getActiveTokensForUser.text, [userUuid]);
    const activeTokens = result.rows;
    
    createAndPublishEvent({
      eventName: TOKEN_CLEANUP_EVENTS.FOUND_ACTIVE_TOKENS.eventName,
      payload: {
        userUuid,
        tokenCount: activeTokens.length
      }
    });
    
    if (activeTokens.length === 0) {
      createAndPublishEvent({
        eventName: TOKEN_CLEANUP_EVENTS.NO_ACTIVE_TOKENS_FOUND.eventName,
        payload: {
          userUuid
        }
      });
      return;
    }
    
    // Find token to keep
    const tokenToKeep = findTokenToKeep(activeTokens, currentFingerprintHash);
    
    if (!tokenToKeep) {
      createAndPublishEvent({
        eventName: TOKEN_CLEANUP_EVENTS.NO_TOKEN_TO_KEEP_FOUND.eventName,
        payload: {
          userUuid
        }
      });
      // Revoke all tokens if no good match found
      for (const token of activeTokens) {
        await pool.query(tokenQueries.revokeTokenById.text, [token.id]);
        createAndPublishEvent({
          eventName: TOKEN_CLEANUP_EVENTS.TOKEN_REVOKED.eventName,
          payload: {
            userUuid,
            tokenId: token.id
          }
        });
      }
      return;
    }
    
    // Revoke all tokens except the one to keep
    let revokedCount = 0;
    for (const token of activeTokens) {
      if (token.id !== tokenToKeep) {
        await pool.query(tokenQueries.revokeTokenById.text, [token.id]);
        createAndPublishEvent({
          eventName: TOKEN_CLEANUP_EVENTS.TOKEN_REVOKED.eventName,
          payload: {
            userUuid,
            tokenId: token.id
          }
        });
        revokedCount++;
      }
    }
    
    createAndPublishEvent({
      eventName: TOKEN_CLEANUP_EVENTS.TOKEN_CLEANUP_COMPLETED.eventName,
      payload: {
        userUuid,
        revokedCount,
        keptCount: 1
      }
    });
    
  } catch (error) {
    createAndPublishEvent({
      eventName: TOKEN_CLEANUP_EVENTS.TOKEN_CLEANUP_ERROR.eventName,
      payload: {
        userUuid,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      errorData: error instanceof Error ? error.message : undefined
    });
    throw error;
  }
}

/**
 * Clean up ALL user's refresh tokens (admin password reset)
 * @param userUuid User UUID
 */
export async function cleanupAllUserTokens(userUuid: string): Promise<void> {
  createAndPublishEvent({
    eventName: TOKEN_CLEANUP_EVENTS.ALL_TOKEN_CLEANUP_STARTED.eventName,
    payload: {
      userUuid
    }
  });
  
  try {
    // Check if admin token cleanup is enabled
    const isEnabled = getAdminTokenCleanupSetting();
    
    if (!isEnabled) {
      createAndPublishEvent({
        eventName: TOKEN_CLEANUP_EVENTS.ADMIN_TOKEN_CLEANUP_DISABLED.eventName,
        payload: {
          settingName: 'drop.refresh.tokens.on.admin.password.change'
        }
      });
      return;
    }
    
    createAndPublishEvent({
      eventName: TOKEN_CLEANUP_EVENTS.ADMIN_TOKEN_CLEANUP_ENABLED.eventName,
      payload: {
        settingName: 'drop.refresh.tokens.on.admin.password.change'
      }
    });
    
    // Get all active tokens for user
    const result = await pool.query(tokenQueries.getActiveTokensForUser.text, [userUuid]);
    const activeTokens = result.rows;
    
    createAndPublishEvent({
      eventName: TOKEN_CLEANUP_EVENTS.FOUND_ACTIVE_TOKENS.eventName,
      payload: {
        userUuid,
        tokenCount: activeTokens.length
      }
    });
    
    if (activeTokens.length === 0) {
      createAndPublishEvent({
        eventName: TOKEN_CLEANUP_EVENTS.NO_ACTIVE_TOKENS_FOUND.eventName,
        payload: {
          userUuid
        }
      });
      return;
    }
    
    // Revoke ALL tokens (no exceptions for admin reset)
    let revokedCount = 0;
    for (const token of activeTokens) {
      await pool.query(tokenQueries.revokeTokenById.text, [token.id]);
      createAndPublishEvent({
        eventName: TOKEN_CLEANUP_EVENTS.TOKEN_REVOKED.eventName,
        payload: {
          userUuid,
          tokenId: token.id
        }
      });
      revokedCount++;
    }
    
    createAndPublishEvent({
      eventName: TOKEN_CLEANUP_EVENTS.ALL_TOKEN_CLEANUP_COMPLETED.eventName,
      payload: {
        userUuid,
        revokedCount
      }
    });
    
  } catch (error) {
    createAndPublishEvent({
      eventName: TOKEN_CLEANUP_EVENTS.ALL_TOKEN_CLEANUP_ERROR.eventName,
      payload: {
        userUuid,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      errorData: error instanceof Error ? error.message : undefined
    });
    throw error;
  }
}

export default cleanupUserTokens; 