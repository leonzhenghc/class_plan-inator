const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const {
  getAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
} = require('../controllers/assignmentController');

router.use(protect);

router.route('/').get(getAssignments).post(createAssignment);
router.route('/:id').patch(updateAssignment).delete(deleteAssignment);

module.exports = router;
