const supabase = require('../config/supabaseClient');

// GET /api/classes
exports.getClasses = async (req, res) => {
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .eq('user_id', req.userId)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ message: error.message });
  res.json(data);
};

// POST /api/classes
exports.createClass = async (req, res) => {
  const { name, code, instructor, category, semester } = req.body;

  const { data, error } = await supabase
    .from('classes')
    .insert({ user_id: req.userId, name, code, instructor, category, semester })
    .select()
    .single();

  if (error) return res.status(500).json({ message: error.message });
  res.status(201).json(data);
};

// GET /api/classes/:id
exports.getClass = async (req, res) => {
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .eq('id', req.params.id)
    .eq('user_id', req.userId)
    .single();

  if (error) return res.status(404).json({ message: 'Class not found' });
  res.json(data);
};

// PATCH /api/classes/:id
exports.updateClass = async (req, res) => {
  const { data, error } = await supabase
    .from('classes')
    .update(req.body)
    .eq('id', req.params.id)
    .eq('user_id', req.userId)
    .select()
    .single();

  if (error) return res.status(404).json({ message: 'Class not found' });
  res.json(data);
};

// DELETE /api/classes/:id
exports.deleteClass = async (req, res) => {
  const { error } = await supabase
    .from('classes')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.userId);

  if (error) return res.status(500).json({ message: error.message });
  res.json({ message: 'Class deleted' });
};
