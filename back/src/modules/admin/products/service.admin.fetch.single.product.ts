/**
 * service.admin.fetch.single.product.ts - version 1.2.0
 * Service for fetching single product data by ID
 * Purpose: Provides business logic for fetching detailed product information
 * Backend file - service.admin.fetch.single.product.ts
 * Created: 2024-12-20
 * Last Updated: 2024-12-20
 * 
 * Changes in v1.1.0:
 * - Added status_code field to product object
 * - Added fetch of product statuses from reference table
 * - Included statuses array in response data
 * 
 * Changes in v1.1.2:
 * - Updated to fetch statuses from app.product_status UDT enum instead of product_statuses table
 * - Removed description, is_active, and display_order fields from status mapping
 * 
 * Changes in v1.2.0:
 * - Added scope check support for authorization
 * - If effectiveScope = 'own', checks user access to product before returning data
 * - Returns 403 error if user doesn't have access to the product
 */

import { queries } from './queries.admin.products'
import { createAndPublishEvent } from '@/core/eventBus/fabric.events'
import { PRODUCT_FETCH_EVENTS } from './events.admin.products'
import type { Product, ProductTranslation, FetchProductResponse, ProductWithFullData, ProductStatus } from './types.admin.products'
import { pool } from '@/core/db/maindb'
import { fetchGroupnameByUuid } from '@/core/helpers/get.groupname.by.uuid'
import { fetchUsernameByUuid } from '@/core/helpers/get.username.by.uuid'
import { AuthenticatedRequest } from '@/core/guards/types.guards'
import { checkProductAccess } from './helpers.check.product.access'

/**
 * Service class for fetching single product data
 */
export class ServiceAdminFetchProduct {

  /**
   * Fetches single product data by ID
   * @param productId - The UUID of the product to fetch
   * @param req - Express request object for event context
   * @returns Promise with product data or error
   */
  async fetchSingleProduct(productId: string, req?: any): Promise<FetchProductResponse> {
    
    const client = await pool.connect()
    
    try {
      await createAndPublishEvent({
        req,
        eventName: PRODUCT_FETCH_EVENTS.STARTED.eventName,
        payload: { productId }
      })

      // Validate product ID format (basic UUID check)
      if (!productId || typeof productId !== 'string' || productId.trim().length === 0) {
        return {
          success: false,
          message: 'Invalid product ID format'
        }
      }

      // Fetch product basic data
      const productResult = await client.query(queries.fetchSingleProduct, [productId])
      
      if (productResult.rows.length === 0) {
        await createAndPublishEvent({
          req,
          eventName: PRODUCT_FETCH_EVENTS.NOT_FOUND.eventName,
          payload: { productId }
        })
        return {
          success: false,
          message: 'Product not found'
        }
      }

      const productRow = productResult.rows[0]

      // Check scope for authorization
      const authReq = req as AuthenticatedRequest | undefined
      const effectiveScope = authReq?.authContext?.effectiveScope
      const userUuid = authReq?.user?.user_id

      // If scope is 'own', check access to product
      if (effectiveScope === 'own' && userUuid) {
        const hasAccess = await checkProductAccess(productId, userUuid, client)
        
        if (!hasAccess) {
          await createAndPublishEvent({
            req,
            eventName: PRODUCT_FETCH_EVENTS.ERROR.eventName,
            payload: { 
              productId,
              userUuid,
              scope: effectiveScope,
              error: 'Access denied: user does not have access to this product'
            },
            errorData: 'Access denied: you can only access your own products'
          })
          
          return {
            success: false,
            message: 'Access denied: you can only access your own products'
          }
        }
      }

      // Fetch product translations
      const translationsResult = await client.query(queries.fetchProductTranslations, [productId])
      
      await createAndPublishEvent({
        req,
        eventName: PRODUCT_FETCH_EVENTS.TRANSLATIONS_FETCHED.eventName,
        payload: { 
          productId, 
          translationsCount: translationsResult.rows.length 
        }
      })

      // Process translations into the format expected by frontend
      const translations: any = {}
      for (const translationRow of translationsResult.rows) {
        const langCode = translationRow.language_code
        translations[langCode] = {
          name: translationRow.name,
          shortDesc: translationRow.short_desc,
          longDesc: translationRow.long_desc,
          techSpecs: translationRow.tech_specs
        }
      }

      // Fetch product users (owners)
      const usersResult = await client.query(`
        SELECT user_id, role_type 
        FROM app.product_users 
        WHERE product_id = $1 AND role_type = 'owner'
        ORDER BY user_id
      `, [productId])

      // Process owners using helpers
      let owner: string | undefined

      for (const row of usersResult.rows) {
        const username = await fetchUsernameByUuid(row.user_id)
        if (username) {
          if (row.role_type === 'owner') {
            owner = username
          }
        }
      }

      await createAndPublishEvent({
        req,
        eventName: PRODUCT_FETCH_EVENTS.OWNERS_FETCHED.eventName,
        payload: { 
          productId, 
          owner
        }
      })

      // Fetch product groups (specialists)
      const groupsResult = await client.query(`
        SELECT group_id, role_type 
        FROM app.product_groups 
        WHERE product_id = $1 AND role_type = 'product_specialists'
        ORDER BY group_id
      `, [productId])

      // Process groups using helper
      const specialistsGroups: string[] = []
      for (const row of groupsResult.rows) {
        const groupName = await fetchGroupnameByUuid(row.group_id)
        if (groupName) {
          specialistsGroups.push(groupName)
        }
      }

      await createAndPublishEvent({
        req,
        eventName: PRODUCT_FETCH_EVENTS.GROUPS_FETCHED.eventName,
        payload: { 
          productId, 
          groupsCount: specialistsGroups.length,
          groups: specialistsGroups 
        }
      })

      // Fetch product statuses from app.product_status enum
      const statusesResult = await client.query(queries.fetchProductStatuses)
      const statuses: ProductStatus[] = statusesResult.rows.map((row: any) => ({
        status_code: row.status_code
      }))

      // Build product object
      const product: Product = {
        product_id: productRow.product_id,
        product_code: productRow.product_code,
        translation_key: productRow.translation_key,
        status_code: productRow.status_code,
        is_published: productRow.is_published,
        is_visible_owner: productRow.is_visible_owner,
        is_visible_groups: productRow.is_visible_groups,
        is_visible_tech_specs: productRow.is_visible_tech_specs,
        is_visible_long_description: productRow.is_visible_long_description,
        created_by: productRow.created_by,
        created_at: productRow.created_at,
        updated_by: productRow.updated_by,
        updated_at: productRow.updated_at
      }

      // Build full response data
      const responseData = {
        product,
        translations: translationsResult.rows,
        owner,
        specialistsGroups,
        statuses
      }

      await createAndPublishEvent({
        req,
        eventName: PRODUCT_FETCH_EVENTS.SUCCESS.eventName,
        payload: { 
          productId, 
          productCode: product.product_code,
          translationKey: product.translation_key,
          translationsCount: Object.keys(translations).length,
          specialistsGroupsCount: specialistsGroups.length
        }
      })
      
      return {
        success: true,
        message: 'Product data fetched successfully',
        data: responseData
      }

    } catch (error) {
      await createAndPublishEvent({
        req,
        eventName: PRODUCT_FETCH_EVENTS.ERROR.eventName,
        payload: { 
          productId,
          error: error instanceof Error ? error.message : String(error)
        },
        errorData: error instanceof Error ? error.message : String(error)
      })
      
      return {
        success: false,
        message: 'Internal server error while fetching product data'
      }
    } finally {
      client.release()
    }
  }
}

// Export singleton instance
export const serviceAdminFetchProduct = new ServiceAdminFetchProduct()

