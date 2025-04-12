// server.js
// Main backend application entry point.
// - Sets up Express server and middleware
// - Loads application settings and encryption keys 
// - Registers API routes
// - Handles server startup and shutdown

require('module-alias/register');
const express = require('express');
const userRoutes = require('@/routes/routes.users'); 
const servicesRoutes = require('@/routes/routes.services'); 
const catalogRoutes = require('@/routes/routes.catalog');
const adminRoutes = require('@/features/admin/routes.admin');
const coreRoutes = require ('@/core/routes/routes.core');
const workRoutes = require('@/features/work/routes.work');
const { loadSettings } = require('@/core/services/settings/service.load.settings');

const ExcelJS = require('exceljs');
const bodyParser = require('body-parser');
const cors = require('cors');
const { insertData, getLocations } = require('@/db/database');
const fs = require('fs');

const port = 3000;
const app = express();

// Settings ready flag
let settingsLoaded = false;

// Middleware to check if settings are loaded
const checkSettingsLoaded = (req, res, next) => {
  if (!settingsLoaded) {
    return res.status(503).json({
      success: false,
      message: 'Server is starting up. Settings are being loaded. Please try again in a moment.'
    });
  }
  next();
};

async function initializeServer() {
  try {
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
    console.log('Application settings loaded successfully');

    // 3. Setting up middleware
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

    // 4. Add settings loading check middleware for all routes
    app.use(checkSettingsLoaded);

    // 5. Route registration
    app.use(userRoutes);
    app.use(servicesRoutes);
    app.use(catalogRoutes);
    app.use(adminRoutes);
    app.use(coreRoutes);
    app.use(workRoutes);

    // 6. Base route
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
        console.log('Received request:', req.body);
        const { orgname, region, location, checkbox, radioOption, date } = req.body;
        const result = await insertData(orgname, region, location, checkbox, radioOption, date);
        res.status(200).json(result);
      } catch (error) {
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
      } catch (error) {
        console.error('Error generating Excel file:', error);
        res.status(500).send('Error generating Excel file');
      }
    });


    /*  Version with direct file saving to backend server filesystem

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

        // Add data to file
        worksheet.addRow({ field: 'Organization Name', value: formData.orgname });
        worksheet.addRow({ field: 'Country / Region', value: formData.region });
        worksheet.addRow({ field: 'Location', value: formData.location });
        worksheet.addRow({ field: 'Monitoring Station Deployed', value: formData.checkbox ? 'Yes' : 'No' });
        worksheet.addRow({ field: 'Selected Option', value: formData.radio });
        worksheet.addRow({ field: 'Date Filled', value: formData.date });

        const filePath = '/Users/vit/Documents/code/output/estimatorFile1.xlsx'; // Path to save file
        await workbook.xlsx.writeFile(filePath);
        
        res.status(200).send('Excel file generated successfully');

        // Save file
        const fileName = 'estimatorFile.xlsx';
        await workbook.xlsx.writeFile(fileName);

        // Send file to client
        res.download(fileName, (err) => {
          if (err) {
            console.error('Error sending file:', err);
            res.status(500).send('Error sending file');
          }
          
          // Delete file after sending
          fs.unlink(fileName, (unlinkErr) => {
            if (unlinkErr) {
              console.error('Error deleting file:', unlinkErr);
            }
          });
        });
      } catch (error) {
        console.error('Error generating Excel file:', error);
        res.status(500).send('Error generating Excel file');
      }
    });
    */

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

      console.log(`[${timestamp}] Server listening at http://localhost:${port}`);
    });

  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
}

// Start server initialization
initializeServer();