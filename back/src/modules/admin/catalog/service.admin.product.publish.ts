/**
 * service.admin.product.publish.ts
 * Version: 1.0.0
 * Description: Service to publish products to catalog sections
 * Purpose: Adds product-section mappings to app.section_products for given product_ids and section_ids
 * Backend file - service.admin.product.publish.ts
 */

import { Request } from 'express'
import { Pool } from 'pg'
import { pool as defaultPool } from '@/core/db/maindb'
import { createAndPublishEvent } from '@/core/eventBus/fabric.events'
import { EVENTS_ADMIN_CATALOG } from './events.admin.catalog'
import { queries } from './queries.admin.catalog'
import { getRequestorUuidFromReq } from '@/core/helpers/get.requestor.uuid.from.req'

const pgPool: Pool = (defaultPool as unknown as Pool)

export interface ProductPublishRequest {
  product_ids: string[]
  section_ids: string[]
}

export interface ProductPublishResponse {
  success: boolean
  message: string
  addedCount: number
  updatedCount: number
}

export async function productPublish(req: Request): Promise<ProductPublishResponse> {
  const productIds: string[] = Array.isArray(req.body?.product_ids) ? req.body.product_ids : []
  const sectionIds: string[] = Array.isArray(req.body?.section_ids) ? req.body.section_ids : []

  if (!productIds || productIds.length === 0) {
    return { success: false, message: 'product_ids is required and must not be empty', addedCount: 0, updatedCount: 0 }
  }

  if (!sectionIds || sectionIds.length === 0) {
    return { success: false, message: 'section_ids is required and must not be empty', addedCount: 0, updatedCount: 0 }
  }

  const publisherId = getRequestorUuidFromReq(req)
  if (!publisherId) {
    return { success: false, message: 'User authentication required for publication', addedCount: 0, updatedCount: 0 }
  }

  const client = await pgPool.connect()
  try {
    await client.query('BEGIN')

    // Validate products exist and have status_code = 'active'
    const productsCheck = await client.query(queries.checkProductsExist, [productIds])
    const existingProductIds = new Set<string>(productsCheck.rows.map((r: any) => r.product_id))
    const invalidProducts = productIds.filter(id => !existingProductIds.has(id))
    
    if (invalidProducts.length > 0) {
      await client.query('ROLLBACK')
      return { success: false, message: `Some products do not exist: ${invalidProducts.join(', ')}`, addedCount: 0, updatedCount: 0 }
    }

    const inactiveProducts = productsCheck.rows
      .filter((r: any) => r.status_code !== 'active')
      .map((r: any) => r.product_id)
    
    if (inactiveProducts.length > 0) {
      await client.query('ROLLBACK')
      return { success: false, message: `Some products are not active: ${inactiveProducts.join(', ')}`, addedCount: 0, updatedCount: 0 }
    }

    // Validate sections exist
    const sectionsCheck = await client.query(queries.checkMultipleSectionsExist, [sectionIds])
    const existingSectionIds = new Set<string>(sectionsCheck.rows.map((r: any) => r.id))
    const invalidSections = sectionIds.filter(id => !existingSectionIds.has(id))
    
    if (invalidSections.length > 0) {
      await client.query('ROLLBACK')
      return { success: false, message: `Some sections do not exist: ${invalidSections.join(', ')}`, addedCount: 0, updatedCount: 0 }
    }

    // Check existing mappings
    const existingMappings = await client.query(
      'SELECT section_id, product_id FROM app.section_products WHERE product_id = ANY($1) AND section_id = ANY($2)',
      [productIds, sectionIds]
    )
    const existingSet = new Set<string>(
      existingMappings.rows.map((r: any) => `${r.product_id}:${r.section_id}`)
    )

    let addedCount = 0
    let updatedCount = 0
    const addedMappings: Array<{ productId: string; sectionId: string }> = []
    const updatedMappings: Array<{ productId: string; sectionId: string }> = []

    // Insert new mappings
    for (const productId of productIds) {
      for (const sectionId of sectionIds) {
        const key = `${productId}:${sectionId}`
        if (!existingSet.has(key)) {
          await client.query(queries.insertSectionProduct, [sectionId, productId, publisherId])
          addedCount++
          addedMappings.push({ productId, sectionId })
        } else {
          updatedCount++
          updatedMappings.push({ productId, sectionId })
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

    const publishedMappings = [
      ...addedMappings.map(m => ({
        productId: m.productId,
        productCode: productsMap.get(m.productId) || 'Unknown',
        sectionId: m.sectionId,
        sectionName: sectionsMap.get(m.sectionId) || 'Unknown',
        action: 'added' as const
      })),
      ...updatedMappings.map(m => ({
        productId: m.productId,
        productCode: productsMap.get(m.productId) || 'Unknown',
        sectionId: m.sectionId,
        sectionName: sectionsMap.get(m.sectionId) || 'Unknown',
        action: 'updated' as const
      }))
    ]

    createAndPublishEvent({
      eventName: EVENTS_ADMIN_CATALOG['products.publish.success'].eventName,
      payload: {
        productIdsCount: productIds.length,
        sectionIdsCount: sectionIds.length,
        addedCount,
        updatedCount,
        products: Array.from(productsMap.entries()).map(([id, code]) => ({ id, code })),
        sections: Array.from(sectionsMap.entries()).map(([id, name]) => ({ id, name })),
        publishedMappings
      }
    })

    return { success: true, message: 'Products published successfully', addedCount, updatedCount }
  } catch (e: any) {
    await client.query('ROLLBACK')

    createAndPublishEvent({
      eventName: EVENTS_ADMIN_CATALOG['products.publish.database_error'].eventName,
      payload: {
        productIdsCount: productIds.length,
        sectionIdsCount: sectionIds.length,
        productIds,
        sectionIds,
        error: e?.message || 'Failed to publish products'
      },
      errorData: e?.message || 'Failed to publish products'
    })

    throw { success: false, message: e?.message || 'Failed to publish products', addedCount: 0, updatedCount: 0 }
  } finally {
    client.release()
  }
}

export default productPublish

