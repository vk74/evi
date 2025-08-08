/**
 * controller.admin.update.sections.publish.ts
 * Version: 1.0.0
 * Description: Controller for updating (replacing) catalog section publish mappings for a service
 * Purpose: Handles POST /api/admin/services/update-sections-publish
 * Backend file - controller.admin.update.sections.publish.ts
 */

import { Request, Response } from 'express'
import { connectionHandler } from '@/core/helpers/connection.handler'
import { updateSectionsPublish as updateSectionsPublishService } from './service.admin.update.sections.publish'

async function updateSectionsPublishLogic(req: Request, res: Response): Promise<any> {
  const result = await updateSectionsPublishService(req)
  return result
}

export default connectionHandler(updateSectionsPublishLogic, 'UpdateSectionsPublishController')


