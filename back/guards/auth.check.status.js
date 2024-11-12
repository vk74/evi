const { pool } = require('../db/maindb');
const { userQueries } = require('../queries/users.queries');

const checkAccountStatus = async (req, res, next) => {
   const { username } = req.body;

   if (!username) {
       console.log('Status check failed: Missing username');
       return res.status(400).json({
           message: 'Username is required'
       });
   }

   try {
       console.log("Checking account status for user:", username);
       
       const queryResult = await pool.query(
           userQueries.getUserStatus,
           [username]
       );

       if (queryResult.rows.length === 0) {
           console.log("Status check failed: User not found");
           return res.status(404).json({
               message: 'User not found'
           });
       }

       const { account_status } = queryResult.rows[0];
       
       if (account_status === 'disabled') {
           console.log("Status check failed: Account is disabled for user:", username);
           return res.status(403).json({
               message: 'Account is disabled'
           });
       }

       console.log("Status check successful for user:", username);
       next();

   } catch (error) {
       console.error('Error checking account status:', error);
       return res.status(500).json({
           message: 'Server error during account status check',
           details: error.message
       });
   }
};

module.exports = checkAccountStatus;