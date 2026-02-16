/**
 * version: 1.1.0
 * Controller for fetching taxable categories by region (for Product Editor).
 * Backend file.
 * 
 * Functionality:
 * - Fetches categories for a specific region from app.regions_taxable_categories
 */

import { Request, Response } from 'express'
import { pool } from '@/core/db/maindb'
import { connectionHandler } from '@/core/helpers/connection.handler'
import { queries } from '../pricing/queries.admin.pricing'

/**
 * Fetch categories for a specific region
 */
async function fetchTaxableCategoriesByRegionLogic(req: Request, res: Response): Promise<any> {
    const regionId = parseInt(req.params.regionId as string)
    
    if (isNaN(regionId)) {
        return {
            success: false,
            message: 'Invalid region ID'
        }
    }
    
    const client = await pool.connect()
    try {
        const result = await client.query(queries.fetchRegionTaxableCategoriesBindings, [regionId])
        
        // Map result to format expected by frontend
        // frontend expects: category_id, category_name
        // DB returns: id, category_name, vat_rate
        const categories = result.rows.map(row => ({
            category_id: row.id,
            category_name: row.category_name,
            vat_rate: row.vat_rate
        }))
        
        return {
            success: true,
            data: categories
        }
    } finally {
        client.release()
    }
}

export default connectionHandler(fetchTaxableCategoriesByRegionLogic, 'FetchTaxableCategoriesByRegionController')
