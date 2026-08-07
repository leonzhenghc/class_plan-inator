# Clarity Backend

Backend API for the Clarity student workspace app (Dashboard, Class Planner, Pomodoro, Settings).

## Stack
- Node.js + Express
- Supabase (Postgres database + Auth) — one project, no separate database
- `@supabase/supabase-js` for all queries

## Getting started

1. **Create your tables.** In your Supabase project, go to SQL Editor -> New Query,
   paste the contents of `sql/schema.sql`, and run it. This creates `profiles`,
   `classes`, `assignments`, `pomodoro_sessions`, and `connected_accounts`.

2. **Install & configure:**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   ```
   Fill in `.env` with your Supabase project's URL and **service role key**
   (Settings -> API in the Supabase dashboard). The service role key is secret —
   never expose it to the frontend, it bypasses all security rules.

3. **Run it:**
   ```bash
   npm run dev
   ```
   Visit `http://localhost:5000/api/health` — you should see `{"status":"ok"}`.

## How auth works

- The **frontend** handles signup/login directly via `supabase-js`
  (`supabase.auth.signUp()` / `signInWithPassword()`).
- After login, the frontend calls `POST /api/users/sync` **once** with the
  user's name/email, so the backend creates a matching row in `profiles`.
- Every other request from the frontend includes
  `Authorization: Bearer <supabase_access_token>`.
- The backend's `auth.js` middleware verifies that token with Supabase and
  attaches `req.userId` (a UUID) to the request.

## Folder structure

```
backend/
  server.js
  sql/schema.sql            # run once in Supabase SQL editor
  src/
    config/supabaseClient.js # the one shared Supabase client
    controllers/              # request handlers, using supabase.from(...)
    routes/
    middleware/auth.js        # verifies Supabase JWTs
```

## API overview

All routes except `/api/health` require `Authorization: Bearer <token>`.

| Method | Route                       | Purpose |
|--------|------------------------------|---------|
| POST   | `/api/users/sync`             | Create profile row after first login |
| GET    | `/api/users/me`               | Current user profile |
| PATCH  | `/api/users/me`               | Update profile / pomodoro settings / notifications |
| GET    | `/api/users/me/dashboard`     | Dashboard summary (due today, upcoming, streak) |
| GET/POST | `/api/classes`              | List / create classes |
| GET/PATCH/DELETE | `/api/classes/:id`   | Single class |
| GET/POST | `/api/assignments`          | List (filter by `?classId=`, `?status=`) / create |
| PATCH/DELETE | `/api/assignments/:id`  | Update status / delete |
| POST   | `/api/pomodoro/sessions`      | Log a completed focus/break session |
| GET    | `/api/pomodoro/sessions/today`| Today's activity log + count |

## Note on Row Level Security (RLS)

This backend uses the **service role key**, which bypasses Supabase's RLS
entirely. That means every query in the controllers manually filters by
`user_id` / `eq('id', req.userId)` — that filtering IS your security here.
If you ever query Supabase directly from the frontend too, you'll want to
enable RLS policies on these tables so users can only see their own rows.
