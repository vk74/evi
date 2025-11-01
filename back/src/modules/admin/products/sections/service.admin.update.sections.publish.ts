/**
 * service.admin.update.sections.publish.ts - version 1.2.0
 * Service for updating catalog sections publish bindings for a product using delta changes.
 * Processes only sectionsToAdd and sectionsToRemove arrays sent from frontend.
 * Tracks publisher via published_by column and timestamp via published_at column.
 * Handles database transactions and error management.
 * 
 * Backend file - service.admin.update.sections.publish.ts
 * 
 * Changes in v1.2.0:
 * - Changed from full replacement to delta-based updates
 * - Added published_by tracking using getRequestorUuidFromReq helper
 * - Frontend now sends only sectionsToAdd and sectionsToRemove arrays
 * - Removed logic that reads current bindings and calculates deltas
 */

import { Request } from 'express'
import { Pool } from 'pg'
import { pool as defaultPool } from '@/core/db/maindb'
import { queries } from '../queries.admin.products'
import type { UpdateProductSectionsPublishRequest, UpdateProductSectionsPublishResponse, ProductError } from '../types.admin.products'
import { createAndPublishEvent } from '@/core/eventBus/fabric.events'
import { PRODUCT_CATALOG_PUBLICATION_UPDATE_EVENTS } from '../events.admin.products'
import { getRequestorUuidFromReq } from '@/core/helpers/get.requestor.uuid.from.req'

const pgPool: Pool = (defaultPool as unknown as Pool)

/**
 * Updates product sections publish bindings using delta arrays
 * @param req - Express Request object containing productId, sectionsToAdd, and sectionsToRemove
 * @returns Promise with update result
 */
export async function updateSectionsPublish(req: Request): Promise<UpdateProductSectionsPublishResponse> {
  const body = req.body as UpdateProductSectionsPublishRequest
  const productId = body?.productId
  const sectionsToAdd = Array.isArray(body?.sectionsToAdd) ? body.sectionsToAdd : []
  const sectionsToRemove = Array.isArray(body?.sectionsToRemove) ? body.sectionsToRemove : []

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

    // Extract user UUID from request
    const publisherId = getRequestorUuidFromReq(req)
    if (!publisherId) {
      const err: ProductError = { code: 'UNAUTHORIZED', message: 'User authentication required for publication' }
      throw err
    }

    // Check product exists and get product code
    const productExists = await pgPool.query('SELECT product_code FROM app.products WHERE product_id = $1', [productId])
    if (productExists.rowCount === 0) {
      const err: ProductError = { code: 'NOT_FOUND', message: 'Product not found' }
      throw err
    }
    const productCode = productExists.rows[0].product_code

    const client = await pgPool.connect()
    try {
      await client.query('BEGIN')

      // Validate and process sections to remove
      if (sectionsToRemove.length > 0) {
        const removedSectionsRes = await client.query('SELECT id, name FROM app.catalog_sections WHERE id = ANY($1)', [sectionsToRemove])
        const existingRemovedSet = new Set<string>(removedSectionsRes.rows.map((r: any) => r.id))
        const invalidRemoved = sectionsToRemove.filter(id => !existingRemovedSet.has(id))
        
        if (invalidRemoved.length > 0) {
          const err: ProductError = { 
            code: 'VALIDATION_ERROR', 
            message: 'Some sectionsToRemove do not exist', 
            details: { invalidSectionIds: invalidRemoved } 
          }
          throw err
        }

        const removedSectionNames = removedSectionsRes.rows.map((r: any) => r.name)

        for (const sectionId of sectionsToRemove) {
          await client.query(queries.deleteProductFromSection, [productId, sectionId])
        }

        await createAndPublishEvent({
          eventName: PRODUCT_CATALOG_PUBLICATION_UPDATE_EVENTS.UNPUBLISHED_FROM_CATALOG.eventName,
          req: req,
          payload: { 
            productId,
            productCode, 
            removedSectionsCount: sectionsToRemove.length,
            removedSectionIds: sectionsToRemove,
            removedSectionNames
          }
        });
      }

      // Validate and process sections to add
      if (sectionsToAdd.length > 0) {
        const addedSectionsRes = await client.query('SELECT id, name FROM app.catalog_sections WHERE id = ANY($1)', [sectionsToAdd])
        const existingAddedSet = new Set<string>(addedSectionsRes.rows.map((r: any) => r.id))
        const invalidAdded = sectionsToAdd.filter(id => !existingAddedSet.has(id))
        
        if (invalidAdded.length > 0) {
          const err: ProductError = { 
            code: 'VALIDATION_ERROR', 
            message: 'Some sectionsToAdd do not exist', 
            details: { invalidSectionIds: invalidAdded } 
          }
          throw err
        }

        const addedSectionNames = addedSectionsRes.rows.map((r: any) => r.name)

        for (const sectionId of sectionsToAdd) {
          await client.query(queries.insertSectionProduct, [sectionId, productId, publisherId])
        }

        await createAndPublishEvent({
          eventName: PRODUCT_CATALOG_PUBLICATION_UPDATE_EVENTS.PUBLISHED_TO_CATALOG.eventName,
          req: req,
          payload: { 
            productId,
            productCode, 
            addedSectionsCount: sectionsToAdd.length,
            addedSectionIds: sectionsToAdd,
            addedSectionNames
          }
        });
      }

      // Update product is_published status based on section_products relationships
      await client.query(queries.updateProductIsPublished, [productId])

      await client.query('COMMIT')

      // Get final section count
      const finalRes = await client.query('SELECT COUNT(*) as count FROM app.section_products WHERE product_id = $1', [productId])
      const totalSectionsCount = parseInt(finalRes.rows[0].count)

      await createAndPublishEvent({
        eventName: PRODUCT_CATALOG_PUBLICATION_UPDATE_EVENTS.SUCCESS.eventName,
        req: req,
        payload: { 
          productId,
          productCode, 
          addedCount: sectionsToAdd.length,
          removedCount: sectionsToRemove.length,
          totalSectionsCount
        }
      });

      const response: UpdateProductSectionsPublishResponse = {
        success: true,
        message: 'Product sections publish mappings updated',
        updatedCount: sectionsToAdd.length + sectionsToRemove.length,
        addedCount: sectionsToAdd.length,
        removedCount: sectionsToRemove.length
      }
      return response
    } catch (e: any) {
      await client.query('ROLLBACK')
      const errorMessage = e instanceof Error ? e.message : 'Failed to update product sections publish';
      
      const productCode = productId ? (await pgPool.query('SELECT product_code FROM app.products WHERE product_id = $1', [productId]).then(r => r.rows[0]?.product_code || null).catch(() => null)) : null

      await createAndPublishEvent({
        eventName: PRODUCT_CATALOG_PUBLICATION_UPDATE_EVENTS.ERROR.eventName,
        req: req,
        payload: { 
          productId: productId || null,
          productCode,
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
    
    const productCode = productId ? (await pgPool.query('SELECT product_code FROM app.products WHERE product_id = $1', [productId]).then(r => r.rows[0]?.product_code || null).catch(() => null)) : null
    
    await createAndPublishEvent({
      eventName: PRODUCT_CATALOG_PUBLICATION_UPDATE_EVENTS.ERROR.eventName,
      req: req,
      payload: { 
        productId: productId || null,
        productCode,
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
