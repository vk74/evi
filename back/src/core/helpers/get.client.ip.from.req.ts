/**
 * get.client.ip.from.req.ts - backend file
 * version: 1.0.0
 * Helper function to extract client IP address from Express request
 */

import { Request } from 'express';
import { createAndPublishEvent } from '../eventBus/fabric.events';
import { GET_CLIENT_IP_EVENTS } from './events.helpers';

/**
 * Get client IP address from Express request
 * Handles various scenarios including proxy headers, direct connections, and socket addresses
 * 
 * @param req Express request object
 * @returns Client IP address as string, 'unknown' if unable to determine
 */
export async function getClientIp(req: Request): Promise<string> {
  // Log start of IP extraction
  await createAndPublishEvent({
    eventName: GET_CLIENT_IP_EVENTS.START.eventName,
    payload: { method: 'extraction' }
  });

  // Check X-Forwarded-For header (for proxied requests)
  const forwardedFor = req.headers['x-forwarded-for'] as string;
  if (forwardedFor) {
    const ip = forwardedFor.split(',')[0].trim();
    await createAndPublishEvent({
      eventName: GET_CLIENT_IP_EVENTS.SUCCESS.eventName,
      payload: { ip, method: 'x-forwarded-for' }
    });
    return ip;
  }
  
  // Check X-Real-IP header (alternative proxy header)
  const realIp = req.headers['x-real-ip'] as string;
  if (realIp) {
    const ip = realIp.trim();
    await createAndPublishEvent({
      eventName: GET_CLIENT_IP_EVENTS.SUCCESS.eventName,
      payload: { ip, method: 'x-real-ip' }
    });
    return ip;
  }
  
  // Check connection remote address
  if (req.connection && req.connection.remoteAddress) {
    const ip = req.connection.remoteAddress;
    await createAndPublishEvent({
      eventName: GET_CLIENT_IP_EVENTS.FALLBACK.eventName,
      payload: { ip, method: 'connection.remoteAddress', fallbackMethod: 'connection' }
    });
    return ip;
  }
  
  // Check socket remote address (fallback)
  if (req.socket && req.socket.remoteAddress) {
    const ip = req.socket.remoteAddress;
    await createAndPublishEvent({
      eventName: GET_CLIENT_IP_EVENTS.FALLBACK.eventName,
      payload: { ip, method: 'socket.remoteAddress', fallbackMethod: 'socket' }
    });
    return ip;
  }
  
  // Check req.ip (Express built-in, when trust proxy is enabled)
  if (req.ip) {
    const ip = req.ip;
    await createAndPublishEvent({
      eventName: GET_CLIENT_IP_EVENTS.FALLBACK.eventName,
      payload: { ip, method: 'req.ip', fallbackMethod: 'express' }
    });
    return ip;
  }
  
  // Unable to determine IP
  await createAndPublishEvent({
    eventName: GET_CLIENT_IP_EVENTS.UNKNOWN.eventName,
    payload: { attemptedMethods: ['x-forwarded-for', 'x-real-ip', 'connection.remoteAddress', 'socket.remoteAddress', 'req.ip'] }
  });
  return 'unknown';
} 