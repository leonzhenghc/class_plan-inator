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

### Auth configuration

**Redirect URLs.** Password reset and email confirmation send people back to the app, and Supabase
only honours URLs on its allowlist. Under Authentication → URL Configuration add:

```
http://localhost:5174/**      (development)
https://your-domain/**        (once deployed)
```

Without these, the emailed links bounce to the Site URL and the landing pages never see a token.

**Email confirmation.** Toggle "Confirm email" on under Authentication → Providers → Email. Sign-up
then returns no session, and the app shows a "confirm your email" screen with a resend option
instead of dropping the user straight in.

**SMTP — required before real users.** Supabase's built-in mailer is rate-limited to a handful of
messages per hour and is meant for testing only; it returns HTTP 429 quickly. Password reset is
effectively unusable until you configure your own SMTP provider under Authentication → Emails.

**Google sign-in.** Enable the Google provider under Authentication → Providers and supply a Google
OAuth client ID/secret. Until then the button returns a clear "not enabled" message.

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
  components/ui/             Card, Button, Dialog, StatusTag, ProgressBar,
                             ToggleSwitch, SegmentedControl, Checkbox, Stepper, Avatar
  hooks/                     useStudyStats, useSessionTaskOptions
  lib/                       supabase client, date helpers
  pages/                     SignIn, ForgotPassword, ResetPassword, ConfirmEmail,
                             Onboarding, SetupRequired, Dashboard, ClassPlanner,
                             DailyPlanner, Pomodoro, Settings
supabase/migrations/         SQL to run against your project
```

Routes: `/signin`, `/forgot-password`, `/reset-password`, `/confirm-email`, `/onboarding`, `/dashboard`, `/classes`, `/planner`, `/pomodoro`, `/settings`.
The auth routes are public — the emailed links create a session before landing, so they must be
reachable either way. Everything else requires a session, and new accounts pass through
`/onboarding` once.

## Status

Every page reads and writes real data: profiles, preferences, classes, assignments, planner events,
tasks and pomodoro history. There is no mock data left in the app.

Known gaps: the search box, notification bell and help icon are not wired up; the appearance
toggle stores a theme nothing reads yet; the notification switches persist but nothing sends
reminders; and events cannot repeat, so a class that meets weekly needs re-creating each time.

## Reveal images

Drop images into `src/assets/reveal/`. They are picked up automatically, offered in the Pomodoro
setup popup, and unblur as a block elapses. Landscape crops suit the full-screen timer best.
