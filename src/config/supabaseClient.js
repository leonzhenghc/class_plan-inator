const { createClient } = require('@supabase/supabase-js');

// Server-side client using the service role key.
// This BYPASSES row-level security, so every query we write must
// manually filter by user_id — never trust the client to do it for you.
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = supabase;
