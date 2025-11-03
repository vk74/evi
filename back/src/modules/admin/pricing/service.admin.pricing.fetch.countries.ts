/**
 * version: 1.0.0
 * Service to fetch countries list for pricing admin module (backend).
 * Retrieves list of countries from app.app_countries ENUM.
 * File: service.admin.pricing.fetch.countries.ts (backend)
 */

import { Request } from 'express'
import { getAppCountriesList } from '@/core/helpers/get.app.countries.list'

/**
 * Fetch countries list from app.app_countries ENUM
 * @returns Promise with array of country codes
 */
export async function fetchCountriesService(req: Request): Promise<string[]> {
    try {
        const countries = await getAppCountriesList()
        return countries
    } catch (error) {
        throw error
    }
}

