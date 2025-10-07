/**
 * File: controller.admin.count.product.option.pairs.ts
 * Version: 1.0.0
 * Description: Controller for counting product-option pairs by main product.
 * Backend file - controller.admin.count.product.option.pairs.ts
 */

import { Request, Response } from 'express'
import { connectionHandler } from '@/core/helpers/connection.handler'
import { countProductOptionPairs } from './service.admin.count.product.option.pairs'

async function countPairsLogic(req: Request, _res: Response) {
  const result = await countProductOptionPairs(req.body, req)
  return result
}

export default connectionHandler(countPairsLogic, 'CountProductOptionPairsController')


