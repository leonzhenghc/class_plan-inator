# Clarity — Student Workspace

A React + Tailwind CSS student workspace UI: Dashboard, Class Planner, Daily Planner, Pomodoro, and
Settings, wired together with React Router.

## Stack

- React 19 + Vite
- Tailwind CSS v4 (`@tailwindcss/vite`, theme tokens defined in `src/index.css`)
- React Router 7
- lucide-react icons

## Getting started

```bash
npm install
npm run dev
```

## Structure

```
src/
  App.jsx                    routes
  data/mock.js               all static/mock content
  components/layout/         AppLayout, Sidebar, TopBar
  components/ui/             Card, Button, StatusTag, ProgressBar,
                             ToggleSwitch, SegmentedControl, Checkbox, Avatar
  pages/                     Dashboard, ClassPlanner, DailyPlanner, Pomodoro, Settings
```

Routes: `/dashboard`, `/classes`, `/planner`, `/pomodoro`, `/settings`.

The brand palette (`brand-50` … `brand-900`, centred on `#5b4fe5`) is declared as Tailwind theme
tokens in `src/index.css`, so it is available as ordinary utilities such as `bg-brand-600`.
