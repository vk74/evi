/**
 * service.admin.update.sections.publish.ts - version 1.0.1
 * Service for updating (replacing) catalog sections publish bindings for a product in one transaction.
 * 
 * Applies full replacement of app.section_products mappings for given product_id;
 * supports unpublish (empty list). Handles database transactions and error management.
 * 
 * Backend file - service.admin.update.sections.publish.ts
 */

import { Request } from 'express'
import { Pool } from 'pg'
import { pool as defaultPool } from '@/core/db/maindb'
import { queries } from '../queries.admin.products'
import type { UpdateProductSectionsPublishRequest, UpdateProductSectionsPublishResponse, ProductError } from '../types.admin.products'

const pgPool: Pool = (defaultPool as unknown as Pool)

/**
 * Updates product sections publish bindings
 * @param req - Express Request object containing productId and sectionIds
 * @returns Promise with update result
 */
export async function updateSectionsPublish(req: Request): Promise<UpdateProductSectionsPublishResponse> {
  const body = req.body as UpdateProductSectionsPublishRequest
  const productId = body?.productId
  const targetSectionIds = Array.isArray(body?.sectionIds) ? body.sectionIds : []

  try {
    // Basic validation
    if (!productId || typeof productId !== 'string') {
      const err: ProductError = { code: 'INVALID_REQUEST', message: 'productId is required' }
      throw err
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(productId)) {
      const err: ProductError = { code: 'VALIDATION_ERROR', message: 'Invalid productId format. Must be a valid UUID.' }
      throw err
    }

    // Check product exists
    const productExists = await pgPool.query(queries.checkProductExists, [productId])
    if (productExists.rowCount === 0) {
      const err: ProductError = { code: 'NOT_FOUND', message: 'Product not found' }
      throw err
    }

    // Validate sections (if provided)
    if (targetSectionIds.length > 0) {
      const sectionsRes = await pgPool.query(queries.checkSectionsExist, [targetSectionIds])
      const existingSet = new Set<string>(sectionsRes.rows.map((r: any) => r.id))
      const invalid = targetSectionIds.filter(id => !existingSet.has(id))
      if (invalid.length > 0) {
        const err: ProductError = { 
          code: 'VALIDATION_ERROR', 
          message: 'Some sectionIds do not exist', 
          details: { invalidSectionIds: invalid } 
        }
        throw err
      }
    }

    const client = await pgPool.connect()
    try {
      await client.query('BEGIN')

      // Read current bindings
      const currentRes = await client.query(queries.fetchProductSectionIds, [productId])
      const current = new Set<string>(currentRes.rows.map((r: any) => r.section_id))
      const target = new Set<string>(targetSectionIds)

      const toRemove = [...current].filter(id => !target.has(id))
      const toAdd = [...target].filter(id => !current.has(id))

      // Remove mappings
      for (const sectionId of toRemove) {
        await client.query(queries.deleteProductFromSection, [productId, sectionId])
      }

      // Add mappings
      for (const sectionId of toAdd) {
        await client.query(queries.insertSectionProduct, [sectionId, productId])
      }

      await client.query('COMMIT')

      const response: UpdateProductSectionsPublishResponse = {
        success: true,
        message: 'Product sections publish mappings updated',
        updatedCount: toAdd.length + toRemove.length,
        addedCount: toAdd.length,
        removedCount: toRemove.length
      }
      return response
    } catch (e: any) {
      await client.query('ROLLBACK')
      const err: ProductError = { 
        code: 'INTERNAL_SERVER_ERROR', 
        message: 'Failed to update product sections publish', 
        details: e instanceof Error ? { stack: e.stack } : undefined 
      }
      throw err
    } finally {
      client.release()
    }
  } catch (error) {
    if ((error as any).code) {
      throw error
    }
    const err: ProductError = { 
      code: 'INTERNAL_SERVER_ERROR', 
      message: 'Unexpected error', 
      details: error instanceof Error ? { stack: error.stack } : undefined 
    }
    throw err
  }
}

export default updateSectionsPublish
