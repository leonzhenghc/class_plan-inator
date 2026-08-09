-- Personality context for the study assistant.
--
-- Run after 0001_init.sql. Safe to re-run.
--
-- Stored as arrays of short tags plus one free-text field: the tags stay
-- filterable and cheap to summarise into a prompt, while the free text carries
-- the nuance a fixed list can never cover.

alter table public.profiles
  add column if not exists personality_traits text[] not null default '{}',
  add column if not exists hobbies            text[] not null default '{}',
  add column if not exists study_styles       text[] not null default '{}',
  add column if not exists about_me           text   not null default '';

comment on column public.profiles.personality_traits is
  'Self-selected traits, e.g. {curious,organised}. Context for the assistant.';
comment on column public.profiles.hobbies is
  'Self-selected interests, free to extend with custom entries.';
comment on column public.profiles.study_styles is
  'How the student prefers to work, e.g. {late-nights,background-music}.';
comment on column public.profiles.about_me is
  'Anything else the student wants the assistant to know.';
