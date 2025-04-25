/**
 * controller.create.group.ts
 * Controller for handling group creation requests from admin panel.
 * Processes requests, handles errors, and formats responses.
 */
import { Request, Response } from 'express';
import { createGroup } from './service.create.group';
import type { 
  CreateGroupRequest,
  ServiceErrorType
} from './types.group.editor';
import { 
  createAppLgr,
  Events 
} from '../../../../core/lgr/lgr.index';

// Создаем экземпляр логгера для контроллера групп
const lgr = createAppLgr({
  module: 'AdminGroupController',
  fileName: 'controller.create.group.ts'
});

async function createGroupController(req: Request & { user?: { username: string } }, res: Response): Promise<void> {
  const groupData: CreateGroupRequest = req.body;
  
  try {
    // Логируем получение запроса
    lgr.info({
      code: Events.ADMIN.USERS.CREATION.REQUEST.RECEIVED.code,
      message: `Received request to create new group: ${groupData.group_name}`,
      details: {
        groupName: groupData.group_name,
        owner: groupData.group_owner,
        requestIP: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    const result = await createGroup(groupData, { username: req.user?.username || '' });

    // Логируем успешное создание
    lgr.info({
      code: Events.ADMIN.USERS.CREATION.CREATE.SUCCESS.code,
      message: `Successfully created group: ${result.group_name}`,
      details: {
        groupId: result.groupId,
        groupName: result.group_name,
        createdBy: req.user?.username || 'anonymous'
      }
    });

    res.status(201).json(result);

  } catch (err) {
    const error = err as ServiceErrorType;
    
    // Логируем ошибку создания
    lgr.error({
      code: Events.ADMIN.USERS.CREATION.CREATE.ERROR.code,
      message: `Failed to create group: ${error.message}`,
      details: {
        groupName: groupData.group_name,
        errorCode: error.code,
        field: error.field,
        requestBody: groupData
      },
      error
    });

    // Handle specific error types
    switch (error.code) {
      case 'REQUIRED_FIELD_ERROR':
      case 'VALIDATION_ERROR':
      case 'UNIQUE_CONSTRAINT_ERROR':
        res.status(400).json({
          success: false,
          message: error.message,
          field: error.field
        });
        break;

      default:
        // Handle unexpected errors
        res.status(500).json({
          success: false,
          message: 'Internal server error occurred while creating group',
          details: process.env.NODE_ENV === 'development' ? 
            error.message : undefined
        });
    }
  }
}

module.exports = createGroupController;