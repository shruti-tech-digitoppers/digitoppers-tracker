const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const { protect } = require('../../core/auth');

router.post('/login', authController.login);
router.get('/me', protect, authController.getMe);
router.post('/logout', protect, authController.logout);

module.exports = router;
