/**
 * @file types.pair.editor.ts
 * Version: 1.2.0
 * Type definitions for ProductPairEditor component and services
 * Frontend file - types.pair.editor.ts
 */

/**
 * Selected option from ProductEditorOptions table
 */
export interface SelectedOption {
  product_id: string
  product_code: string
  name?: string
  can_be_option: boolean
  option_only: boolean
  owner?: string
}

/**
 * Pair configuration for a single option
 */
export interface OptionPairConfig {
  optionId: string
  optionCode: string
  optionName: string
  isRequired: boolean
  iteration: number
}

/**
 * Props for ProductPairEditor component
 */
export interface ProductPairEditorProps {
  selectedOptions: SelectedOption[]
  productName: string
}

/**
 * Result emitted when pairing is completed
 */
export interface PairEditorResult {
  success: boolean
  pairConfigs: OptionPairConfig[]
  message?: string
}

/**
 * READ service request for existing pairs by main product and option ids
 */
export interface ReadPairsRequest {
  mainProductId: string
  optionProductIds: string[]
}

/**
 * Record returned for an existing pair
 */
export interface PairRecord {
  optionProductId: string
  isRequired: boolean
  unitsCount: number | null
  unitPrice?: number | null
}

/**
 * READ service response
 */
export interface ReadPairsResponse {
  success: boolean
  message?: string
  pairs: PairRecord[]
}

// CREATE service
export interface CreatePairsRequest {
  mainProductId: string
  pairs: Array<{ optionProductId: string; isRequired: boolean; unitsCount: number | null }>
}

export interface CreatePairsResponse {
  success: boolean
  createdCount: number
  created: string[]
  message?: string
}

// UPDATE service
export interface UpdatePairsRequest {
  mainProductId: string
  pairs: Array<{ optionProductId: string; isRequired: boolean; unitsCount: number | null }>
}

export interface UpdatePairsResponse {
  success: boolean
  updatedCount: number
  updated: string[]
  message?: string
}

