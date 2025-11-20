/**
 * service.admin.product.unpublish.ts
 * Version: 1.0.0
 * Description: Service to unpublish products from catalog sections
 * Purpose: Removes product-section mappings from app.section_products for given product_ids and section_ids
 * Backend file - service.admin.product.unpublish.ts
 */

import { Request } from 'express'
import { Pool } from 'pg'
import { pool as defaultPool } from '@/core/db/maindb'
import { createAndPublishEvent } from '@/core/eventBus/fabric.events'
import { EVENTS_ADMIN_CATALOG } from './events.admin.catalog'
import { queries } from './queries.admin.catalog'

const pgPool: Pool = (defaultPool as unknown as Pool)

export interface ProductUnpublishRequest {
  product_ids: string[]
  section_ids: string[]
}

export interface ProductUnpublishResponse {
  success: boolean
  message: string
  removedCount: number
}

export async function productUnpublish(req: Request): Promise<ProductUnpublishResponse> {
  const productIds: string[] = Array.isArray(req.body?.product_ids) ? req.body.product_ids : []
  const sectionIds: string[] = Array.isArray(req.body?.section_ids) ? req.body.section_ids : []

  if (!productIds || productIds.length === 0) {
    return { success: false, message: 'product_ids is required and must not be empty', removedCount: 0 }
  }

  if (!sectionIds || sectionIds.length === 0) {
    return { success: false, message: 'section_ids is required and must not be empty', removedCount: 0 }
  }

  const client = await pgPool.connect()
  try {
    await client.query('BEGIN')

    // Validate products exist
    const productsCheck = await client.query(queries.checkProductsExist, [productIds])
    const existingProductIds = new Set<string>(productsCheck.rows.map((r: any) => r.product_id))
    const invalidProducts = productIds.filter(id => !existingProductIds.has(id))
    
    if (invalidProducts.length > 0) {
      await client.query('ROLLBACK')
      return { success: false, message: `Some products do not exist: ${invalidProducts.join(', ')}`, removedCount: 0 }
    }

    // Validate sections exist
    const sectionsCheck = await client.query(queries.checkMultipleSectionsExist, [sectionIds])
    const existingSectionIds = new Set<string>(sectionsCheck.rows.map((r: any) => r.id))
    const invalidSections = sectionIds.filter(id => !existingSectionIds.has(id))
    
    if (invalidSections.length > 0) {
      await client.query('ROLLBACK')
      return { success: false, message: `Some sections do not exist: ${invalidSections.join(', ')}`, removedCount: 0 }
    }

    let removedCount = 0
    const unpublishedMappings: Array<{ productId: string; sectionId: string }> = []

    // Delete mappings
    for (const productId of productIds) {
      for (const sectionId of sectionIds) {
        const deleteRes = await client.query(queries.deleteProductFromSection, [productId, sectionId])
        if (deleteRes.rowCount && deleteRes.rowCount > 0) {
          removedCount++
          unpublishedMappings.push({ productId, sectionId })
        }
      }
    }

    // Update product is_published flag for all affected products
    for (const productId of productIds) {
      await client.query(queries.updateProductIsPublished, [productId])
    }

    await client.query('COMMIT')

    // Fetch product and section names for detailed payload
    const productsRes = await client.query(
      'SELECT product_id, product_code FROM app.products WHERE product_id = ANY($1)',
      [productIds]
    )
    const sectionsRes = await client.query(
      'SELECT id, name FROM app.catalog_sections WHERE id = ANY($1)',
      [sectionIds]
    )

    const productsMap = new Map<string, string>()
    productsRes.rows.forEach((r: any) => {
      productsMap.set(r.product_id, r.product_code)
    })

    const sectionsMap = new Map<string, string>()
    sectionsRes.rows.forEach((r: any) => {
      sectionsMap.set(r.id, r.name)
    })

    const unpublishedMappingsDetailed = unpublishedMappings.map(m => ({
      productId: m.productId,
      productCode: productsMap.get(m.productId) || 'Unknown',
      sectionId: m.sectionId,
      sectionName: sectionsMap.get(m.sectionId) || 'Unknown'
    }))

    createAndPublishEvent({
      eventName: EVENTS_ADMIN_CATALOG['products.unpublish.success'].eventName,
      payload: {
        productIdsCount: productIds.length,
        sectionIdsCount: sectionIds.length,
        removedCount,
        products: Array.from(productsMap.entries()).map(([id, code]) => ({ id, code })),
        sections: Array.from(sectionsMap.entries()).map(([id, name]) => ({ id, name })),
        unpublishedMappings: unpublishedMappingsDetailed
      }
    })

    return { success: true, message: 'Products unpublished successfully', removedCount }
  } catch (e: any) {
    await client.query('ROLLBACK')

    createAndPublishEvent({
      eventName: EVENTS_ADMIN_CATALOG['products.unpublish.database_error'].eventName,
      payload: {
        productIdsCount: productIds.length,
        sectionIdsCount: sectionIds.length,
        productIds,
        sectionIds,
        error: e?.message || 'Failed to unpublish products'
      },
      errorData: e?.message || 'Failed to unpublish products'
    })

    throw { success: false, message: e?.message || 'Failed to unpublish products', removedCount: 0 }
  } finally {
    client.release()
  }
}

export default productUnpublish

