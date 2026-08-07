-- Run this once in Supabase Dashboard -> SQL Editor -> New Query

-- One row per signed-up user, extending Supabase's built-in auth.users
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  display_name text not null,
  email text not null,
  focus_score int default 0,
  current_streak int default 0,
  pomodoro_focus_length int default 25,
  pomodoro_break_length int default 5,
  notif_canvas_sync boolean default true,
  notif_due_date boolean default true,
  notif_deep_work boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists classes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  code text,
  instructor text,
  category text default 'OTHER' check (category in ('STEM','HUMANITIES','ARTS','SOCIAL SCIENCE','OTHER')),
  semester text default 'Fall Semester 2023',
  total_assignments int default 0,
  completed_assignments int default 0,
  created_at timestamptz default now()
);

create table if not exists assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  class_id uuid references classes(id) on delete cascade not null,
  title text not null,
  due_date timestamptz not null,
  status text default 'TO DO' check (status in ('TO DO','IN PROGRESS','DUE TODAY','COMPLETE')),
  source text default 'manual' check (source in ('manual','canvas')),
  created_at timestamptz default now()
);

create table if not exists pomodoro_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  active_task_label text,
  type text default 'focus' check (type in ('focus','short_break','long_break')),
  duration_minutes int not null,
  completed_at timestamptz default now()
);

create table if not exists connected_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  provider text check (provider in ('canvas','google_calendar','notion')),
  connected boolean default false,
  last_synced_at timestamptz
);

-- Helpful indexes for the queries the backend runs most
create index if not exists idx_classes_user on classes(user_id);
create index if not exists idx_assignments_user on assignments(user_id);
create index if not exists idx_assignments_class on assignments(class_id);
create index if not exists idx_pomodoro_user_completed on pomodoro_sessions(user_id, completed_at);
