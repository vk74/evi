/**
 * @file types.pair.editor.ts
 * Version: 1.0.0
 * Type definitions for ProductPairEditor component
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

