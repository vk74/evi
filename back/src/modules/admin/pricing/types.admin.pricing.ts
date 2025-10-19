/**
 * version: 1.0.0
 * Backend types for pricing administration module.
 * Defines DTOs for currencies and other pricing-related entities.
 * File: types.admin.pricing.ts (backend)
 */

// Currency DTO aligned with frontend Currency type
export interface CurrencyDto {
    code: string
    name: string
    symbol: string | null
    minorUnits: number
    roundingMode: 'up' | 'down' | 'half-up' | 'half-even'
    active: boolean
}


