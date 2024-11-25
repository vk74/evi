// File purpose: Routes for catalog services - handles retrieval of service information for catalog display

const express = require('express');
const router = express.Router();
const { pool } = require('../db/maindb');
const validateJWT = require('../guards/auth.validate.jwt');
const getUserUUID = require('../middleware/users.get.uuid');

// Get services in production status
const getProductionServices = async (req, res) => {
    console.log('API: Received request for services in production state');
    try {
      const query = `
        SELECT 
          service_id,
          service_name,
          service_description_short,
          service_visibility,
          service_tile_width_closed,
          service_tile_height_closed
        FROM app.services 
        WHERE service_status = 'in_production'::app.service_status
        ORDER BY service_name
      `;
      console.log('API: Executing query:', query);
  
      const result = await pool.query(query);
      console.log('API: Query executed, found', result.rows.length, 'services');
      
      if (result.rows.length === 0) {
        console.log('API: No services found');
        return res.status(200).json({ 
          message: 'No services in production found',
          services: [] 
        });
      }
  
      console.log('API: Sending response with services');
      res.status(200).json({
        services: result.rows
      });
  
    } catch (error) {
      console.error('API: Error fetching production services:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to fetch services' 
      });
    }
  };

// Route for getting production services list
router.get('/api/catalog/services', validateJWT, getUserUUID, getProductionServices);

module.exports = router;