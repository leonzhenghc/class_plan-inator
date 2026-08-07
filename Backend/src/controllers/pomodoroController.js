const PomodoroSession = require('../models/PomodoroSession');

// POST /api/pomodoro/sessions  - log a completed session
exports.logSession = async (req, res) => {
  const session = await PomodoroSession.create({ ...req.body, user: req.userId });
  res.status(201).json(session);
};

// GET /api/pomodoro/sessions/today  - powers "Activity Log" + "Daily Progress"
exports.getTodaySessions = async (req, res) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const sessions = await PomodoroSession.find({
    user: req.userId,
    completedAt: { $gte: startOfToday },
  }).sort('-completedAt');

  const focusSessionsCompleted = sessions.filter((s) => s.type === 'focus').length;

  res.json({ sessions, focusSessionsCompleted });
};
