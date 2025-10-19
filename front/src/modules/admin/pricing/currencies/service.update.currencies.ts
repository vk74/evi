/**
 * Version: 1.0.0
 * Service for updating currencies (diff-based) in pricing admin module.
 * Frontend file that sends created/updated/deleted changes to backend.
 * Filename: service.update.currencies.ts (frontend)
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
  const response = await api.post<UpdateResponse>('/api/admin/pricing/update-currencies', payload)
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Failed to update currencies')
  }
  return response.data.data
}


