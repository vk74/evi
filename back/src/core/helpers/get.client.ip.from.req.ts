/**
 * get.client.ip.from.req.ts - backend file
 * version: 1.0.0
 * Helper function to extract client IP address from Express request
 */

import { Request } from 'express';

/**
 * Get client IP address from Express request
 * Handles various scenarios including proxy headers, direct connections, and socket addresses
 * 
 * @param req Express request object
 * @returns Client IP address as string, 'unknown' if unable to determine
 */
export function getClientIp(req: Request): string {
  // Check X-Forwarded-For header (for proxied requests)
  const forwardedFor = req.headers['x-forwarded-for'] as string;
  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs separated by commas
    // The first one is the original client IP
    return forwardedFor.split(',')[0].trim();
  }
  
  // Check X-Real-IP header (alternative proxy header)
  const realIp = req.headers['x-real-ip'] as string;
  if (realIp) {
    return realIp.trim();
  }
  
  // Check connection remote address
  if (req.connection && req.connection.remoteAddress) {
    return req.connection.remoteAddress;
  }
  
  // Check socket remote address (fallback)
  if (req.socket && req.socket.remoteAddress) {
    return req.socket.remoteAddress;
  }
  
  // Check req.ip (Express built-in, when trust proxy is enabled)
  if (req.ip) {
    return req.ip;
  }
  
  // Unable to determine IP
  return 'unknown';
} 