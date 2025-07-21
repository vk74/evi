/**
 * @file queries.auth.ts
 * Version: 1.1.0
 * Predefined SQL queries for authentication system working with app.tokens table.
 * Backend file that provides secure database operations for token management.
 * Updated to support device fingerprinting and renamed issued_at column.
 */

// ==================== TOKEN CREATION QUERIES ====================

/**
 * Insert new refresh token into database with device fingerprint
 */
export const insertRefreshToken = {
  text: `
    INSERT INTO app.tokens (user_uuid, token_hash, expires_at, device_fingerprint_hash)
    VALUES ($1, $2, $3, $4)
    RETURNING id, user_uuid, token_hash, issued_at, expires_at, revoked, device_fingerprint_hash
  `,
  values: ['userUuid', 'tokenHash', 'expiresAt', 'deviceFingerprintHash']
};

// ==================== TOKEN VALIDATION QUERIES ====================

/**
 * Find active refresh token by hash with device fingerprint validation
 */
export const findTokenByHash = {
  text: `
    SELECT id, user_uuid, token_hash, issued_at, expires_at, revoked, device_fingerprint_hash
    FROM app.tokens
    WHERE token_hash = $1 AND revoked = false AND expires_at > NOW()
  `,
  values: ['tokenHash']
};

/**
 * Find token by hash (including revoked tokens)
 */
export const findTokenByHashIncludeRevoked = {
  text: `
    SELECT id, user_uuid, token_hash, issued_at, expires_at, revoked, device_fingerprint_hash
    FROM app.tokens
    WHERE token_hash = $1
  `,
  values: ['tokenHash']
};

/**
 * Validate token with device fingerprint
 */
export const validateToken = {
  text: `
    SELECT id, user_uuid, token_hash, issued_at, expires_at, revoked, device_fingerprint_hash
    FROM app.tokens
    WHERE token_hash = $1 AND revoked = false AND expires_at > NOW()
  `,
  values: ['tokenHash']
};

// ==================== TOKEN REVOCATION QUERIES ====================

/**
 * Revoke specific token by hash
 */
export const revokeTokenByHash = {
  text: `
    UPDATE app.tokens
    SET revoked = true
    WHERE token_hash = $1
    RETURNING id, user_uuid, token_hash, issued_at, expires_at, revoked, device_fingerprint_hash
  `,
  values: ['tokenHash']
};

/**
 * Revoke all tokens for specific user
 */
export const revokeAllUserTokens = {
  text: `
    UPDATE app.tokens
    SET revoked = true
    WHERE user_uuid = $1 AND revoked = false
    RETURNING id, user_uuid, token_hash, issued_at, expires_at, revoked, device_fingerprint_hash
  `,
  values: ['userUuid']
};

// ==================== TOKEN CLEANUP QUERIES ====================

/**
 * Delete expired tokens
 */
export const deleteExpiredTokens = {
  text: `
    DELETE FROM app.tokens
    WHERE expires_at < NOW()
  `,
  values: []
};

/**
 * Delete revoked tokens older than specified days
 */
export const deleteOldRevokedTokens = {
  text: `
    DELETE FROM app.tokens
    WHERE revoked = true AND issued_at < NOW() - INTERVAL '$1 days'
  `,
  values: ['daysOld']
};

// ==================== TOKEN STATISTICS QUERIES ====================

/**
 * Count active tokens for user
 */
export const countActiveTokensForUser = {
  text: `
    SELECT COUNT(*) as token_count
    FROM app.tokens
    WHERE user_uuid = $1 AND revoked = false AND expires_at > NOW()
  `,
  values: ['userUuid']
};

/**
 * Get all active tokens for user
 */
export const getActiveTokensForUser = {
  text: `
    SELECT id, user_uuid, token_hash, issued_at, expires_at, revoked, device_fingerprint_hash
    FROM app.tokens
    WHERE user_uuid = $1 AND revoked = false AND expires_at > NOW()
    ORDER BY issued_at DESC
  `,
  values: ['userUuid']
};

// ==================== TOKEN UPDATE QUERIES ====================

/**
 * Update token expiration time
 */
export const updateTokenExpiration = {
  text: `
    UPDATE app.tokens
    SET expires_at = $2
    WHERE token_hash = $1
    RETURNING id, user_uuid, token_hash, issued_at, expires_at, revoked, device_fingerprint_hash
  `,
  values: ['tokenHash', 'newExpiresAt']
};

/**
 * Update token with new device fingerprint
 */
export const updateToken = {
  text: `
    UPDATE app.tokens
    SET device_fingerprint_hash = $2, expires_at = $3
    WHERE token_hash = $1
    RETURNING id, user_uuid, token_hash, issued_at, expires_at, revoked, device_fingerprint_hash
  `,
  values: ['tokenHash', 'deviceFingerprintHash', 'newExpiresAt']
}; 