/**
 * service.admin.fetch.product.ts - version 1.0.0
 * Service for fetching single product data by ID
 * Purpose: Provides business logic for fetching detailed product information
 * Backend file - service.admin.fetch.product.ts
 * Created: 2024-12-20
 * Last Updated: 2024-12-20
 */

import { queries } from './queries.admin.products'
import { createAndPublishEvent } from '@/core/eventBus/fabric.events'
import { PRODUCT_FETCH_EVENTS } from './events.admin.products'
import type { Product, ProductTranslation, FetchProductResponse, ProductWithFullData } from './types.admin.products'
import { pool } from '@/core/db/maindb'
import { fetchGroupnameByUuid } from '@/core/helpers/get.groupname.by.uuid'
import { fetchUsernameByUuid } from '@/core/helpers/get.username.by.uuid'

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
      // Validate product ID format (basic UUID check)
      if (!productId || typeof productId !== 'string' || productId.trim().length === 0) {
        await createAndPublishEvent({
          req,
          eventName: PRODUCT_FETCH_EVENTS.VALIDATION_STARTED.eventName,
          payload: { productId },
          errorData: 'Invalid product ID provided'
        })
        return {
          success: false,
          message: 'Invalid product ID format'
        }
      }

      await createAndPublishEvent({
        req,
        eventName: PRODUCT_FETCH_EVENTS.STARTED.eventName,
        payload: { productId }
      })

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
          techSpecs: translationRow.tech_specs,
          areaSpecifics: translationRow.area_specifics,
          industrySpecifics: translationRow.industry_specifics,
          keyFeatures: translationRow.key_features,
          productOverview: translationRow.product_overview
        }
      }

      // Fetch product users (owners)
      const usersResult = await client.query(`
        SELECT user_id, role_type 
        FROM app.product_users 
        WHERE product_id = $1 AND role_type IN ('owner', 'backup_owner')
        ORDER BY role_type, user_id
      `, [productId])

      // Process owners using helpers
      let owner: string | undefined
      let backupOwner: string | undefined

      for (const row of usersResult.rows) {
        const username = await fetchUsernameByUuid(row.user_id)
        if (username) {
          if (row.role_type === 'owner') {
            owner = username
          } else if (row.role_type === 'backup_owner') {
            backupOwner = username
          }
        }
      }

      await createAndPublishEvent({
        req,
        eventName: PRODUCT_FETCH_EVENTS.OWNERS_FETCHED.eventName,
        payload: { 
          productId, 
          owner, 
          backupOwner 
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

      // Build product object
      const product: Product = {
        product_id: productRow.product_id,
        product_code: productRow.product_code,
        translation_key: productRow.translation_key,
        can_be_option: productRow.can_be_option,
        option_only: productRow.option_only,
        is_published: productRow.is_published,
        is_visible_owner: productRow.is_visible_owner,
        is_visible_groups: productRow.is_visible_groups,
        is_visible_tech_specs: productRow.is_visible_tech_specs,
        is_visible_area_specs: productRow.is_visible_area_specs,
        is_visible_industry_specs: productRow.is_visible_industry_specs,
        is_visible_key_features: productRow.is_visible_key_features,
        is_visible_overview: productRow.is_visible_overview,
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
        backupOwner,
        specialistsGroups
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
