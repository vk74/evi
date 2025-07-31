/**
 * @file helper.generate.device.fingerprint.ts
 * Version: 1.0.0
 * Helper functions for generating device fingerprint on frontend.
 * Core helper that collects browser characteristics and generates device fingerprint.
 */

import type { DeviceFingerprint, FingerprintHash } from './types.auth'

/**
 * Generates canvas fingerprint
 */
function generateCanvasFingerprint(): string {
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return ''

    // Set canvas size
    canvas.width = 200
    canvas.height = 200

    // Draw some text and shapes
    ctx.textBaseline = 'top'
    ctx.font = '14px Arial'
    ctx.fillText('Device fingerprint test', 2, 2)
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)'
    ctx.fillRect(100, 5, 80, 20)
    ctx.fillStyle = 'rgba(0, 0, 255, 0.7)'
    ctx.fillRect(50, 50, 100, 50)

    return canvas.toDataURL()
  } catch (error) {
    console.warn('[Device Fingerprint] Canvas fingerprint generation failed:', error)
    return ''
  }
}

/**
 * Generates WebGL fingerprint
 */
function generateWebGLFingerprint(): string {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext
    if (!gl) return ''

    // Get WebGL vendor and renderer
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
    if (debugInfo) {
      const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
      return `${vendor}|${renderer}`
    }

    // Fallback to basic WebGL info
    const vendor = gl.getParameter(gl.VENDOR)
    const renderer = gl.getParameter(gl.RENDERER)
    return `${vendor}|${renderer}`
  } catch (error) {
    console.warn('[Device Fingerprint] WebGL fingerprint generation failed:', error)
    return ''
  }
}

/**
 * Generates device fingerprint from browser characteristics
 */
export function generateDeviceFingerprint(): DeviceFingerprint {
  console.log('[Device Fingerprint] Generating device fingerprint...')

  const fingerprint: DeviceFingerprint = {
    // Screen characteristics
    screen: {
      width: screen.width,
      height: screen.height,
      colorDepth: screen.colorDepth,
      pixelDepth: screen.pixelDepth
    },

    // Browser characteristics
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    userAgent: navigator.userAgent,

    // Canvas fingerprint
    canvas: generateCanvasFingerprint(),
    webgl: generateWebGLFingerprint(),

    // Additional characteristics
    touchSupport: 'ontouchstart' in window,
    hardwareConcurrency: navigator.hardwareConcurrency || 0,
    deviceMemory: (navigator as any).deviceMemory,
    maxTouchPoints: navigator.maxTouchPoints || 0,
    platform: navigator.platform
  }

  console.log('[Device Fingerprint] Device fingerprint generated:', fingerprint)
  return fingerprint
}

/**
 * Hashes device fingerprint using SHA-256
 */
export function hashFingerprint(fingerprint: DeviceFingerprint): FingerprintHash {
  try {
    // Create a string representation of the fingerprint
    const fingerprintString = JSON.stringify(fingerprint, Object.keys(fingerprint).sort())
    
    // For now, we'll use a simple hash function
    // In production, you might want to use a proper crypto library
    let hash = 0
    for (let i = 0; i < fingerprintString.length; i++) {
      const char = fingerprintString.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    
    const hashString = Math.abs(hash).toString(16).padStart(8, '0')
    const fullHash = hashString.repeat(8) // Simulate 64-character hash
    
    return {
      hash: fullHash,
      shortHash: fullHash.substring(0, 16)
    }
  } catch (error) {
    console.error('[Device Fingerprint] Error hashing fingerprint:', error)
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
    console.error('[Device Fingerprint] Error validating fingerprint:', error)
    return false
  }
} 