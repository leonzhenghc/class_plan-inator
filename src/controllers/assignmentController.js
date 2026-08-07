const supabase = require('../config/supabaseClient');

// GET /api/assignments  (supports ?classId=&status=)
exports.getAssignments = async (req, res) => {
  let query = supabase
    .from('assignments')
    .select('*, classes(name, code)')
    .eq('user_id', req.userId)
    .order('due_date', { ascending: true });

  if (req.query.classId) query = query.eq('class_id', req.query.classId);
  if (req.query.status) query = query.eq('status', req.query.status);

  const { data, error } = await query;
  if (error) return res.status(500).json({ message: error.message });
  res.json(data);
};

// POST /api/assignments
exports.createAssignment = async (req, res) => {
  const { title, dueDate, classId, status, source } = req.body;

  const { data, error } = await supabase
    .from('assignments')
    .insert({
      user_id: req.userId,
      class_id: classId,
      title,
      due_date: dueDate,
      status: status || 'TO DO',
      source: source || 'manual',
    })
    .select()
    .single();

  if (error) return res.status(500).json({ message: error.message });

  // keep the parent class's total_assignments count in sync
  await bumpClassCount(classId, 'total_assignments', +1);

  res.status(201).json(data);
};

// PATCH /api/assignments/:id
exports.updateAssignment = async (req, res) => {
  const { data: existing, error: findError } = await supabase
    .from('assignments')
    .select('*')
    .eq('id', req.params.id)
    .eq('user_id', req.userId)
    .single();

  if (findError || !existing) return res.status(404).json({ message: 'Assignment not found' });

  const wasComplete = existing.status === 'COMPLETE';

  const updates = {};
  if (req.body.title) updates.title = req.body.title;
  if (req.body.dueDate) updates.due_date = req.body.dueDate;
  if (req.body.status) updates.status = req.body.status;

  const { data: updated, error } = await supabase
    .from('assignments')
    .update(updates)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ message: error.message });

  const isNowComplete = updated.status === 'COMPLETE';
  if (!wasComplete && isNowComplete) {
    await bumpClassCount(existing.class_id, 'completed_assignments', +1);
  } else if (wasComplete && !isNowComplete) {
    await bumpClassCount(existing.class_id, 'completed_assignments', -1);
  }

  res.json(updated);
};

// DELETE /api/assignments/:id
exports.deleteAssignment = async (req, res) => {
  const { data: existing } = await supabase
    .from('assignments')
    .select('class_id')
    .eq('id', req.params.id)
    .eq('user_id', req.userId)
    .single();

  if (!existing) return res.status(404).json({ message: 'Assignment not found' });

  const { error } = await supabase
    .from('assignments')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.userId);

  if (error) return res.status(500).json({ message: error.message });

  await bumpClassCount(existing.class_id, 'total_assignments', -1);
  res.json({ message: 'Assignment deleted' });
};

// Small helper: read-modify-write a counter column on the classes table.
// (Simple and clear rather than clever — fine at this scale.)
async function bumpClassCount(classId, column, delta) {
  const { data: classRow } = await supabase
    .from('classes')
    .select(column)
    .eq('id', classId)
    .single();

  if (!classRow) return;

  await supabase
    .from('classes')
    .update({ [column]: Math.max(0, classRow[column] + delta) })
    .eq('id', classId);
}
