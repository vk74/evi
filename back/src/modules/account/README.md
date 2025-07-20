# Authentication Module

## Overview
This module handles user authentication, token management, and session security. The system uses a dual-token approach with enhanced security measures.

## Security Architecture

### Token Strategy
- **Access Token**: JWT stored in localStorage (short-lived, 30 minutes)
- **Refresh Token**: UUID stored as httpOnly cookie (long-lived, 7 days)

### Security Benefits
1. **Separation of Concerns**: Access and refresh tokens are stored in different locations
2. **XSS Protection**: Refresh tokens in httpOnly cookies are inaccessible to JavaScript
3. **CSRF Protection**: SameSite=Strict prevents cross-site requests
4. **Automatic Rotation**: Refresh tokens are rotated on each use
5. **Environment-Aware**: Secure flag is set based on environment (false for localhost, true for HTTPS)

### Cookie Configuration
```typescript
const cookieConfig = {
  httpOnly: true,           // Prevents JavaScript access
  secure: isProduction,     // HTTPS only in production
  sameSite: 'strict',       // CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/'
}
```

## API Endpoints

### POST /api/auth/login
- **Request**: `{ username: string, password: string }`
- **Response**: `{ success: boolean, accessToken: string, user: { username, uuid } }`
- **Cookies**: Sets `refreshToken` as httpOnly cookie

### POST /api/auth/refresh
- **Request**: `{}` (refresh token sent automatically as cookie)
- **Response**: `{ success: boolean, accessToken: string }`
- **Cookies**: Updates `refreshToken` httpOnly cookie

### POST /api/auth/logout
- **Request**: `{}` (refresh token sent automatically as cookie)
- **Response**: `{ success: boolean, message: string }`
- **Cookies**: Clears `refreshToken` httpOnly cookie

## Additional Security Measures

### 1. Brute Force Protection
- Rate limiting per IP address
- Temporary blocking after 5 failed attempts
- 15-minute window for reset

### 2. Token Validation
- Database-stored refresh tokens with hashing
- Automatic token rotation on refresh
- Expiration checking

### 3. Environment Configuration
- Development: `secure: false` (localhost)
- Production: `secure: true` (HTTPS required)

## Browser Compatibility
- Chrome 80+ (2020)
- Firefox 75+ (2020)
- Safari 13+ (2019)
- Edge 80+ (2020)

## Migration Notes
- Backward compatibility maintained for existing clients
- Fallback to request body for refresh token if cookie not available
- Automatic cleanup of old localStorage refresh tokens

## Future Enhancements
1. **Redis Integration**: Replace in-memory brute force storage
2. **Device Fingerprinting**: Track suspicious login patterns
3. **Geolocation Validation**: Block logins from unexpected locations
4. **Multi-Factor Authentication**: Add 2FA support
5. **Session Management**: Allow multiple concurrent sessions 