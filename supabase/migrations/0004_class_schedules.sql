-- Class schedules: semester info and fixed, recurring calendar blocks.
--
-- Run after 0003. Safe to re-run.
--
-- A class can carry a weekly schedule — which weekdays it meets, at what
-- time, across which dates. Saving a class with a schedule also inserts one
-- recurring event row (fixed = true) that the existing recurrence engine
-- expands over the semester on the calendar. Fixed rows are locked in the UI:
-- no drag, no resize, no edit.

alter table public.classes
  add column if not exists semester    text,
  add column if not exists starts_on   date,
  add column if not exists ends_on     date,
  add column if not exists start_time  numeric(4, 2),
  add column if not exists end_time    numeric(4, 2),
  add column if not exists meeting_days smallint[] not null default '{}';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'classes_semester_check'
  ) then
    alter table public.classes
      add constraint classes_semester_check
      check (semester is null or semester in ('fall', 'winter', 'spring', 'summer'));
  end if;
end;
$$;

-- Same weekday encoding as events.repeat_days: 0 = Sunday … 6 = Saturday.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'classes_meeting_days_check'
  ) then
    alter table public.classes
      add constraint classes_meeting_days_check
      check (meeting_days <@ array[0,1,2,3,4,5,6]::smallint[]);
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'classes_time_order_check'
  ) then
    alter table public.classes
      add constraint classes_time_order_check
      check (end_time is null or start_time is null or end_time > start_time);
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'classes_date_order_check'
  ) then
    alter table public.classes
      add constraint classes_date_order_check
      check (ends_on is null or starts_on is null or ends_on >= starts_on);
  end if;
end;
$$;

-- Marks schedule-derived calendar blocks. The UI treats these as immutable.
alter table public.events
  add column if not exists fixed boolean not null default false;

create index if not exists events_class_fixed_idx on public.events (class_id, fixed);

comment on column public.classes.semester is
  'Which semester the class runs in: fall, winter, spring or summer.';
comment on column public.classes.meeting_days is
  'Weekly meeting days, 0 = Sunday … 6 = Saturday. Empty means no schedule.';
comment on column public.events.fixed is
  'True for blocks generated from a class schedule. Immutable in the calendar UI.';