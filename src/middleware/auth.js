const { createClient } = require('@supabase/supabase-js');

// Uses the Supabase project URL + service role key (server-side only, keep secret)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async function protect(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  const token = authHeader.split(' ')[1];

  // Ask Supabase to verify the token and tell us who it belongs to
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    return res.status(401).json({ message: 'Not authorized, token invalid' });
  }

  req.userId = data.user.id; // Supabase's user id (a UUID)
  next();
};
