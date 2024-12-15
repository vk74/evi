const { pool } = require('../db/maindb');
const { userQueries } = require('./queries.users');

const updateUserProfile = async (req, res) => {
   console.log('Received request for user profile data update');

   const username = req.user.username;
   console.log('Processing update for user:', username);

   if (!username) {
       console.error('Request does not contain username');
       return res.status(400).json({
           message: 'Username is required'
       });
   }

   const {
       first_name,
       last_name,
       middle_name,
       gender,
       phone_number,
       email,
       address,
       company_name,
       position
   } = req.body;

   console.log('Received profile update data:', {
       first_name,
       last_name,
       middle_name,
       gender,
       phone_number,
       email,
       address,
       company_name,
       position
   });

   try {
       const values = [
           first_name,
           last_name,
           middle_name,
           gender,
           phone_number,
           address,
           company_name,
           position,
           username
       ];

       console.log('Executing profile update query with values:', values);
       
       const { rows } = await pool.query(
           userQueries.updateProfile,
           values
       );

       if (rows.length > 0) {
           console.log('Profile successfully updated for user:', username);
           return res.json(rows[0]);
       } else {
           console.error('Profile not found for user:', username);
           return res.status(404).json({
               message: 'User profile not found'
           });
       }

   } catch (error) {
       console.error('Error updating profile:', error);
       return res.status(500).json({
           message: 'Failed to update profile',
           details: error.message
       });
   }
};

module.exports = updateUserProfile;