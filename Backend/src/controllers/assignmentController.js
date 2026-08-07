const Assignment = require('../models/Assignment');
const Class = require('../models/Class');

// GET /api/assignments  (supports ?classId=&status=)
exports.getAssignments = async (req, res) => {
  const filter = { user: req.userId };
  if (req.query.classId) filter.class = req.query.classId;
  if (req.query.status) filter.status = req.query.status;

  const assignments = await Assignment.find(filter)
    .sort('dueDate')
    .populate('class', 'name code');
  res.json(assignments);
};

// POST /api/assignments
exports.createAssignment = async (req, res) => {
  const assignment = await Assignment.create({ ...req.body, user: req.userId });

  // keep the parent class's totalAssignments count in sync
  await Class.findByIdAndUpdate(assignment.class, { $inc: { totalAssignments: 1 } });

  res.status(201).json(assignment);
};

// PATCH /api/assignments/:id
exports.updateAssignment = async (req, res) => {
  const existing = await Assignment.findOne({ _id: req.params.id, user: req.userId });
  if (!existing) return res.status(404).json({ message: 'Assignment not found' });

  const wasComplete = existing.status === 'COMPLETE';
  Object.assign(existing, req.body);
  await existing.save();

  const isNowComplete = existing.status === 'COMPLETE';
  if (!wasComplete && isNowComplete) {
    await Class.findByIdAndUpdate(existing.class, { $inc: { completedAssignments: 1 } });
  } else if (wasComplete && !isNowComplete) {
    await Class.findByIdAndUpdate(existing.class, { $inc: { completedAssignments: -1 } });
  }

  res.json(existing);
};

// DELETE /api/assignments/:id
exports.deleteAssignment = async (req, res) => {
  const deleted = await Assignment.findOneAndDelete({ _id: req.params.id, user: req.userId });
  if (!deleted) return res.status(404).json({ message: 'Assignment not found' });

  await Class.findByIdAndUpdate(deleted.class, { $inc: { totalAssignments: -1 } });
  res.json({ message: 'Assignment deleted' });
};
