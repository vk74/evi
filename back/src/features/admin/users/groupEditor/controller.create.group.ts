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

function logRequest(message: string, meta?: object): void {
  console.log(`[${new Date().toISOString()}] [CreateGroup] ${message}`, meta || '');
}

function logError(message: string, error: unknown, meta?: object): void {
  console.error(
    `[${new Date().toISOString()}] [CreateGroup] ${message}`,
    { error, ...meta }
  );
}

async function createGroupController(req: Request & { user?: { username: string } }, res: Response): Promise<void> {
  const groupData: CreateGroupRequest = req.body;
  
  try {
    logRequest('Received request to create new group', {
      groupName: groupData.group_name,
      owner: groupData.group_owner
    });

    const result = await createGroup(groupData, { username: req.user?.username || '' });

    logRequest('Successfully created group', {
      groupId: result.groupId,
      groupName: result.group_name
    });

    res.status(201).json(result);

  } catch (err) {
    const error = err as ServiceErrorType;
    logError('Failed to create group', error, {
      groupName: groupData.group_name,
      errorCode: error.code
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