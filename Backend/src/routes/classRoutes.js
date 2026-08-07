const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const {
  getClasses,
  createClass,
  getClass,
  updateClass,
  deleteClass,
} = require('../controllers/classController');

router.use(protect);

router.route('/').get(getClasses).post(createClass);
router.route('/:id').get(getClass).patch(updateClass).delete(deleteClass);

module.exports = router;
