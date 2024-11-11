const { pool } = require('../db/maindb');

const getUserProfile = async (req, res) => {
    const username = req.user.username;

    if (!username) {
        console.log('Get profile failed: Username is missing');
        return res.status(400).json({ 
            message: 'Username is required' 
        });
    }

    try {
        const query = `
            SELECT
                u.email,
                up.first_name,
                up.last_name,
                up.middle_name,
                up.phone_number,
                up.address,
                up.company_name,
                up.position,
                up.gender
            FROM app.users u
            JOIN app.user_profiles up ON u.user_id = up.user_id
            WHERE u.username = $1
        `;

        const { rows } = await pool.query(query, [username]);

        if (rows.length > 0) {
            console.log('Profile data found for user:', username);
            res.json(rows[0]);
        } else {
            console.log('Profile not found for user:', username);
            res.status(404).json({ 
                message: 'User profile not found' 
            });
        }

    } catch (error) {
        console.error('Error in getUserProfile:', error);
        res.status(500).json({ 
            message: 'Internal server error',
            details: error.message 
        });
    }
};

module.exports = getUserProfile;