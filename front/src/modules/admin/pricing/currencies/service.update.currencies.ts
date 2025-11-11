/**
 * Version: 1.0.1
 * Service for updating currencies (diff-based) in pricing admin module.
 * Frontend file that sends created/updated/deleted changes to backend.
 * Filename: service.update.currencies.ts (frontend)
 * 
 * Changes in v1.0.1:
 * - Maps roundingPrecision to backend rounding_precision field for create/update payloads
 */

import { api } from '@/core/api/service.axios'
import type { Currency } from '../types.pricing.admin'

export interface UpdateCurrenciesPayload {
  created?: Currency[]
  updated?: Array<Partial<Currency> & { code: string }>
  deleted?: string[]
}

interface UpdateResponse {
  success: boolean
  data?: { created: number, updated: number, deleted: number }
  error?: string
}

export async function updateCurrenciesService(payload: UpdateCurrenciesPayload): Promise<{ created: number, updated: number, deleted: number }>{
  const requestPayload = {
    created: payload.created?.map(currency => ({
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
      active: currency.active,
      rounding_precision: currency.roundingPrecision
    })),
    updated: payload.updated?.map(update => {
      const mapped: Record<string, unknown> & { code: string } = { code: update.code }
      if (update.name !== undefined) mapped.name = update.name
      if (update.symbol !== undefined) mapped.symbol = update.symbol
      if (update.active !== undefined) mapped.active = update.active
      if (update.roundingPrecision !== undefined) mapped.rounding_precision = update.roundingPrecision
      return mapped
    }),
    deleted: payload.deleted
  }

  const response = await api.post<UpdateResponse>('/api/admin/pricing/update-currencies', requestPayload)
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Failed to update currencies')
  }
  return response.data.data
}


