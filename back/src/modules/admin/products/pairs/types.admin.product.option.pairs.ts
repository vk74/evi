/**
 * File: types.admin.product.option.pairs.ts
 * Version: 1.1.0
 * Description: Backend types and interfaces for product-option pairs endpoints.
 * Purpose: Defines contracts for controllers and services of pairs read/create/update.
 * Backend file - types.admin.product.option.pairs.ts
 */

import { Request } from 'express'

export type ReadPairsMode = 'records' | 'ids' | 'exists'

export interface ReadPairsRequestBody {
  mainProductId: string
  optionProductIds?: string[]
  mode?: ReadPairsMode
}

export interface PairDbRecord {
  option_product_id: string
  is_required: boolean
  units_count: number | null
}

export interface ReadPairsResult {
  success: boolean
  pairs?: Array<{
    optionProductId: string
    isRequired: boolean
    unitsCount: number | null
    unitPrice?: number | null
  }>
  optionProductIds?: string[]
  existsMap?: Record<string, boolean>
  message?: string
}

export interface CreateOrUpdatePairInput {
  optionProductId: string
  isRequired: boolean
  unitsCount: number | null
}

export interface CreatePairsRequestBody {
  mainProductId: string
  pairs: CreateOrUpdatePairInput[]
}

export interface UpdatePairsRequestBody {
  mainProductId: string
  pairs: CreateOrUpdatePairInput[]
}

export interface CreatePairsResult {
  success: boolean
  createdCount: number
  created: string[]
}

export interface UpdatePairsResult {
  success: boolean
  updatedCount: number
  updated: string[]
}

export type PairsServiceRequest = Request

export interface PairsServiceError {
  code: 'VALIDATION_ERROR' | 'CONFLICT' | 'NOT_FOUND' | 'DB_ERROR'
  message: string
  details?: unknown
}


