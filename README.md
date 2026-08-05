# Clarity — Student Workspace

A React + Tailwind student workspace: Dashboard, Class Planner, Daily Planner, Pomodoro and
Settings, backed by Supabase for auth and data.

## Stack

- React 19 + Vite
- Tailwind CSS v4 (`@tailwindcss/vite`, theme tokens in `src/index.css`)
- React Router 7
- Supabase (auth + Postgres)
- lucide-react icons

## Getting started

```bash
npm install
```

Then connect a backend — the app shows a setup screen until you do:

1. **Create a Supabase project.** Free tier is fine.
2. **Run the schema.** Paste `supabase/migrations/0001_init.sql` into the Supabase SQL editor and
   run it. It creates every table, the trigger that provisions a profile on sign-up, and the
   row-level-security policies.
3. **Add your keys.** `cp .env.example .env`, then fill in the Project URL and the **anon** key from
   Project Settings → API.

```bash
npm run dev
```

> Only ever put the anon key in `.env`. Anything in a `VITE_` variable is bundled into the public
> JavaScript, so the `service_role` key must never go there — it bypasses row-level security.

### Google sign-in

Email/password works as soon as the schema is in place. For the Google button, enable the Google
provider under Authentication → Providers in Supabase and supply a Google OAuth client ID/secret.
Until then that button returns a clear "not enabled" message.

## Structure

```
src/
  App.jsx                    routes and auth gating
  lib/supabase.js            client + configuration guard
  context/AuthContext        session, profile, preferences
  context/StudySessionContext  pomodoro session state
  components/auth/           RequireAuth, GoogleMark
  components/layout/         AppLayout, Sidebar, TopBar
  components/pomodoro/       RevealImage, SessionSetupDialog, SessionDrawer
  components/ui/             Card, Button, StatusTag, ProgressBar, ToggleSwitch,
                             SegmentedControl, Checkbox, Stepper, Avatar
  data/mock.js               placeholder content not yet moved to Supabase
  pages/                     SignIn, Onboarding, SetupRequired, Dashboard,
                             ClassPlanner, DailyPlanner, Pomodoro, Settings
supabase/migrations/         SQL to run against your project
```

Routes: `/signin`, `/onboarding`, `/dashboard`, `/classes`, `/planner`, `/pomodoro`, `/settings`.
Everything except `/signin` requires a session; new accounts are sent through `/onboarding` once.

## Status

Auth, onboarding, profile and preferences are backed by Supabase. Class Planner, Daily Planner, the
Dashboard lists and the Pomodoro activity log still read from `src/data/mock.js` — those move over
in later phases.

## Reveal images

Drop images into `src/assets/reveal/`. They are picked up automatically, offered in the Pomodoro
setup popup, and unblur as a block elapses. Landscape crops suit the full-screen timer best.
