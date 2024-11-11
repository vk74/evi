// module for declaration of user account related routes and calling related route guards
const express = require('express');
const router = express.Router();
const validateJWT = require('../guards/validateJWT');
const checkAccountPassword = require('../guards/checkAccountPassword');
const checkAccountStatus = require('../guards/checkAccountStatus');
const issueToken = require('../middleware/issueToken');
const registerUser = require('../middleware/auth.register.user');
const changeUserPassword = require('../middleware/changeUserPassword');
const getUserProfile = require('../middleware/getUserProfile');
const updateUserProfile = require('../middleware/updateUserProfile');
const extendToken = require('../middleware/extendToken');

router.post('/register', registerUser);
router.post('/login', checkAccountPassword, checkAccountStatus, issueToken);
router.post('/changeuserpass', changeUserPassword);
router.get('/profile', validateJWT, getUserProfile);
router.post('/profile', validateJWT, updateUserProfile);
router.post('/extendtoken', extendToken);

module.exports = router;