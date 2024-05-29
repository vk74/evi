const pool = require('../db/maindb').pool;

const checkAccountStatus = async (req, res, next) => {
    const { username } = req.body; // get username from request

    try {
        const queryResult = await pool.query('SELECT account_status FROM users WHERE username = $1', [username]);
        if (queryResult.rows.length === 0) {
            return res.status(404).send('User not found');
        }

        const { account_status } = queryResult.rows[0];
        if (account_status === 'disabled') {
            return res.status(403).send('Account is disabled');
        }

        next(); // transfer execution to next guard or controller in case if user account is enabled
    } catch (error) {
        console.error('Error checking account status:', error.message);
        res.status(500).send('Server error during account status check');
    }
};

module.exports = checkAccountStatus;
