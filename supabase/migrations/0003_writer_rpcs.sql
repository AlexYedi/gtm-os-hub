-- learning_02_writer_rpcs — the cockpit's only write path.
-- SECURITY DEFINER functions in the exposed `public` schema, EXECUTE granted to
-- service_role ONLY. Keeps `learning` internal (never exposed to PostgREST) and
-- makes timer-stop / status atomic. V1 resolves the single learner by handle='alex';
-- V2 swaps uni_learner() to an auth.uid() mapping (RLS, already written, takes over).

create or replace function public.uni_learner()
returns uuid language sql security definer set search_path = learning, public stable as $$
  select learner_id from learning.learner where handle = 'alex' limit 1;
$$;

create or replace function public.uni_start_timer(p_unit_id text, p_client_entry_id uuid)
returns uuid language plpgsql security definer set search_path = learning, public as $$
declare v_learner uuid; v_id uuid;
begin
  v_learner := public.uni_learner();
  update learning.time_entry set ended_at = now()
    where learner_id = v_learner and ended_at is null;
  insert into learning.time_entry (learner_id, unit_id, source, started_at, client_entry_id)
    values (v_learner, p_unit_id, 'timer', now(), p_client_entry_id)
    on conflict (learner_id, client_entry_id) do nothing
    returning entry_id into v_id;
  insert into learning.unit_progress (learner_id, unit_id, status)
    values (v_learner, p_unit_id, 'in_progress')
    on conflict (learner_id, unit_id) do update
      set status = case when learning.unit_progress.status = 'not_started'
                        then 'in_progress' else learning.unit_progress.status end;
  return v_id;
end $$;

create or replace function public.uni_stop_timer(p_note text default null)
returns int language plpgsql security definer set search_path = learning, public as $$
declare v_learner uuid; v_secs int;
begin
  v_learner := public.uni_learner();
  update learning.time_entry set ended_at = now(), note = coalesce(p_note, note)
    where learner_id = v_learner and ended_at is null
    returning duration_seconds into v_secs;
  return coalesce(v_secs, 0);
end $$;

create or replace function public.uni_add_manual_time(
  p_unit_id text, p_minutes int, p_started_at timestamptz default now(),
  p_note text default null, p_client_entry_id uuid default gen_random_uuid())
returns uuid language plpgsql security definer set search_path = learning, public as $$
declare v_learner uuid; v_id uuid;
begin
  v_learner := public.uni_learner();
  insert into learning.time_entry (learner_id, unit_id, source, started_at, ended_at, note, client_entry_id)
    values (v_learner, p_unit_id, 'manual', p_started_at,
            p_started_at + make_interval(mins => greatest(p_minutes, 0)), p_note, p_client_entry_id)
    on conflict (learner_id, client_entry_id) do nothing
    returning entry_id into v_id;
  return v_id;
end $$;

create or replace function public.uni_set_status(
  p_unit_id text, p_status text, p_competency_level text default null)
returns void language plpgsql security definer set search_path = learning, public as $$
declare v_learner uuid;
begin
  v_learner := public.uni_learner();
  insert into learning.unit_progress (learner_id, unit_id, status, competency_level, completed_at)
    values (v_learner, p_unit_id, p_status, p_competency_level,
            case when p_status='done' then now() end)
    on conflict (learner_id, unit_id) do update
      set status = excluded.status, competency_level = excluded.competency_level,
          completed_at = case when excluded.status='done'
                              then coalesce(learning.unit_progress.completed_at, now()) else null end;
end $$;

create or replace function public.uni_submit_work(
  p_unit_id text, p_kind text, p_title text, p_body_md text default null,
  p_artifact_url text default null, p_is_public boolean default false, p_public_summary text default null)
returns uuid language plpgsql security definer set search_path = learning, public as $$
declare v_learner uuid; v_id uuid; v_hash text;
begin
  v_learner := public.uni_learner();
  v_hash := md5(coalesce(p_body_md,'') || '|' || coalesce(p_artifact_url,'') || '|' || p_title);
  insert into learning.submission (learner_id, unit_id, kind, title, body_md, artifact_url,
                                   is_public, public_summary, content_hash)
    values (v_learner, p_unit_id, p_kind, p_title, p_body_md, p_artifact_url,
            p_is_public, p_public_summary, v_hash)
    on conflict (learner_id, unit_id, content_hash) do update
      set title = excluded.title, body_md = excluded.body_md, artifact_url = excluded.artifact_url,
          is_public = excluded.is_public, public_summary = excluded.public_summary, updated_at = now()
    returning submission_id into v_id;
  return v_id;
end $$;

revoke execute on function
  public.uni_learner(), public.uni_start_timer(text, uuid), public.uni_stop_timer(text),
  public.uni_add_manual_time(text, int, timestamptz, text, uuid), public.uni_set_status(text, text, text),
  public.uni_submit_work(text, text, text, text, text, boolean, text)
  from public, anon, authenticated;
grant execute on function
  public.uni_start_timer(text, uuid), public.uni_stop_timer(text),
  public.uni_add_manual_time(text, int, timestamptz, text, uuid), public.uni_set_status(text, text, text),
  public.uni_submit_work(text, text, text, text, text, boolean, text)
  to service_role;
