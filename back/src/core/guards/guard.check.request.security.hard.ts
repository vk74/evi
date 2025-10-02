/**
 * version: 1.0.0
 * Backend file: guard.check.request.security.hard.ts
 * Purpose: Express guard that blocks requests matching hard security patterns.
 * Layer: Backend route guard (security)
 *
 * Hard patterns (minimal false positives):
 * - XSS script tags: /<script[^>]*>/i and /<\/script>/i
 * - JavaScript protocol: /javascript:/i
 * - Path traversal: ../ or ..\\
 * - Null byte: "\0" or "%00"
 * - Prototype pollution keys in JSON bodies: __proto__, prototype, constructor.prototype
 *
 * Logic:
 * - Scan req.path, req.params, req.query, and req.body (text/plain, json, urlencoded)
 * - For multipart or binary content-types, only scan params/query (skip body)
 * - Enforce budgets: max body scan size, max recursion depth, max string length checked
 * - On match -> 422 with neutral message; publish BLOCKED event; no PII in logs
 */

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, GuardFunction } from './types.guards';
import { createAndPublishEvent } from '@/core/eventBus/fabric.events';
import { REQUEST_SECURITY_GUARD_EVENTS } from './events.guards';

// ===== Configuration (MVP defaults) =====
const MAX_BODY_SCAN_BYTES = 256 * 1024; // align with express limits to avoid re-parsing
const MAX_RECURSION_DEPTH = 6;
const MAX_STRING_CHECK = 4096; // first N chars per string

// Precompiled hard-pattern regexes
const RX_SCRIPT_OPEN = /<script[^>]*>/i;
const RX_SCRIPT_CLOSE = /<\/script>/i;
const RX_JS_PROTOCOL = /javascript:/i;
const RX_PATH_TRAVERSAL = /\.\.\/?|\.\.\\/;
const RX_NULL_BYTE = /\u0000|%00/;

// Utility: safe slice string and test against regex
function testString(value: unknown): { matched: boolean; rule?: string } {
  if (typeof value !== 'string') return { matched: false };
  const s = value.length > MAX_STRING_CHECK ? value.slice(0, MAX_STRING_CHECK) : value;
  if (RX_SCRIPT_OPEN.test(s)) return { matched: true, rule: 'xss.script_open' };
  if (RX_SCRIPT_CLOSE.test(s)) return { matched: true, rule: 'xss.script_close' };
  if (RX_JS_PROTOCOL.test(s)) return { matched: true, rule: 'xss.javascript_protocol' };
  if (RX_PATH_TRAVERSAL.test(s)) return { matched: true, rule: 'path_traversal' };
  if (RX_NULL_BYTE.test(s)) return { matched: true, rule: 'null_byte' };
  return { matched: false };
}

// Utility: shallow scan of key names for prototype pollution vectors
function isPrototypePollutionKey(key: string): boolean {
  return key === '__proto__' || key === 'prototype' || key === 'constructor.prototype';
}

// Recursive scan with budgets
function scanValue(value: unknown, depth: number, bytesBudget: { remaining: number }): { matched: boolean; rule?: string; location?: string } {
  if (depth > MAX_RECURSION_DEPTH) return { matched: false };

  // Budget accounting for approximate size of visited value
  // For strings, subtract up to checked length; for objects/arrays, small constant
  if (typeof value === 'string') {
    const cost = Math.min(value.length, MAX_STRING_CHECK);
    bytesBudget.remaining -= cost;
  } else if (Array.isArray(value) || (value && typeof value === 'object')) {
    bytesBudget.remaining -= 64;
  } else {
    bytesBudget.remaining -= 8;
  }
  if (bytesBudget.remaining <= 0) return { matched: false };

  if (typeof value === 'string') {
    const r = testString(value);
    if (r.matched) return { matched: true, rule: r.rule };
    return { matched: false };
  }

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const r = scanValue(value[i], depth + 1, bytesBudget);
      if (r.matched) return { matched: true, rule: r.rule, location: `[${i}]` };
      if (bytesBudget.remaining <= 0) break;
    }
    return { matched: false };
  }

  if (value && typeof value === 'object') {
    for (const k of Object.keys(value as Record<string, unknown>)) {
      if (isPrototypePollutionKey(k)) {
        return { matched: true, rule: 'prototype_pollution_key', location: k };
      }
      const r = scanValue((value as Record<string, unknown>)[k], depth + 1, bytesBudget);
      if (r.matched) return { matched: true, rule: r.rule, location: k };
      if (bytesBudget.remaining <= 0) break;
    }
    return { matched: false };
  }

  return { matched: false };
}

// Scan helpers for different request parts
function scanPathAndQuery(req: AuthenticatedRequest): { matched: boolean; rule?: string; location?: string } {
  // path
  const p = testString(req.path);
  if (p.matched) return { matched: true, rule: p.rule, location: 'path' };

  // params
  for (const [k, v] of Object.entries(req.params || {})) {
    const r = testString(String(v));
    if (r.matched) return { matched: true, rule: r.rule, location: `params.${k}` };
  }

  // query
  for (const [k, v] of Object.entries(req.query || {})) {
    const val = Array.isArray(v) ? v.join(',') : String(v);
    const r = testString(val);
    if (r.matched) return { matched: true, rule: r.rule, location: `query.${k}` };
  }

  return { matched: false };
}

function isLikelyBinaryContent(contentType: string | undefined): boolean {
  if (!contentType) return false;
  const ct = contentType.toLowerCase();
  return ct.includes('multipart/form-data') || ct.includes('application/octet-stream');
}

const checkRequestSecurityHard: GuardFunction = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Always scan path/params/query first
    const pq = scanPathAndQuery(req);
    if (pq.matched) {
      await createAndPublishEvent({
        req,
        eventName: REQUEST_SECURITY_GUARD_EVENTS.BLOCKED.eventName,
        payload: {
          rule: pq.rule,
          location: pq.location,
          method: req.method,
          url: req.originalUrl,
          contentType: req.headers['content-type']
        }
      });
      res.status(422).json({ message: 'Request rejected by security policy' });
      return;
    }

    // Body scan only for non-binary content-types
    const contentType = req.headers['content-type'];
    if (!isLikelyBinaryContent(contentType)) {
      const body = req.body as unknown;
      if (body && (typeof body === 'string' || typeof body === 'object')) {
        const r = scanValue(body, 0, { remaining: MAX_BODY_SCAN_BYTES });
        if (r.matched) {
          await createAndPublishEvent({
            req,
            eventName: REQUEST_SECURITY_GUARD_EVENTS.BLOCKED.eventName,
            payload: {
              rule: r.rule,
              location: r.location || 'body',
              method: req.method,
              url: req.originalUrl,
              contentType
            }
          });
          res.status(422).json({ message: 'Request rejected by security policy' });
          return;
        }
      }
    }

    // Passed
    next();
  } catch (error) {
    await createAndPublishEvent({
      req,
      eventName: REQUEST_SECURITY_GUARD_EVENTS.ERROR.eventName,
      payload: {
        method: req.method,
        url: req.originalUrl
      },
      errorData: error instanceof Error ? error.message : String(error)
    });
    res.status(500).json({ message: 'Server error during security check' });
  }
};

export default checkRequestSecurityHard;


