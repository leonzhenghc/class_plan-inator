const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const { logSession, getTodaySessions } = require('../controllers/pomodoroController');

router.use(protect);

router.post('/sessions', logSession);
router.get('/sessions/today', getTodaySessions);

module.exports = router;
