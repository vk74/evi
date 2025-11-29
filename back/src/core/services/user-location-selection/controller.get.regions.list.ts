/**
 * controller.get.regions.list.ts - version 1.0.0
 * Controller for fetching regions list.
 * 
 * Handles HTTP requests for regions list and delegates to service layer.
 * File: controller.get.regions.list.ts (backend)
 */

import { Request, Response } from 'express';
import { getRegionsList } from './service.get.regions.list';
import { connectionHandler } from '@/core/helpers/connection.handler';

/**
 * Controller for fetching all regions
 */
const getRegionsListController = async (req: Request, res: Response): Promise<any> => {
  // Call service
  const result = await getRegionsList(req);
  
  // Return result for connectionHandler to process
  return result;
};

export default connectionHandler(getRegionsListController, 'GetRegionsListController');

