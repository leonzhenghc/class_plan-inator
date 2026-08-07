const User = require('../models/User');
const Assignment = require('../models/Assignment');

// GET /api/users/me
exports.getMe = async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
};

// PATCH /api/users/me
exports.updateMe = async (req, res) => {
  const allowedFields = ['fullName', 'displayName', 'pomodoroSettings', 'notifications'];
  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const user = await User.findByIdAndUpdate(req.userId, updates, {
    new: true,
    runValidators: true,
  });
  res.json(user);
};

// GET /api/users/me/dashboard
// Powers the "Welcome back" dashboard: assignments due today + upcoming
exports.getDashboard = async (req, res) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const [user, dueToday, upcoming] = await Promise.all([
    User.findById(req.userId),
    Assignment.countDocuments({
      user: req.userId,
      dueDate: { $gte: startOfToday, $lte: endOfToday },
    }),
    Assignment.find({ user: req.userId, dueDate: { $gte: startOfToday } })
      .sort('dueDate')
      .limit(5)
      .populate('class', 'name code'),
  ]);

  res.json({
    displayName: user.displayName,
    focusScore: user.focusScore,
    currentStreak: user.currentStreak,
    assignmentsDueToday: dueToday,
    upcomingAssignments: upcoming,
  });
};
