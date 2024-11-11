const { pool } = require('../db/maindb');

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
        const query = `
            UPDATE app.user_profiles
            SET first_name = $1,
                last_name = $2,
                middle_name = $3,
                gender = $4,
                phone_number = $5,
                address = $6,
                company_name = $7,
                position = $8
            FROM app.users
            WHERE app.user_profiles.user_id = app.users.user_id
                AND app.users.username = $9
            RETURNING 
                first_name,
                last_name,
                middle_name,
                gender,
                phone_number,
                address,
                company_name,
                position;
        `;

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

        const { rows } = await pool.query(query, values);

        if (rows.length > 0) {
            console.log('Profile successfully updated for user:', username);
            res.json(rows[0]);
        } else {
            console.error('Profile not found for user:', username);
            res.status(404).json({ 
                message: 'User profile not found' 
            });
        }

    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ 
            message: 'Failed to update profile',
            details: error.message 
        });
    }
};

module.exports = updateUserProfile;