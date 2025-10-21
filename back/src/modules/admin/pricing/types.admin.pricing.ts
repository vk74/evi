/**
 * version: 1.2.1
 * Backend types for pricing administration module.
 * Defines DTOs for currencies and other pricing-related entities.
 * File: types.admin.pricing.ts (backend)
 */

// Currency DTO aligned with frontend Currency type
export interface CurrencyDto {
    code: string
    name: string
    symbol: string | null
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


