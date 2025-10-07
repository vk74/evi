/**
 * File: controller.admin.delete.product.option.pairs.ts
 * Version: 1.0.0
 * Description: Controller for deleting product-option pairs (selected or all).
 * Backend file - controller.admin.delete.product.option.pairs.ts
 */

import { Request, Response } from 'express'
import { connectionHandler } from '@/core/helpers/connection.handler'
import { deleteProductOptionPairs } from './service.admin.delete.product.option.pairs'

async function deletePairsLogic(req: Request, _res: Response) {
  const result = await deleteProductOptionPairs(req.body, req)
  return result
}

export default connectionHandler(deletePairsLogic, 'DeleteProductOptionPairsController')


