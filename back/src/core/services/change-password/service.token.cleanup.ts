/**
 * service.token.cleanup.ts
 * Service for cleaning up refresh tokens when user changes password.
 * Handles device fingerprint validation and token removal logic.
 */

import { pool } from '../../db/maindb';
import { getSetting, parseSettingValue } from '@/modules/admin/settings/cache.settings';

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

/**
 * Get setting value for token cleanup on password change
 * @returns {boolean} Setting value or throws error if not found
 */
function getTokenCleanupSetting(): boolean {
  console.log('[Token Cleanup Service] Loading token cleanup setting...');
  
  const setting = getSetting('Application.Security.SessionManagement', 'drop.refresh.tokens.on.user.change.password');
  
  if (!setting) {
    console.error('[Token Cleanup Service] Critical setting not found: drop.refresh.tokens.on.user.change.password');
    throw new Error('Critical setting not found: drop.refresh.tokens.on.user.change.password. Please ensure settings are loaded.');
  }
  
  const value = parseSettingValue(setting);
  const isEnabled = Boolean(value);
  
  console.log('[Token Cleanup Service] Token cleanup setting value:', isEnabled);
  
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
  
  console.log('[Token Cleanup Service] Finding token to keep among', tokens.length, 'active tokens');
  
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
      
      console.log('[Token Cleanup Service] Token similarity:', similarity.toFixed(2) + '%');
      
      // If this is a better match OR same match but newer token
      if (similarity > bestSimilarity || 
          (similarity === bestSimilarity && tokenTime > bestMatchTime)) {
        bestSimilarity = similarity;
        bestMatch = token.id;
        bestMatchTime = tokenTime;
      }
    }
  }
  
  // If we found a good match (95% or higher), use it
  if (bestSimilarity >= 95) {
    console.log('[Token Cleanup Service] Found good fingerprint match:', bestSimilarity.toFixed(2) + '%', 'issued at:', bestMatchTime);
    return bestMatch;
  }
  
  // Otherwise, keep the most recent token
  console.log('[Token Cleanup Service] No good fingerprint match found, keeping most recent token issued at:', mostRecentTime);
  return mostRecentToken;
}

/**
 * Clean up user's refresh tokens except the current device
 * @param userUuid User UUID
 * @param currentFingerprintHash Current device fingerprint hash
 */
export async function cleanupUserTokens(userUuid: string, currentFingerprintHash: string): Promise<void> {
  console.log('[Token Cleanup Service] Starting token cleanup for user:', userUuid);
  
  try {
    // Check if token cleanup is enabled
    const isEnabled = getTokenCleanupSetting();
    
    if (!isEnabled) {
      console.log('[Token Cleanup Service] Token cleanup is disabled, skipping');
      return;
    }
    
    console.log('[Token Cleanup Service] Token cleanup is enabled, proceeding...');
    
    // Get all active tokens for user
    const result = await pool.query(tokenQueries.getActiveTokensForUser.text, [userUuid]);
    const activeTokens = result.rows;
    
    console.log('[Token Cleanup Service] Found', activeTokens.length, 'active tokens for user');
    
    if (activeTokens.length === 0) {
      console.log('[Token Cleanup Service] No active tokens found, nothing to clean up');
      return;
    }
    
    // Find token to keep
    const tokenToKeep = findTokenToKeep(activeTokens, currentFingerprintHash);
    
    if (!tokenToKeep) {
      console.log('[Token Cleanup Service] No token to keep found, revoking all tokens');
      // Revoke all tokens if no good match found
      for (const token of activeTokens) {
        await pool.query(tokenQueries.revokeTokenById.text, [token.id]);
        console.log('[Token Cleanup Service] Revoked token:', token.id);
      }
      return;
    }
    
    // Revoke all tokens except the one to keep
    let revokedCount = 0;
    for (const token of activeTokens) {
      if (token.id !== tokenToKeep) {
        await pool.query(tokenQueries.revokeTokenById.text, [token.id]);
        console.log('[Token Cleanup Service] Revoked token:', token.id);
        revokedCount++;
      }
    }
    
    console.log('[Token Cleanup Service] Token cleanup completed. Revoked', revokedCount, 'tokens, kept 1 token');
    
  } catch (error) {
    console.error('[Token Cleanup Service] Error during token cleanup:', error);
    throw error;
  }
}

export default cleanupUserTokens; 