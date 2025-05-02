/**
 * Main server file
 * 
 * This is the entry point for the backend server.
 * It handles server initialization, middleware setup, and route registration.
 * 
 * Created: 2022-08-15
 * Last modified: 2023-11-20
 */

require('module-alias/register');
const express = require('express');
const userRoutes = require('@/routes/routes.users'); 
const servicesRoutes = require('@/routes/routes.services'); 
const catalogRoutes = require('@/routes/routes.catalog');
const adminRoutes = require('@/features/admin/routes.admin');
const coreRoutes = require ('@/core/routes/routes.core');
const workRoutes = require('@/features/work/routes.work');
const { loadSettings } = require('@/core/services/settings/service.load.settings');

// Import event bus system
const { eventBus } = require('@/core/eventBus/bus.events');
const fabricEvents = require('@/core/eventBus/fabric.events').default;
// Import event reference cache
const { initializeEventCache, getCachedEventSchema } = require('@/core/eventBus/reference/cache.reference.events');

// Import centralized logger
const { 
  createSystemLgr, 
  Events,
  OperationType
} = require('@/core/lgr/lgr.index');

// Import new logger system
const loggerService = require('@/core/logger/service.logger').default;
const loggerSubscriptions = require('@/core/logger/subscriptions.logger').default;

const ExcelJS = require('exceljs');
const bodyParser = require('body-parser');
const cors = require('cors');
const { insertData, getLocations } = require('@/db/database');
const fs = require('fs');

const port = 3000;
const app = express();

// Create lgr for server
const lgr = createSystemLgr({
  module: 'ServerMain',
  fileName: 'server.js'
});

// Global event factory instance
let eventFactory = null;

// Settings ready flag
let settingsLoaded = false;

// Event cache ready flag
let eventCacheInitialized = false;

// Middleware to check if critical components are loaded
const checkServerReady = (req, res, next) => {
  const notReadyComponents = [];
  
  if (!settingsLoaded) {
    notReadyComponents.push('Settings');
  }
  
  if (!eventCacheInitialized) {
    notReadyComponents.push('Event Cache');
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
    
    return res.status(503).json({
      success: false,
      message: `Server is starting up. Components still initializing: ${notReadyComponents.join(', ')}. Please try again in a moment.`
    });
  }
  next();
};

async function initializeServer() {
  try {
    console.log('Starting server initialization');
    
    // 1. Loading private key
    const privateKeyPath = './src/keys/private_key.pem';
    const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
    global.privateKey = privateKey;

    if (!global.privateKey) {
      throw new Error('Failed to set global.privateKey');
    }
    
    console.log('Global private key set successfully');

    // 2. Loading settings
    console.log('Loading application settings...');
    
    await loadSettings();
    settingsLoaded = true;
    // No duplicate logging here, as loadSettings already logs success message

    // 3. Initialize event system - event bus and event factory
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
      
      console.log('Event system initialized successfully');
      
      // Initialize event reference cache
      console.log('Initializing event reference cache...');
      initializeEventCache();
      eventCacheInitialized = true;
      console.log('Event reference cache initialized successfully');
      
      // Initialize logger service with event bus integration
      loggerService.initialize();
      loggerSubscriptions.initializeSubscriptions();
      console.log('Logger system initialized successfully');
    } catch (eventError) {
      console.error('Failed to initialize event system:', eventError);
      throw eventError;
    }

    // 4. Setting up middleware
    // Configure CORS for frontend only
    app.use(cors({
      origin: 'http://localhost:8080', // Allow access only from this source
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allowed methods
      allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
      credentials: true // Allow sending cookies
    }));
    
    app.use(express.json());
    //app.use('/profile', getUserProfile); // Route registration
    app.use(bodyParser.json());

    console.log('Middleware configuration completed');

    // 5. Add server readiness check middleware for all routes
    app.use(checkServerReady);

    // 6. Route registration
    app.use(userRoutes);
    app.use(servicesRoutes);
    app.use(catalogRoutes);
    app.use(adminRoutes);
    app.use(coreRoutes);
    app.use(workRoutes);

    console.log('All routes registered successfully');

    // 7. Base route
    app.get('/', (req, res) => {
      res.send('Backend server is running');
    });

    ////////////////////////// Excel route prototypes ////////////////////////// 

    // Route to get locations list
    app.get('/protolocations', async (req, res) => {
      try {
        const locations = await getLocations();
        res.status(200).json(locations);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Route to save prototype form data to postgres database
    app.post('/protosubmit', async (req, res) => {
      try {
        // Debug line
        lgr.debug({
          code: Events.CORE.EXCEL.PROTOTYPE.SUCCESS.code,
          message: 'Received request for form submission',
          details: { body: req.body }
        });
        
        const { orgname, region, location, checkbox, radioOption, date } = req.body;
        const result = await insertData(orgname, region, location, checkbox, radioOption, date);
        res.status(200).json(result);
      } catch (error) {
        lgr.error({
          code: Events.CORE.EXCEL.PROTOTYPE.ERROR.code,
          message: 'Error processing form submission',
          error
        });
        
        res.status(500).json({ error: error.message });
      }
    });

    // Route to generate Excel file to user-selected directory
    app.post('/proto-generate-excel', async (req, res) => {
      try {
        // Data from request
        const formData = req.body;
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Data Sheet');

        // Write headers
        worksheet.columns = [
          { header: 'Field', key: 'field', width: 30 },
          { header: 'Value', key: 'value', width: 30 }
        ];

        // Add data to rows
        worksheet.addRow({ field: 'Organization Name', value: formData.orgname });
        worksheet.addRow({ field: 'Country / Region', value: formData.region });
        worksheet.addRow({ field: 'Location', value: formData.location });
        worksheet.addRow({ field: 'Monitoring Station Deployed', value: formData.checkbox ? 'Yes' : 'No' });
        worksheet.addRow({ field: 'Selected Option', value: formData.radio });
        worksheet.addRow({ field: 'Date Filled', value: formData.date });

        // Instead of saving file on server, send it to client
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=estimatorFile.xlsx');
        await workbook.xlsx.write(res);
        res.end();
        
        lgr.info({
          code: Events.CORE.EXCEL.PROTOTYPE.SUCCESS.code,
          message: 'Excel file generated and sent successfully',
          details: {
            username: req.user?.username
          }
        });
      } catch (error) {
        lgr.error({
          code: Events.CORE.EXCEL.PROTOTYPE.ERROR.code,
          message: 'Error generating Excel file',
          error
        });
        
        res.status(500).send('Error generating Excel file');
      }
    });




    ////////////////////////// End of Excel route prototypes ////////////////////////// 

    // 8. Server startup
    app.listen(port, () => {
      const now = new Date();
      const dateOptions = { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
      };
      const timeOptions = { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: false
      };

      const formattedDate = now.toLocaleDateString('en-GB', dateOptions);
      const formattedTime = now.toLocaleTimeString('en-US', timeOptions);
      const timestamp = `${formattedDate}, ${formattedTime}`;

      console.log(`Server listening at http://localhost:${port} | ${timestamp}`);
    });

    console.log('Server initialization completed successfully');

  } catch (error) {
    console.error('Failed to initialize server:', error);
    
    process.exit(1);
  }
}

// Start server initialization
initializeServer();