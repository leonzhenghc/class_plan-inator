-- Recurring events.
--
-- Run after 0002. Safe to re-run.
--
-- A repeating event is ONE row carrying a rule, expanded to occurrences when
-- read. Materialising every occurrence would bloat the table, make "change all"
-- a mass update, and force a decision about how far into the future to write.
--
-- Two escape hatches keep single occurrences editable:
--   excluded_dates  dates the series should skip
--   recurrence_id   an ordinary row standing in for one occurrence
--
-- Editing one occurrence adds its date to excluded_dates and inserts an
-- override row, so the series stays a single source of truth for the rest.

alter table public.events
  add column if not exists repeat_freq    text,
  add column if not exists repeat_days    smallint[] not null default '{}',
  add column if not exists repeat_until   date,
  add column if not exists excluded_dates date[]     not null default '{}',
  add column if not exists recurrence_id  uuid references public.events (id) on delete cascade;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'events_repeat_freq_check'
  ) then
    alter table public.events
      add constraint events_repeat_freq_check
      check (repeat_freq is null or repeat_freq in ('daily', 'weekly'));
  end if;
end;
$$;

-- Days of the week as 0 = Sunday … 6 = Saturday, matching JS getDay().
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'events_repeat_days_check'
  ) then
    alter table public.events
      add constraint events_repeat_days_check
      check (repeat_days <@ array[0,1,2,3,4,5,6]::smallint[]);
  end if;
end;
$$;

create index if not exists events_recurrence_idx on public.events (user_id, recurrence_id);

comment on column public.events.repeat_freq is
  'null = one-off. Otherwise daily or weekly; weekly uses repeat_days.';
comment on column public.events.repeat_days is
  'Weekly rule: which weekdays, 0 = Sunday. Empty means the start day only.';
comment on column public.events.repeat_until is
  'Inclusive last date the series can produce. Null repeats indefinitely.';
comment on column public.events.excluded_dates is
  'Dates the series skips — deleted occurrences, and ones replaced by an override.';
comment on column public.events.recurrence_id is
  'Set on an override row: the series this stands in for on its own date.';
