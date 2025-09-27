/**
 * version: 1.0.04
 * Main server file
 * 
 * This is the entry point for the backend server.
 * It handles server initialization, middleware setup, and route registration.
 * File: server.ts
 * Updated to support httpOnly cookies for refresh tokens.
 */

// Import module-alias for path aliases
import 'module-alias/register';
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import fs from 'fs';


// Import routes
import authRoutes from '@/core/auth/routes.auth';
import catalogRoutes from '@/modules/catalog/routes.catalog';
import adminRoutes from '@/modules/admin/routes.admin';
import coreRoutes from '@/core/routes/routes.core';
import workRoutes from '@/modules/work/routes.work';
import { loadSettings } from '@/modules/admin/settings/service.load.settings';

// Import event bus system
import { eventBus } from '@/core/eventBus/bus.events';
import fabricEvents from '@/core/eventBus/fabric.events';
// Import event reference system for active initialization
import { initializeEventReferenceSystem } from '@/core/eventBus/reference/index.reference.events';

// Import centralized logger
// Removed unused lgr import - system was replaced with new logger

// Import new logger system
import loggerService from '@/core/logger/service.logger';
import loggerSubscriptions from '@/core/logger/subscriptions.logger';

// Import event bus system
import * as eventBusService from '@/core/eventBus/service.eventBus.settings';
import * as eventBusSubscriptions from '@/core/eventBus/subscriptions.eventBus';

// Import database functions


// Import cache helpers
import { initCache as initHelpersCache } from '@/core/helpers/cache.helpers';

// Import connection handler for validation
import { getSetting, parseSettingValue } from '@/modules/admin/settings/cache.settings';

// Import validation service
import { initializeValidationService } from '@/core/validation/init.validation';

/**
 * Validate that connection handler can access rate limiting settings from cache
 * @returns Promise<boolean> indicating if connection handler is ready
 */
async function validateConnectionHandlerReadiness(): Promise<boolean> {
  try {
    console.log('Validating connection handler readiness...');
    
    // Check if all required rate limiting settings are available in cache
    const requiredSettings = [
      { section: 'Application.Security.SessionManagement', name: 'rate.limiting.enabled' },
      { section: 'Application.Security.SessionManagement', name: 'rate.limiting.max.requests.per.minute' },
      { section: 'Application.Security.SessionManagement', name: 'rate.limiting.max.requests.per.hour' },
      { section: 'Application.Security.SessionManagement', name: 'rate.limiting.block.duration.minutes' }
    ];
    
    const missingSettings: string[] = [];
    const loadedSettings: any = {};
    
    // Check each required setting
    for (const setting of requiredSettings) {
      const settingObj = getSetting(setting.section, setting.name);
      if (!settingObj) {
        missingSettings.push(`${setting.section}.${setting.name}`);
        continue;
      }
      
      const value = parseSettingValue(settingObj);
      loadedSettings[setting.name] = value;
      
      // Validate value types
      if (setting.name === 'rate.limiting.enabled' && typeof value !== 'boolean') {
        missingSettings.push(`${setting.section}.${setting.name} (invalid type: expected boolean)`);
      } else if (setting.name !== 'rate.limiting.enabled' && typeof value !== 'number') {
        missingSettings.push(`${setting.section}.${setting.name} (invalid type: expected number)`);
      }
    }
    
    if (missingSettings.length > 0) {
      console.error('Connection handler validation failed - missing or invalid settings:', missingSettings);
      return false;
    }
    
    // Log successful validation
    console.log('Connection handler validation successful - rate limiting settings loaded:', {
      enabled: loadedSettings['rate.limiting.enabled'],
      maxRequestsPerMinute: loadedSettings['rate.limiting.max.requests.per.minute'],
      maxRequestsPerHour: loadedSettings['rate.limiting.max.requests.per.hour'],
      blockDurationMinutes: loadedSettings['rate.limiting.block.duration.minutes']
    });
    
    return true;
  } catch (error) {
    console.error('Connection handler validation failed with error:', error);
    return false;
  }
}

// Define global declarations for TypeScript
declare global {
  var privateKey: string;
}

const port: number = 3000;
const app: Express = express();

// Global event factory instance
let eventFactory: any = null;

// Settings ready flag
let settingsLoaded: boolean = false;

// Event system ready flag
let eventSystemInitialized: boolean = false;

// Connection handler ready flag
let connectionHandlerReady: boolean = false;



// Middleware to check if critical components are loaded
const checkServerReady = (req: Request, res: Response, next: NextFunction): void => {
  const notReadyComponents: string[] = [];
  
  if (!settingsLoaded) {
    notReadyComponents.push('Settings');
  }
  
  if (!eventSystemInitialized) {
    notReadyComponents.push('Event System');
  }
  
  if (!connectionHandlerReady) {
    notReadyComponents.push('Connection Handler');
  }
  
  if (notReadyComponents.length > 0) {
    console.warn(
      'Server is not ready yet, rejecting request',
      {
        path: req.path,
        method: req.method,
        notReadyComponents
      }
    );
    
    res.status(503).json({
      success: false,
      message: `Server is starting up. Components still initializing: ${notReadyComponents.join(', ')}. Please try again in a moment.`
    });
    return;
  }
  next();
};

async function initializeServer(): Promise<void> {
  try {
    console.log('Starting server initialization');

    // 1. Loading private key
    const privateKeyPath = process.env.NODE_ENV === 'production' 
      ? './dist/keys/private_key.pem' 
      : './src/core/keys/private_key.pem';
    const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
    global.privateKey = privateKey;

    if (!global.privateKey) {
      throw new Error('Failed to set global.privateKey');
    }
    
    console.log('Global private key set successfully');

    // 2. Initialize event system - event bus, index, cache and event factory
    try {
      // Check if event bus is available
      if (!eventBus) {
        throw new Error('Event bus not initialized');
      }
      
      // Set global event factory
      eventFactory = fabricEvents;
      
      if (!eventFactory) {
        throw new Error('Failed to load event factory');
      }
      
      console.log('Event bus and factory initialized successfully');
      
      // Actively initialize the event reference system (index and cache)
      console.log('Actively initializing event reference system...');
      await initializeEventReferenceSystem();
      eventSystemInitialized = true;
      
      console.log('Event system initialized successfully');
    } catch (eventError) {
      console.error('Failed to initialize event system:', eventError);
      throw eventError;
    }

    // 3. Initialize helpers cache AFTER event system is ready
    console.log('Initializing helpers cache...');
    initHelpersCache();
    console.log('Helpers cache initialized successfully');

    // 4. Loading settings FIRST (validation service needs settings from DB)
    console.log('Loading application settings...');
    
    await loadSettings();
    settingsLoaded = true;
    console.log('[Server] System settings loaded and ready');

    // 5. Initialize validation service AFTER settings are loaded
    console.log('Initializing validation service...');
    // Create a mock request object for initialization (validation service needs req context)
    const mockReq = {} as Request;
    await initializeValidationService(mockReq);
    console.log('Validation service initialized successfully');

    // 6. Validate connection handler readiness
    console.log('Validating connection handler readiness...');
    const connectionHandlerValid = await validateConnectionHandlerReadiness();
    if (!connectionHandlerValid) {
      throw new Error('Connection handler validation failed - rate limiting settings not available');
    }
    connectionHandlerReady = true;
    console.log('[Server] Connection handler validated and ready');

    // 7. Initialize logger service AFTER settings are loaded
    // This ensures logger can apply correct settings from cache
    loggerService.initialize();
    loggerSubscriptions.initializeSubscriptions();
    console.log('Logger system initialized with current settings');

    // 8. Initialize event bus service AFTER settings are loaded
    // This ensures event bus can apply correct settings from cache
    eventBusService.initialize();
    eventBusSubscriptions.initializeSubscriptions();
    console.log('Event Bus system initialized with current settings');
    // No duplicate logging here, as loadSettings already logs success message

    // 9. Setting up middleware
    // Configure CORS for frontend only
    app.use(cors({
      origin: ['http://localhost:8080', 'http://localhost:3000', 'http://127.0.0.1:8080'], // Allow access from multiple localhost variants
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allowed methods
      allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'], // Allow cookies
      credentials: true, // Allow sending cookies
      exposedHeaders: ['Set-Cookie'] // Expose Set-Cookie header
    }));
    
    app.use(express.json());
    app.use(cookieParser()); // Add cookie parser middleware
    app.use(bodyParser.json());

    console.log('Middleware configuration completed');

    // 10. Add server readiness check middleware for all routes
    app.use(checkServerReady);

    // 11. Route registration
    app.use(authRoutes);
    app.use('/api/catalog', catalogRoutes);
    app.use(adminRoutes);
    app.use(coreRoutes);
    app.use(workRoutes);

    console.log('All routes registered successfully');

    // 12. Base route
    app.get('/', (req: Request, res: Response) => {
      res.send('Backend server is running');
    });



    // 13. Server startup
    app.listen(port, () => {
      const now = new Date();
      const dateOptions: Intl.DateTimeFormatOptions = { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
      };
      const timeOptions: Intl.DateTimeFormatOptions = { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: false
      };

      const formattedDate = now.toLocaleDateString('en-GB', dateOptions);
      const formattedTime = now.toLocaleTimeString('en-US', timeOptions);
      const timestamp = `${formattedDate}, ${formattedTime}`;

      console.log(`backend system is ready, server is listening at http://localhost:${port} | ${timestamp}`);
    });

    //console.log('Server initialization completed successfully');

  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
}

// Start server initialization
initializeServer();