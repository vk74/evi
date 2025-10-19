/**
 * version: 1.2.0
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
    roundingMode: 'half_up' | 'half_even' | 'cash_0_05' | 'cash_0_1'
    active: boolean
}

// Update payload types
export interface UpdateCurrenciesPayload {
    created?: CurrencyDto[]
    updated?: Array<Partial<CurrencyDto> & { code: string }>
    deleted?: string[] // codes
}

export interface UpdateCurrenciesResult {
    created: number
    updated: number
    deleted: number
}


