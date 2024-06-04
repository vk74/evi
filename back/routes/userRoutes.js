// module for declaration of user account related routes and calling related route guards

const express = require('express');
const router = express.Router();
// const validateJWT = require('../guards/validateJWT');
const checkAccountPassword = require('../guards/checkAccountPassword');
const checkAccountStatus = require('../guards/checkAccountStatus');
const issueToken = require('../middleware/issueToken');
const registerNewUser = require('../middleware/registerNewUser');
const changeUserPassword = require('../middleware/chaneUserPassword');
const getUserProfile = require('../middleware/getUserProfile');
const extendToken = require('../middleware/extendToken');

router.post('/register', registerNewUser);
router.post('/login', checkAccountPassword, checkAccountStatus, issueToken);
router.post('/changeuserpass', changeUserPassword);
router.get('/profile', checkAccountStatus, getUserProfile);
router.post('/extendtoken', extendToken);

/* router.post('/extendtoken', (req, res) => {
    res.status(501).send('продление токена ещё не реализовано');
  });  */ 


// route to update user profile, used in ModuleAccount.vue
// router.patch('/profile', checkAccountStatus, updateUserProfile);

module.exports = router;