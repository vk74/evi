const bcrypt = require('bcrypt');
const { pool } = require('../db/maindb');
const { userQueries } = require('../features/admin/users/queries.users');

const changeUserPassword = async (req, res) => {
   const { username, currentPassword, newPassword } = req.body;

   if (!username || !currentPassword || !newPassword) {
       console.log('Password change failed: Missing required fields');
       return res.status(400).json({
           success: false,
           message: 'Username, current password and new password are required'
       });
   }

   console.log('Starting password change process for user:', username);

   // Проверка длины пароля
   if (newPassword.length < 8 || newPassword.length > 40) {
       console.log('Password change failed: Invalid password length');
       return res.status(400).json({
           success: false,
           message: 'Password length must be between 8 and 40 characters'
       });
   }

   // Проверка регулярного выражения
   const regex = /^[a-zA-Zа-яА-Я0-9\p{P}]+$/u;
   if (!regex.test(newPassword)) {
       console.log('Password change failed: Invalid password format');
       return res.status(400).json({
           success: false,
           message: 'Password must contain only letters, numbers, and punctuation marks'
       });
   }

   try {
       // Получение текущего хешированного пароля
       const userResult = await pool.query(
           userQueries.getUserPassword,
           [username]
       );

       if (userResult.rows.length === 0) {
           console.log('Password change failed: User not found:', username);
           return res.status(404).json({
               success: false,
               message: 'User not found'
           });
       }

       // Проверка текущего пароля
       const hashedCurrentPassword = userResult.rows[0].hashed_password;
       const isMatch = await bcrypt.compare(currentPassword, hashedCurrentPassword);

       if (!isMatch) {
           console.log('Password change failed: Invalid current password for user:', username);
           return res.status(400).json({
               success: false,
               message: 'Current password is incorrect'
           });
       }

       // Хеширование и обновление пароля
       const hashedNewPassword = await bcrypt.hash(newPassword, 10);
       
       const updateResult = await pool.query(
           userQueries.updatePassword,
           [hashedNewPassword, username]
       );

       if (updateResult.rows.length > 0) {
           console.log('Password successfully changed for user:', username);
           return res.status(200).json({
               success: true,
               username: updateResult.rows[0].username
           });
       } else {
           console.log('Password change failed: User not found during update:', username);
           return res.status(404).json({
               success: false,
               message: 'User not found'
           });
       }

   } catch (error) {
       console.error('Error during password change:', error);
       return res.status(500).json({
           success: false,
           message: 'Failed to change password',
           details: error.message
       });
   }
};

module.exports = changeUserPassword;