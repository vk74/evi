/**
 * controller.create.group.ts - version 1.0.02
 * Controller for handling group creation requests from admin panel.
 * Processes requests, handles errors, and formats responses.
 * Now uses event bus for tracking operations.
 */
import { Request, Response } from 'express';
import { createGroup } from './service.create.group';
import type { 
  CreateGroupRequest,
  ServiceErrorType
} from './types.group.editor';
import fabricEvents from '../../../../core/eventBus/fabric.events';
import { GROUP_CREATION_CONTROLLER_EVENTS } from './events.group.editor';

/**
 * Controller function for group creation
 */
async function createGroupController(req: Request & { user?: { username: string } }, res: Response): Promise<void> {
  const groupData: CreateGroupRequest = req.body;
  
  try {
    // Создаем событие для входящего запроса
    await fabricEvents.createAndPublishEvent({
      req,
      eventName: GROUP_CREATION_CONTROLLER_EVENTS.HTTP_REQUEST_RECEIVED.eventName,
      payload: {
        groupName: groupData.group_name,
        method: req.method,
        url: req.url,
        userAgent: req.headers['user-agent']
      }
    });

    // Передаем объект req в сервис
    const result = await createGroup(groupData, { username: req.user?.username || '' }, req);

    // Создаем событие для успешного ответа
    await fabricEvents.createAndPublishEvent({
      req,
      eventName: GROUP_CREATION_CONTROLLER_EVENTS.HTTP_RESPONSE_SENT.eventName,
      payload: {
        groupId: result.groupId,
        groupName: result.group_name,
        createdBy: req.user?.username || 'anonymous'
      }
    });

    res.status(201).json(result);

  } catch (err) {
    const error = err as ServiceErrorType;
    
    // Создаем событие для ошибки
    await fabricEvents.createAndPublishEvent({
      req,
      eventName: GROUP_CREATION_CONTROLLER_EVENTS.HTTP_ERROR.eventName,
      payload: {
        groupName: groupData.group_name,
        errorCode: error.code,
        field: error.field
      },
      errorData: error.message
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