/**
 * controller.get.app.countries.list.ts - version 1.0.0
 * BACKEND controller for fetching countries list
 * 
 * Functionality:
 * - Handles HTTP GET requests to retrieve list of countries
 * - Uses helper for data retrieval
 * - Uses universal connection handler for standardized HTTP processing
 */

import { Request, Response } from 'express';
import { getAppCountriesList } from '../helpers/get.app.countries.list';
import { connectionHandler } from '../helpers/connection.handler';

// Define response interface
interface CountriesResponse {
  success: boolean;
  message: string;
  data: {
    countries: string[];
  };
}

/**
 * Controller logic to fetch countries list
 * Handles HTTP requests and communicates with the helper
 * 
 * @param req Express Request object
 * @param res Express Response object for sending the response
 */
async function getAppCountriesListLogic(req: Request, res: Response): Promise<CountriesResponse> {
  // Call helper to fetch countries from database
  const countries = await getAppCountriesList();

  const response: CountriesResponse = {
    success: true,
    message: 'Countries fetched successfully',
    data: { countries }
  };
  
  return response;
}

// Export controller using universal connection handler
export default connectionHandler(getAppCountriesListLogic, 'GetAppCountriesListController');

