// module for declaration of user account related routes and calling related route guards
const express = require('express');
const router = express.Router();
const validateJWT = require('../guards/auth.validate.jwt');
const checkAccountPassword = require('../guards/auth.check.password');
const checkAccountStatus = require('../guards/auth.check.status');
const issueToken = require('../middleware/auth.issue.token');
const registerUser = require('../middleware/auth.register.user');
const changeUserPassword = require('../middleware/users.change.password');
const getUserProfile = require('../middleware/users.get.profile');
const updateUserProfile = require('../middleware/users.update.profile');
//const extendToken = require('../middleware/auth.extend.token');

router.post('/register', registerUser);
router.post('/login', checkAccountPassword, checkAccountStatus, issueToken);
router.post('/changeuserpass', changeUserPassword);
router.get('/profile', validateJWT, getUserProfile);
router.post('/profile', validateJWT, updateUserProfile);
//router.post('/extendtoken', extendToken);

module.exports = router;