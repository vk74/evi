/**
 * service.fetch.active.services.ts - backend file
 * version: 1.1.0
 * 
 * Purpose: Service that fetches active services for catalog consumption
 * Logic: Queries DB for services with status 'in_production', transforms into DTO for frontend
 * File type: Backend TypeScript (service.fetch.active.services.ts)
 */

import { Request } from 'express';
import { Pool } from 'pg';
import { pool as pgPool } from '../../core/db/maindb';
import queries from './queries.catalog.services';
import type { DbService, CatalogServiceDTO, FetchServicesResponse, ServiceError } from './types.catalog';
import { getSettingValue } from '../../core/helpers/get.setting.value';

const pool = pgPool as Pool;

function transformRow(row: DbService): CatalogServiceDTO {
  return {
    id: row.id,
    name: row.name,
    description: row.description_short ?? null,
    priority: row.priority,
    status: row.status,
    owner: row.owner ?? null,
    icon: row.icon_name ?? null,
  };
}

export async function fetchActiveServices(req: Request): Promise<FetchServicesResponse> {
  try {
    const sectionId = req.query.sectionId as string | undefined;
    const result = sectionId
      ? await pool.query<DbService>(queries.getActiveServicesBySection, [sectionId])
      : await pool.query<DbService>(queries.getActiveServices);
    const services = result.rows.map(transformRow);

    // Get card colors from settings cache
    const serviceCardColor = await getSettingValue<string>(
      'Catalog.Services',
      'card.color',
      '#F5F5F5'
    );
    const productCardColor = await getSettingValue<string>(
      'AdminProducts',
      'card.color',
      '#E8F4F8'
    );

    return {
      success: true,
      message: 'Active services loaded successfully',
      data: services,
      metadata: {
        serviceCardColor,
        productCardColor
      }
    };
  } catch (error) {
    const serviceError: ServiceError = {
      code: 'INTERNAL_SERVER_ERROR',
      message: error instanceof Error ? error.message : 'Failed to fetch active services',
      details: error,
    };
    throw serviceError;
  }
}

export default fetchActiveServices;


