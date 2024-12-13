const bcrypt = require('bcrypt');
const { pool } = require('../db/maindb');
const { userQueries } = require('../features/admin/users/queries.users');

const checkAccountPassword = async (req, res, next) => {
   const { username, password } = req.body;

   if (!username || !password) {
       console.log('Password check failed: Missing credentials');
       return res.status(400).json({ 
           message: 'Username and password are required' 
       });
   }

   try {
       console.log("Password check for user:", username);
       
       const userResult = await pool.query(
           userQueries.getUserPassword,
           [username]
       );

       if (userResult.rows.length === 0) {
           console.log("Password check failed: User not found");
           return res.status(401).json({ 
               message: 'Invalid credentials' 
           });
       }

       const { user_id, hashed_password } = userResult.rows[0];
       const isValid = await bcrypt.compare(password, hashed_password);

       if (isValid) {
           console.log("Password check successful for user:", username);
           req.user = { 
               user_id,
               username 
           };
           next();
       } else {
           console.log("Password check failed: Invalid password for user:", username);
           return res.status(401).json({ 
               message: 'Invalid credentials' 
           });
       }

   } catch (error) {
       console.error('Error checking account password:', error);
       return res.status(500).json({
           message: 'Server error during authentication',
           details: error.message
       });
   }
};

module.exports = checkAccountPassword;