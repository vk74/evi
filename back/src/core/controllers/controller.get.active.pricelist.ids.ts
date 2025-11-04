/**
 * controller.get.active.pricelist.ids.ts - version 1.0.0
 * BACKEND controller for fetching active price list IDs
 * 
 * Functionality:
 * - Handles HTTP GET requests to retrieve list of active price list IDs
 * - Uses helper for data retrieval
 * - Uses universal connection handler for standardized HTTP processing
 */

import { Request, Response } from 'express';
import { getActivePriceListIds } from '../helpers/get.active.pricelist.ids';
import { connectionHandler } from '../helpers/connection.handler';

// Define response interface
interface ActivePriceListIdsResponse {
  success: boolean;
  message: string;
  data: {
    priceListIds: number[];
  };
}

/**
 * Controller logic to fetch active price list IDs
 * Handles HTTP requests and communicates with the helper
 * 
 * @param req Express Request object
 * @param res Express Response object for sending the response
 */
async function getActivePriceListIdsLogic(req: Request, res: Response): Promise<ActivePriceListIdsResponse> {
  // Call helper to fetch active price list IDs from database
  const priceListIds = await getActivePriceListIds();

  const response: ActivePriceListIdsResponse = {
    success: true,
    message: 'Active price list IDs fetched successfully',
    data: { priceListIds }
  };
  
  return response;
}

// Export controller using universal connection handler
export default connectionHandler(getActivePriceListIdsLogic, 'GetActivePriceListIdsController');

