/**
 * color.helpers.ts
 * version: 1.0.0
 * Frontend file
 * Purpose: Helper functions for color manipulation and conversion
 */

/**
 * Converts HEX color to RGB format
 * @param hex - HEX color string (e.g., "#E8F4F8")
 * @returns RGB string (e.g., "rgb(232, 244, 248)")
 */
export function getRgbFromHex(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (result) {
    const r = parseInt(result[1], 16)
    const g = parseInt(result[2], 16)
    const b = parseInt(result[3], 16)
    return `rgb(${r}, ${g}, ${b})`
  }
  return 'rgb(0, 0, 0)'
}

