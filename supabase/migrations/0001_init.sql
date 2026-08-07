-- Clarity — Student Workspace : initial schema
--
-- Run this once in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- Safe to re-run: every statement is guarded.
--
-- Every table is owned by a user and protected by row-level security, so the
-- browser's anon key can only ever read or write that user's own rows.

-- ---------------------------------------------------------------- helpers --

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- --------------------------------------------------------------- profiles --

create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  full_name    text not null default '',
  display_name text not null default '',
  school       text not null default '',
  program      text not null default '',
  year         text not null default '',
  avatar_url   text,
  onboarded_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ------------------------------------------------------------ preferences --

create table if not exists public.preferences (
  user_id            uuid primary key references auth.users (id) on delete cascade,
  focus_minutes      integer not null default 25 check (focus_minutes between 1 and 180),
  break_minutes      integer not null default 5  check (break_minutes between 1 and 60),
  rounds             integer not null default 4  check (rounds between 1 and 12),
  daily_goal_minutes integer not null default 120 check (daily_goal_minutes >= 0),
  due_date_reminders boolean not null default true,
  deep_work_mode     boolean not null default false,
  theme              text    not null default 'light' check (theme in ('light', 'dark', 'system')),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- ---------------------------------------------------------------- classes --

create table if not exists public.classes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null,
  professor  text not null default '',
  category   text not null default 'STEM',
  term       text not null default '',
  code       text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists classes_user_id_idx on public.classes (user_id);

-- ------------------------------------------------------------ assignments --

create table if not exists public.assignments (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  class_id     uuid references public.classes (id) on delete cascade,
  title        text not null,
  status       text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  due_at       timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists assignments_user_id_idx on public.assignments (user_id);
create index if not exists assignments_due_at_idx  on public.assignments (user_id, due_at);

-- ------------------------------------------------------------------ tasks --

create table if not exists public.tasks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  title      text not null,
  category   text not null default '',
  done       boolean not null default false,
  due_at     timestamptz,
  task_date  date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_user_date_idx on public.tasks (user_id, task_date);

-- ----------------------------------------------------------------- events --

create table if not exists public.events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  class_id   uuid references public.classes (id) on delete set null,
  title      text not null,
  subtitle   text not null default '',
  kind       text not null default 'study' check (kind in ('class', 'study', 'break', 'personal')),
  event_date date not null,
  starts_at  numeric(4, 2) not null check (starts_at >= 0 and starts_at < 24),
  ends_at    numeric(4, 2) not null check (ends_at   >  0 and ends_at  <= 24),
  tag        text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_time_order check (ends_at > starts_at)
);

create index if not exists events_user_date_idx on public.events (user_id, event_date);

-- ------------------------------------------------------- pomodoro sessions --

create table if not exists public.pomodoro_sessions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  phase          text not null check (phase in ('focus', 'break')),
  minutes        integer not null check (minutes > 0),
  round          integer not null default 1,
  label          text not null default '',
  completed_at   timestamptz not null default now(),
  created_at     timestamptz not null default now()
);

create index if not exists pomodoro_sessions_user_idx on public.pomodoro_sessions (user_id, completed_at desc);

-- ------------------------------------------------------- updated_at hooks --

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'preferences', 'classes', 'assignments', 'tasks', 'events'
  ]
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function public.set_updated_at()', t
    );
  end loop;
end;
$$;

-- --------------------------------------------------- new-user bootstrapping --

-- Creates the profile and preference rows the moment someone signs up, so the
-- app never has to cope with a logged-in user that has no profile row.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      split_part(coalesce(new.raw_user_meta_data ->> 'full_name', ''), ' ', 1),
      ''
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  insert into public.preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------- row level security --

do $$
declare
  t text;
  owner_col text;
begin
  foreach t in array array[
    'profiles', 'preferences', 'classes', 'assignments', 'tasks', 'events', 'pomodoro_sessions'
  ]
  loop
    -- profiles keys off id; every other table uses user_id.
    owner_col := case when t = 'profiles' then 'id' else 'user_id' end;

    execute format('alter table public.%I enable row level security', t);

    execute format('drop policy if exists "own rows select" on public.%I', t);
    execute format(
      'create policy "own rows select" on public.%I
         for select using ((select auth.uid()) = %I)', t, owner_col
    );

    execute format('drop policy if exists "own rows insert" on public.%I', t);
    execute format(
      'create policy "own rows insert" on public.%I
         for insert with check ((select auth.uid()) = %I)', t, owner_col
    );

    execute format('drop policy if exists "own rows update" on public.%I', t);
    execute format(
      'create policy "own rows update" on public.%I
         for update using ((select auth.uid()) = %I)
         with check ((select auth.uid()) = %I)', t, owner_col, owner_col
    );

    execute format('drop policy if exists "own rows delete" on public.%I', t);
    execute format(
      'create policy "own rows delete" on public.%I
         for delete using ((select auth.uid()) = %I)', t, owner_col
    );
  end loop;
end;
$$;
