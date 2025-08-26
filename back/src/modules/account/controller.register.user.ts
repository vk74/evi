/**
 * controller.register.user.ts - backend file
 * version: 1.0.0
 * Controller for user registration operations.
 * Handles user registration requests, validates settings, and delegates to service layer.
 * Implements proper error handling and event logging.
 */

import { Request, Response } from 'express';
import { getSetting } from '../../modules/admin/settings/cache.settings';
import fabricEvents from '../../core/eventBus/fabric.events';
import { ACCOUNT_REGISTRATION_EVENTS } from './events.account';
import registerUserService from './service.register.user';
import { connectionHandler } from '../../core/helpers/connection.handler';

// Interface for registration request body
interface RegistrationRequest {
  username: string;
  password: string;
  surname: string; // will be last_name in DB
  name: string;    // will be first_name in DB
  email: string;
  phone?: string;  // optional
  address?: string; // optional
  [key: string]: any; // for any additional fields
}

interface EnhancedRequest extends Request {
  body: RegistrationRequest;
}

/**
 * Check if user registration is enabled
 * @returns Promise<boolean> - true if registration is enabled, false otherwise
 */
const isRegistrationEnabled = async (): Promise<boolean> => {
  try {
    const registrationSetting = getSetting('UsersManagement.RegistrationPage', 'registration.page.enabled');
    
    if (!registrationSetting) {
      console.warn('Registration setting not found in cache, defaulting to disabled');
      return false;
    }
    
    return Boolean(registrationSetting.value);
  } catch (error) {
    console.error('Error checking registration setting:', error);
    return false; // Default to disabled on error
  }
};

/**
 * Log registration attempt with appropriate event
 * @param req Express request object
 * @param isEnabled Whether registration is enabled
 * @param reason Optional reason for blocking
 */
const logRegistrationAttempt = async (req: EnhancedRequest, isEnabled: boolean, reason?: string): Promise<void> => {
  try {
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    
    if (isEnabled) {
      // Log registration attempt
      await fabricEvents.createAndPublishEvent({
        eventName: ACCOUNT_REGISTRATION_EVENTS.REGISTRATION_ATTEMPT.eventName,
        req,
        payload: {
          username: req.body.username,
          email: req.body.email,
          clientIP,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      // Log blocked registration attempt
      await fabricEvents.createAndPublishEvent({
        eventName: ACCOUNT_REGISTRATION_EVENTS.REGISTRATION_BLOCKED.eventName,
        req,
        payload: {
          username: req.body.username,
          email: req.body.email,
          clientIP,
          reason: reason || 'registration disabled by setting',
          timestamp: new Date().toISOString()
        }
      });
    }
  } catch (error) {
    console.error('Error logging registration attempt:', error);
  }
};

/**
 * Log settings check event
 * @param req Express request object
 * @param settingFound Whether the setting was found
 */
const logSettingsCheck = async (req: EnhancedRequest, settingFound: boolean): Promise<void> => {
  try {
    if (settingFound) {
      await fabricEvents.createAndPublishEvent({
        eventName: ACCOUNT_REGISTRATION_EVENTS.REGISTRATION_SETTINGS_CHECK.eventName,
        req,
        payload: {
          settingName: 'registration.page.enabled',
          sectionPath: 'UsersManagement.RegistrationPage',
          settingFound: true,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      await fabricEvents.createAndPublishEvent({
        eventName: ACCOUNT_REGISTRATION_EVENTS.REGISTRATION_SETTINGS_NOT_FOUND.eventName,
        req,
        payload: {
          settingName: 'registration.page.enabled',
          sectionPath: 'UsersManagement.RegistrationPage',
          settingFound: false,
          timestamp: new Date().toISOString()
        }
      });
    }
  } catch (error) {
    console.error('Error logging settings check:', error);
  }
};

/**
 * User registration controller logic
 * Handles user registration requests with settings validation
 * @param req Express request with registration data
 * @param res Express response
 */
const registerUserControllerLogic = async (req: EnhancedRequest, res: Response): Promise<void> => {
  try {
    // Log settings check
    const registrationSetting = getSetting('UsersManagement.RegistrationPage', 'registration.page.enabled');
    await logSettingsCheck(req, !!registrationSetting);
    
    // Check if registration is enabled
    const isEnabled = await isRegistrationEnabled();
    
    if (!isEnabled) {
      // Log blocked attempt
      await logRegistrationAttempt(req, false, 'registration disabled by setting');
      
      // Return 403 Forbidden
      res.status(403).json({
        message: 'user registration is disabled',
        error: 'registration_disabled'
      });
      return;
    }
    
    // Log successful attempt
    await logRegistrationAttempt(req, true);
    
    // Delegate to service layer
    await registerUserService(req, res);
    return; // Important: return after service handles the response
    
  } catch (error) {
    console.error('Registration controller error:', error);
    
    // Log failed attempt
    await fabricEvents.createAndPublishEvent({
      eventName: ACCOUNT_REGISTRATION_EVENTS.REGISTRATION_FAILED.eventName,
      req,
      payload: {
        username: req.body.username,
        email: req.body.email,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      errorData: error instanceof Error ? error.message : String(error)
    });
    
    // Return 500 Internal Server Error
    res.status(500).json({
      message: 'registration failed',
      error: 'internal_server_error'
    });
  }
};

/**
 * User registration controller middleware
 * Wraps the controller logic with connection handler
 */
const registerUserController = connectionHandler(registerUserControllerLogic, 'registerUserController');

// Export for ES modules
export default registerUserController;
