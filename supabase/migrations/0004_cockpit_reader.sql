-- learning_03_cockpit_reader — pace reader for the cockpit (service_role only).
-- Returns forecast + running timer + time/status by unit in one round trip.
-- Pace stays inside learning.* — never exposed to anon.
create or replace function public.uni_cockpit_state()
returns jsonb language sql security definer set search_path = learning, public stable as $$
  select jsonb_build_object(
    'forecast', (select to_jsonb(f) from learning.v_forecast f where f.learner_id = public.uni_learner() limit 1),
    'running', (select jsonb_build_object('unit_id', unit_id, 'started_at', started_at)
                from learning.time_entry
                where learner_id = public.uni_learner() and ended_at is null limit 1),
    'time_by_unit', (select coalesce(jsonb_object_agg(unit_id, round(seconds/3600.0,2)),'{}'::jsonb)
                     from learning.v_time_rollup where learner_id = public.uni_learner() and seconds > 0),
    'status_by_unit', (select coalesce(jsonb_object_agg(unit_id,
                         jsonb_build_object('status',status,'level',competency_level)),'{}'::jsonb)
                       from learning.unit_progress where learner_id = public.uni_learner())
  );
$$;
revoke execute on function public.uni_cockpit_state() from public, anon, authenticated;
grant execute on function public.uni_cockpit_state() to service_role;
