/**
 * service.admin.update.sections.publish.ts - version 1.0.3
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
import { createAndPublishEvent } from '@/core/eventBus/fabric.events'
import { PRODUCT_CATALOG_PUBLICATION_UPDATE_EVENTS } from '../events.admin.products'

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
    await createAndPublishEvent({
      eventName: PRODUCT_CATALOG_PUBLICATION_UPDATE_EVENTS.STARTED.eventName,
      req: req,
      payload: { 
        productId: productId || null,
        targetSectionIdsCount: targetSectionIds.length,
        targetSectionIds: targetSectionIds
      }
    });

    await createAndPublishEvent({
      eventName: PRODUCT_CATALOG_PUBLICATION_UPDATE_EVENTS.VALIDATION_STARTED.eventName,
      req: req,
      payload: { productId: productId || null }
    });

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

    await createAndPublishEvent({
      eventName: PRODUCT_CATALOG_PUBLICATION_UPDATE_EVENTS.DATABASE_UPDATE_STARTED.eventName,
      req: req,
      payload: { productId }
    });

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
      if (toRemove.length > 0) {
        for (const sectionId of toRemove) {
          await client.query(queries.deleteProductFromSection, [productId, sectionId])
        }
        await createAndPublishEvent({
          eventName: PRODUCT_CATALOG_PUBLICATION_UPDATE_EVENTS.UNPUBLISHED_FROM_CATALOG.eventName,
          req: req,
          payload: { 
            productId, 
            removedSectionsCount: toRemove.length,
            removedSectionIds: toRemove
          }
        });
      }

      // Add mappings
      if (toAdd.length > 0) {
        for (const sectionId of toAdd) {
          await client.query(queries.insertSectionProduct, [sectionId, productId])
        }
        await createAndPublishEvent({
          eventName: PRODUCT_CATALOG_PUBLICATION_UPDATE_EVENTS.PUBLISHED_TO_CATALOG.eventName,
          req: req,
          payload: { 
            productId, 
            addedSectionsCount: toAdd.length,
            addedSectionIds: toAdd
          }
        });
      }

      // Update product is_published status based on section_products relationships
      await client.query(queries.updateProductIsPublished, [productId])

      await client.query('COMMIT')

      await createAndPublishEvent({
        eventName: PRODUCT_CATALOG_PUBLICATION_UPDATE_EVENTS.SUCCESS.eventName,
        req: req,
        payload: { 
          productId, 
          updatedCount: toAdd.length + toRemove.length,
          addedCount: toAdd.length,
          removedCount: toRemove.length
        }
      });

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
      const errorMessage = e instanceof Error ? e.message : 'Failed to update product sections publish';
      
      await createAndPublishEvent({
        eventName: PRODUCT_CATALOG_PUBLICATION_UPDATE_EVENTS.ERROR.eventName,
        req: req,
        payload: { 
          productId: productId || null,
          error: errorMessage
        },
        errorData: errorMessage
      });

      const err: ProductError = { 
        code: 'INTERNAL_SERVER_ERROR', 
        message: errorMessage, 
        details: e instanceof Error ? { stack: e.stack } : undefined 
      }
      throw err
    } finally {
      client.release()
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unexpected error';
    
    await createAndPublishEvent({
      eventName: PRODUCT_CATALOG_PUBLICATION_UPDATE_EVENTS.ERROR.eventName,
      req: req,
      payload: { 
        productId: productId || null,
        error: errorMessage
      },
      errorData: errorMessage
    });

    if ((error as any).code) {
      throw error
    }
    const err: ProductError = { 
      code: 'INTERNAL_SERVER_ERROR', 
      message: errorMessage, 
      details: error instanceof Error ? { stack: error.stack } : undefined 
    }
    throw err
  }
}

export default updateSectionsPublish
