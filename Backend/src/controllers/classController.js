const Class = require('../models/Class');

// GET /api/classes
exports.getClasses = async (req, res) => {
  const classes = await Class.find({ user: req.userId }).sort('-createdAt');
  res.json(classes);
};

// POST /api/classes
exports.createClass = async (req, res) => {
  const newClass = await Class.create({ ...req.body, user: req.userId });
  res.status(201).json(newClass);
};

// GET /api/classes/:id
exports.getClass = async (req, res) => {
  const foundClass = await Class.findOne({ _id: req.params.id, user: req.userId });
  if (!foundClass) return res.status(404).json({ message: 'Class not found' });
  res.json(foundClass);
};

// PATCH /api/classes/:id
exports.updateClass = async (req, res) => {
  const updated = await Class.findOneAndUpdate(
    { _id: req.params.id, user: req.userId },
    req.body,
    { new: true, runValidators: true }
  );
  if (!updated) return res.status(404).json({ message: 'Class not found' });
  res.json(updated);
};

// DELETE /api/classes/:id
exports.deleteClass = async (req, res) => {
  const deleted = await Class.findOneAndDelete({ _id: req.params.id, user: req.userId });
  if (!deleted) return res.status(404).json({ message: 'Class not found' });
  res.json({ message: 'Class deleted' });
};
