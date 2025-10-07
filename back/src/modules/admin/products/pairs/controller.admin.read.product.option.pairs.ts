/**
 * File: controller.admin.read.product.option.pairs.ts
 * Version: 1.0.0
 * Description: Controller for reading product-option pairs.
 * Backend file - controller.admin.read.product.option.pairs.ts
 */

import { Request, Response } from 'express'
import { connectionHandler } from '@/core/helpers/connection.handler'
import { readProductOptionPairs } from './service.admin.read.product.option.pairs'

async function readPairsLogic(req: Request, _res: Response) {
  const result = await readProductOptionPairs(req.body, req)
  return result
}

export default connectionHandler(readPairsLogic, 'ReadProductOptionPairsController')


