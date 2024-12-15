// File purpose: Routes for catalog module - handles retrieval of services information for catalog display

const express = require('express');
const router = express.Router();
const { pool } = require('../db/maindb');
const validateJWT = require('../guards/auth.validate.jwt');
const getUserUUID = require('../middleware/users.get.uuid');

// Get services in production status
const getProductionServices = async (req, res) => {
  console.log('API: Received request for production services');
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

// Get service details by ID
const getServiceDetails = async (req, res) => {
  console.log('API: Received request for service details, ID:', req.params.id);
  try {
    const query = `
      SELECT 
        sd.*
      FROM app.service_details sd
      WHERE sd.service_id = $1
    `;
    console.log('API: Executing details query');

    const result = await pool.query(query, [req.params.id]);
    
    if (result.rows.length === 0) {
      console.log('API: No details found for service');
      return res.status(404).json({ 
        message: 'Service details not found',
        details: null 
      });
    }

    console.log('API: Sending service details');
    res.status(200).json({
      details: result.rows[0]
    });

  } catch (error) {
    console.error('API: Error fetching service details:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to fetch service details' 
    });
  }
};

// Routes
router.get('/api/catalog/services', validateJWT, getUserUUID, getProductionServices);
router.get('/api/catalog/services/:id/details', validateJWT, getUserUUID, getServiceDetails);

module.exports = router;