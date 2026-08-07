const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const { getMe, updateMe, getDashboard } = require('../controllers/userController');

router.use(protect); // everything below requires a valid JWT

router.get('/me', getMe);
router.patch('/me', updateMe);
router.get('/me/dashboard', getDashboard);

module.exports = router;
