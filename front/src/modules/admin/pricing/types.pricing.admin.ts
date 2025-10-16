/**
 * @file types.pricing.admin.ts
 * Version: 1.0.0
 * Type definitions for pricing administration module.
 * Frontend types for pricing admin functionality.
 */

// Pricing section interface for menu navigation
export interface Section {
  id: PricingSectionId
  title: string
  icon: string
  visible?: boolean
}

// Pricing admin sections
export type PricingSectionId = 'price-lists' | 'settings'

// Pricing admin state interface
export interface PricingAdminState {
  activeSection: PricingSectionId
}

