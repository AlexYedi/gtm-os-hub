-- learning_00_init — GTM University data plane (first tables on the gtm-os spine).
-- Applied to gtm-os-project (reockeomhqmmjvanfopj) via Supabase MCP. Kept here for version control.
-- Conventions follow gtm-os/Phase_1/architecture.md: ordered UUIDv7, idempotency, RLS, v_public_* projections.

create schema if not exists learning;

-- Pure-SQL UUIDv7 (no extension; pg_uuidv7 unavailable on PG17 here). Time-ordered, version nibble = 7.
create or replace function learning.uuid_generate_v7()
returns uuid language sql volatile as $$
  select encode(
    set_bit(
      set_bit(
        overlay(uuid_send(gen_random_uuid())
                placing substring(int8send(floor(extract(epoch from clock_timestamp()) * 1000)::bigint) from 3)
                from 1 for 6),
        52, 1),
      53, 1),
    'hex')::uuid;
$$;

create or replace function learning.set_updated_at() returns trigger
  language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ── LEARNER (multi-learner-ready; PII-free: no email) ──────────────────
create table learning.learner (
  learner_id   uuid primary key default learning.uuid_generate_v7(),
  handle       text not null unique,
  auth_user_id uuid unique,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger trg_learner_updated before update on learning.learner
  for each row execute function learning.set_updated_at();

-- ── CURRICULUM_UNIT (derived projection of content-as-code; PII-free) ──
create table learning.curriculum_unit (
  unit_id         text primary key,             -- STABLE slug; never rename (cross-table key)
  parent_id       text references learning.curriculum_unit(unit_id),
  level           text not null check (level in ('area','section','module','subtask')),
  domain_id       text not null,
  competency_mode text not null check (competency_mode in ('leveled','binary')),
  kind            text check (kind in ('exercise','project','capstone')),
  title           text not null,
  complexity      smallint check (complexity between 1 and 5),
  is_capstone     boolean not null default false,
  sort_order      int not null default 0,
  synced_at       timestamptz not null default now()
);
create index idx_curriculum_parent on learning.curriculum_unit(parent_id);
create index idx_curriculum_domain on learning.curriculum_unit(domain_id);
create index idx_curriculum_level  on learning.curriculum_unit(level);

-- ── UNIT_PROGRESS (leaf-level; non-leaf is derived) ────────────────────
create table learning.unit_progress (
  progress_id      uuid primary key default learning.uuid_generate_v7(),
  learner_id       uuid not null references learning.learner(learner_id),
  unit_id          text not null references learning.curriculum_unit(unit_id),
  status           text not null default 'not_started' check (status in ('not_started','in_progress','done')),
  competency_level text check (competency_level in ('novice','practitioner','expert')),
  completed_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (learner_id, unit_id)
);
create index idx_progress_learner_status on learning.unit_progress(learner_id, status);
create trigger trg_progress_updated before update on learning.unit_progress
  for each row execute function learning.set_updated_at();

-- ── SUBMISSION (versioned; body_md PRIVATE, never public-projected) ────
create table learning.submission (
  submission_id  uuid primary key default learning.uuid_generate_v7(),
  learner_id     uuid not null references learning.learner(learner_id),
  unit_id        text not null references learning.curriculum_unit(unit_id),
  kind           text not null check (kind in ('exercise','project','capstone')),
  title          text not null,
  body_md        text,                          -- PRIVATE; cockpit-only
  artifact_url   text,
  external_ref   jsonb,
  is_public      boolean not null default false, -- publish gate (default-deny)
  public_summary text,                           -- PII-safe; only this is projected
  content_hash   text not null,                  -- dedupe accidental double-submit
  submitted_at   timestamptz not null default now(),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (learner_id, unit_id, content_hash)
);
create index idx_submission_learner_unit on learning.submission(learner_id, unit_id);
create trigger trg_submission_updated before update on learning.submission
  for each row execute function learning.set_updated_at();

-- ── TIME_ENTRY (timer model; duration GENERATED; one running timer) ────
create table learning.time_entry (
  entry_id         uuid primary key default learning.uuid_generate_v7(),
  learner_id       uuid not null references learning.learner(learner_id),
  unit_id          text not null references learning.curriculum_unit(unit_id),
  source           text not null check (source in ('timer','manual')),
  started_at       timestamptz not null,
  ended_at         timestamptz,
  duration_seconds int generated always as
    (case when ended_at is not null then extract(epoch from ended_at - started_at)::int end) stored,
  note             text,
  client_entry_id  uuid not null,               -- idempotency for stop/retry
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint chk_time_order check (ended_at is null or ended_at >= started_at),
  unique (learner_id, client_entry_id)
);
create unique index uq_one_running_timer on learning.time_entry(learner_id) where ended_at is null;
create index idx_time_learner_unit    on learning.time_entry(learner_id, unit_id);
create index idx_time_learner_started on learning.time_entry(learner_id, started_at);
create trigger trg_time_updated before update on learning.time_entry
  for each row execute function learning.set_updated_at();

-- ── RLS (written now, dormant in V1 — service-role writes bypass) ──────
alter table learning.learner          enable row level security;
alter table learning.unit_progress    enable row level security;
alter table learning.submission       enable row level security;
alter table learning.time_entry       enable row level security;
alter table learning.curriculum_unit  enable row level security;

create policy self_progress on learning.unit_progress for all to authenticated
  using  (learner_id = (select learner_id from learning.learner where auth_user_id = auth.uid()))
  with check (learner_id = (select learner_id from learning.learner where auth_user_id = auth.uid()));
create policy self_submission on learning.submission for all to authenticated
  using  (learner_id = (select learner_id from learning.learner where auth_user_id = auth.uid()))
  with check (learner_id = (select learner_id from learning.learner where auth_user_id = auth.uid()));
create policy self_time on learning.time_entry for all to authenticated
  using  (learner_id = (select learner_id from learning.learner where auth_user_id = auth.uid()))
  with check (learner_id = (select learner_id from learning.learner where auth_user_id = auth.uid()));
create policy self_learner on learning.learner for select to authenticated
  using (auth_user_id = auth.uid());
create policy read_curriculum on learning.curriculum_unit for select to authenticated using (true);
