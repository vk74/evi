// /back/middleware/getUserProfile.js
const pool = require('../db/maindb');

// get user profile data by using his username
async function getUserProfile(username) {
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
        FROM users u
        JOIN user_profiles up ON u.id = up.user_id
        WHERE u.username = $1;
      `;
  
      const { rows } = await pool.query(query, [username]);
      if (rows.length > 0) {
        return rows[0]; // return first row if username was found
      } else {
        throw new Error('User not found');
      }
    } catch (error) {
      console.error('Error in getUserProfile:', error);
      throw error;
    }
  }
  
  module.exports = getUserProfile;