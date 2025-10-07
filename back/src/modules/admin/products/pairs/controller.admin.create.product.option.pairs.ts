/**
 * File: controller.admin.create.product.option.pairs.ts
 * Version: 1.0.0
 * Description: Controller for creating product-option pairs.
 * Backend file - controller.admin.create.product.option.pairs.ts
 */

import { Request, Response } from 'express'
import { connectionHandler } from '@/core/helpers/connection.handler'
import { createProductOptionPairs } from './service.admin.create.product.option.pairs'

async function createPairsLogic(req: Request, _res: Response) {
  const result = await createProductOptionPairs(req.body, req)
  return result
}

export default connectionHandler(createPairsLogic, 'CreateProductOptionPairsController')


