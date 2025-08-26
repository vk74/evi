/**
 * auth.issue.token.ts - backend file
 * version: 1.0.0
 * 
 * Middleware responsible for creating and issuing JWT tokens to authenticated users
 * Publishes events to event bus for monitoring and tracking
 */

import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getUuidByUsername } from '../core/helpers/get.uuid.by.username';
import { createAndPublishEvent } from '../core/eventBus/fabric.events';
import { AUTH_TOKEN_ISSUE_EVENTS } from '../core/auth/events.auth';

// Interface for enhanced request object
interface UserInfo {
  username: string;
  uuid?: string;
  [key: string]: any;
}

interface EnhancedRequest extends Request {
  user?: UserInfo;
}

// Interface for JWT payload
interface JwtPayload {
  iss: string;
  sub: string;
  aud: string;
  jti: string;
  uid: string;
}

/**
 * Issues a JWT token for an authenticated user
 * @param req Express request object with user data
 * @param res Express response object
 * @returns Promise<void>
 */
const issueToken = async (req: EnhancedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    // Publish warning event
    await createAndPublishEvent({
      req,
      eventName: AUTH_TOKEN_ISSUE_EVENTS.TOKEN_ISSUE_FAILED.eventName,
      payload: {
        requestInfo: {
          hasReq: !!req,
          hasUser: !!(req && req.user)
        }
      }
    });
    
    res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
    return;
  }

  try {
    // Используем наш helper для получения UUID пользователя
    const userUUID = await getUuidByUsername(req.user.username);
    
    if (!userUUID) {
      throw new Error('User not found in database');
    }

    // Publish debug event for token issuance started
    await createAndPublishEvent({
      req,
      eventName: AUTH_TOKEN_ISSUE_EVENTS.TOKEN_ISSUE_STARTED.eventName,
      payload: {
        username: req.user.username,
        userUUID
      }
    });

    const payload: JwtPayload = {
      iss: 'ev2 app',
      sub: req.user.username,
      aud: 'ev2 app registered users',
      jti: uuidv4(),
      uid: userUUID
    };

    const token = jwt.sign(payload, global.privateKey, {
      algorithm: 'RS256',
      expiresIn: '30m'
    });

    // Publish debug event for token issuance success
    await createAndPublishEvent({
      req,
      eventName: AUTH_TOKEN_ISSUE_EVENTS.TOKEN_ISSUE_SUCCESS.eventName,
      payload: {
        username: req.user.username
      }
    });
    
    res.json({
      success: true,
      token
    });

  } catch (error) {
    // Publish error event
    await createAndPublishEvent({
      req,
      eventName: AUTH_TOKEN_ISSUE_EVENTS.TOKEN_CREATION_ERROR.eventName,
      payload: {
        username: req.user?.username,
        error: error
      },
      errorData: error instanceof Error ? error.message : String(error)
    });
    
    res.status(500).json({
      success: false,
      message: 'Error creating token',
      details: error instanceof Error ? error.message : String(error)
    });
  }
};

// Export for ES modules only
export default issueToken;