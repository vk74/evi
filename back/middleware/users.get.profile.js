const { pool } = require('../db/maindb');
const { userQueries } = require('../features/admin/users/queries.users');

const getUserProfile = async (req, res) => {
   const username = req.user.username;

   if (!username) {
       console.log('Get profile failed: Username is missing');
       return res.status(400).json({
           message: 'Username is required'
       });
   }

   try {
       console.log('Retrieving profile data for user:', username);
       
       const { rows } = await pool.query(
           userQueries.getProfile,
           [username]
       );

       if (rows.length > 0) {
           console.log('Profile data found for user:', username);
           return res.json(rows[0]);
       } else {
           console.log('Profile not found for user:', username);
           return res.status(404).json({
               message: 'User profile not found'
           });
       }

   } catch (error) {
       console.error('Error in getUserProfile:', error);
       return res.status(500).json({
           message: 'Internal server error',
           details: error.message
       });
   }
};

module.exports = getUserProfile;