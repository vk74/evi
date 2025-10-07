/**
 * File: controller.admin.update.product.option.pairs.ts
 * Version: 1.0.0
 * Description: Controller for updating product-option pairs.
 * Backend file - controller.admin.update.product.option.pairs.ts
 */

import { Request, Response } from 'express'
import { connectionHandler } from '@/core/helpers/connection.handler'
import { updateProductOptionPairs } from './service.admin.update.product.option.pairs'

async function updatePairsLogic(req: Request, _res: Response) {
  const result = await updateProductOptionPairs(req.body, req)
  return result
}

export default connectionHandler(updatePairsLogic, 'UpdateProductOptionPairsController')


