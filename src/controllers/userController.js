const supabase = require('../config/supabaseClient');

// POST /api/users/sync
// Call this once right after a user signs up on the frontend via Supabase Auth.
// Creates their profiles row if it doesn't exist yet.
exports.syncProfile = async (req, res) => {
  const { fullName, displayName, email } = req.body;

  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: req.userId,
        full_name: fullName,
        display_name: displayName || fullName?.split(' ')[0],
        email,
      },
      { onConflict: 'id', ignoreDuplicates: true }
    )
    .select()
    .single();

  if (error) return res.status(500).json({ message: error.message });
  res.status(201).json(data);
};

// GET /api/users/me
exports.getMe = async (req, res) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', req.userId)
    .single();

  if (error) return res.status(404).json({ message: 'Profile not found' });
  res.json(data);
};

// PATCH /api/users/me
exports.updateMe = async (req, res) => {
  const { fullName, displayName, pomodoroSettings, notifications } = req.body;

  const updates = { updated_at: new Date().toISOString() };
  if (fullName) updates.full_name = fullName;
  if (displayName) updates.display_name = displayName;
  if (pomodoroSettings?.focusLength) updates.pomodoro_focus_length = pomodoroSettings.focusLength;
  if (pomodoroSettings?.breakLength) updates.pomodoro_break_length = pomodoroSettings.breakLength;
  if (notifications?.canvasSyncAlerts !== undefined) updates.notif_canvas_sync = notifications.canvasSyncAlerts;
  if (notifications?.dueDateReminders !== undefined) updates.notif_due_date = notifications.dueDateReminders;
  if (notifications?.deepWorkMode !== undefined) updates.notif_deep_work = notifications.deepWorkMode;

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', req.userId)
    .select()
    .single();

  if (error) return res.status(500).json({ message: error.message });
  res.json(data);
};

// GET /api/users/me/dashboard
exports.getDashboard = async (req, res) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const [{ data: profile }, { count: dueToday }, { data: upcoming, error: upcomingError }] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', req.userId).single(),
      supabase
        .from('assignments')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', req.userId)
        .gte('due_date', startOfToday.toISOString())
        .lte('due_date', endOfToday.toISOString()),
      supabase
        .from('assignments')
        .select('id, title, due_date, status, classes(name, code)')
        .eq('user_id', req.userId)
        .gte('due_date', startOfToday.toISOString())
        .order('due_date', { ascending: true })
        .limit(5),
    ]);

  if (upcomingError) return res.status(500).json({ message: upcomingError.message });

  res.json({
    displayName: profile?.display_name,
    focusScore: profile?.focus_score,
    currentStreak: profile?.current_streak,
    assignmentsDueToday: dueToday || 0,
    upcomingAssignments: upcoming,
  });
};
