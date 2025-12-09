/**
 * service.admin.fetch.publishingproducts.ts
 * Version: 1.2.0
 * Description: Service for fetching active products with their publication status across all catalog sections
 * Purpose: Implements GET /api/admin/catalog/fetchpublishingproducts - returns all active products with sections where published
 * Backend file - service.admin.fetch.publishingproducts.ts
 * 
 * Changes in v1.1.0:
 * - Switched to full-name languages ('english', 'russian', ...) for admin catalog queries
 * - Now uses fallback.language and allowed.languages settings for language resolution
 * - Added support for legacy short codes ('en', 'ru') via normalization helper
 * 
 * Changes in v1.2.0:
 * - Removed language normalization - now uses full language names directly
 * - Directly loads fallback.language from app settings
 */

import { Request } from 'express'
import { Pool } from 'pg'
import { pool as defaultPool } from '@/core/db/maindb'
import { createAndPublishEvent } from '@/core/eventBus/fabric.events'
import { EVENTS_ADMIN_CATALOG } from './events.admin.catalog'
import { queries } from './queries.admin.catalog'
import { getSettingValue } from '@/core/helpers/get.setting.value'

const pgPool: Pool = (defaultPool as unknown as Pool)

export async function fetchPublishingProducts(req: Request) {
  try {
    // Fetch all active products (status_code = 'active')
    // Load fallback language from app settings
    const requestedLanguage = await getSettingValue<string>(
      'Application.RegionalSettings',
      'fallback.language',
      'english'
    )
    const productsRes = await pgPool.query(queries.getActiveProducts, [requestedLanguage])

    // Fetch all section-product mappings
    const mappingsRes = await pgPool.query(queries.getSectionProductMappings)

    // Build map of product_id -> sections where published
    const productSectionsMap = new Map<string, Array<{ id: string; name: string; status: string }>>()
    mappingsRes.rows.forEach((r: any) => {
      if (!productSectionsMap.has(r.product_id)) {
        productSectionsMap.set(r.product_id, [])
      }
      productSectionsMap.get(r.product_id)!.push({
        id: r.section_id,
        name: r.section_name,
        status: r.section_status
      })
    })

    // Fetch all catalog sections
    const sectionsRes = await pgPool.query(queries.getAllSections)

    // Build products array with publication info
    const products = productsRes.rows.map((r: any) => {
      const sections = productSectionsMap.get(r.product_id) || []
      const allSectionStatuses = [...new Set(sections.map((s: any) => s.status))].filter(Boolean)
      
      return {
        id: r.product_id,
        productId: r.product_id,
        productName: r.name || r.product_code,
        productStatus: r.status_code,
        sections: sections,
        published: sections.length > 0,
        allSectionStatuses: allSectionStatuses
      }
    })

    // Format sections for response
    const sections = sectionsRes.rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      owner: r.owner,
      backup_owner: r.backup_owner,
      description: r.description,
      comments: r.comments,
      status: r.status,
      is_public: r.is_public,
      order: r.order,
      parent_id: r.parent_id,
      icon_name: r.icon_name,
      color: r.color,
      created_at: r.created_at,
      created_by: r.created_by,
      modified_at: r.modified_at,
      modified_by: r.modified_by
    }))

    const result = {
      success: true,
      message: 'ok',
      data: {
        products,
        sections
      }
    }

    createAndPublishEvent({
      eventName: EVENTS_ADMIN_CATALOG['products.sections.fetch.success'].eventName,
      payload: {
        productsCount: products.length,
        sectionsCount: sections.length,
        productIds: products.map(p => p.id),
        sectionIds: sections.map(s => s.id)
      }
    })

    return result
  } catch (e: any) {
    createAndPublishEvent({
      eventName: EVENTS_ADMIN_CATALOG['products.publish.fetch.validation_error'].eventName,
      payload: {
        error: e?.message || 'Failed to fetch products and sections'
      },
      errorData: e?.message || 'Failed to fetch products and sections'
    })
    throw { success: false, message: e?.message || 'Failed to fetch products and sections' }
  }
}

export default fetchPublishingProducts

