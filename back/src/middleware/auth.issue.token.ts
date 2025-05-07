/**
 * auth.issue.token.ts - version 1.0.0
 * Middleware responsible for creating and issuing JWT tokens to authenticated users
 */

import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getUuidByUsername } from '../core/helpers/get.uuid.by.username';

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
    console.log('Token issuance failed: No user data in request');
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

    console.log('User authenticated, issuing token for:', req.user.username, 'UUID:', userUUID);

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

    console.log('JWT successfully created and issued to the user:', req.user.username);
    res.json({
      success: true,
      token
    });

  } catch (error) {
    console.error('Token creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating token',
      details: error instanceof Error ? error.message : String(error)
    });
  }
};

// Экспорт для совместимости с CommonJS require()
module.exports = issueToken;
// Также экспортируем по умолчанию для ES modules
export default issueToken;