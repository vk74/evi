/**
 * service.fetch.service.details.ts - backend file
 * version: 1.0.0
 * 
 * Purpose: Service for fetching single service detailed view
 * Logic: Queries DB for one service (in_production), resolves usernames and group names, maps to DTO
 * File type: Backend TypeScript (service.fetch.service.details.ts)
 */

import { Request } from 'express';
import { Pool } from 'pg';
import { pool as pgPool } from '../../core/db/maindb';
import queries from './queries.catalog.services';
import type { ServiceError, DbServiceDetails, CatalogServiceDetailsDTO, FetchServiceDetailsResponse } from './types.catalog';


const pool = pgPool as Pool;

function transform(row: DbServiceDetails): CatalogServiceDetailsDTO {
  return {
    id: row.id,
    name: row.name,
    priority: row.priority,
    status: row.status,
    description_long: row.description_long ?? null,
    purpose: row.purpose ?? null,
    icon: row.icon_name ?? null,
    created_at: row.created_at,
    owner: row.owner ?? null,
    backup_owner: row.backup_owner ?? null,
    technical_owner: row.technical_owner ?? null,
    backup_technical_owner: row.backup_technical_owner ?? null,
    dispatcher: row.dispatcher ?? null,
    support_tier1: row.support_tier1 ?? null,
    support_tier2: row.support_tier2 ?? null,
    support_tier3: row.support_tier3 ?? null,
    show_owner: row.show_owner,
    show_backup_owner: row.show_backup_owner,
    show_technical_owner: row.show_technical_owner,
    show_backup_technical_owner: row.show_backup_technical_owner,
    show_dispatcher: row.show_dispatcher,
    show_support_tier1: row.show_support_tier1,
    show_support_tier2: row.show_support_tier2,
    show_support_tier3: row.show_support_tier3,
  };
}

export async function fetchServiceDetails(req: Request): Promise<FetchServiceDetailsResponse> {
  const serviceId = (req.query.serviceId as string) || '';
  if (!serviceId) {
    const error: ServiceError = { code: 'VALIDATION_ERROR', message: 'serviceId is required' };
    throw error;
  }
  try {
    const result = await pool.query<DbServiceDetails>(queries.getServiceDetails, [serviceId]);
    if (result.rows.length === 0) {
      return { success: true, message: 'Service not found', data: null };
    }
    const dto = transform(result.rows[0]);
    return { success: true, message: 'Service details loaded successfully', data: dto };
  } catch (error) {
    const serviceError: ServiceError = {
      code: 'INTERNAL_SERVER_ERROR',
      message: error instanceof Error ? error.message : 'Failed to fetch service details',
      details: error,
    };
    throw serviceError;
  }
}

export default fetchServiceDetails;


