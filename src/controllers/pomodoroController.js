const supabase = require('../config/supabaseClient');

// POST /api/pomodoro/sessions
exports.logSession = async (req, res) => {
  const { activeTaskLabel, type, durationMinutes } = req.body;

  const { data, error } = await supabase
    .from('pomodoro_sessions')
    .insert({
      user_id: req.userId,
      active_task_label: activeTaskLabel,
      type: type || 'focus',
      duration_minutes: durationMinutes,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ message: error.message });
  res.status(201).json(data);
};

// GET /api/pomodoro/sessions/today
exports.getTodaySessions = async (req, res) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('pomodoro_sessions')
    .select('*')
    .eq('user_id', req.userId)
    .gte('completed_at', startOfToday.toISOString())
    .order('completed_at', { ascending: false });

  if (error) return res.status(500).json({ message: error.message });

  const focusSessionsCompleted = data.filter((s) => s.type === 'focus').length;
  res.json({ sessions: data, focusSessionsCompleted });
};
