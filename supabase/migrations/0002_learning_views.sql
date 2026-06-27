-- learning_01_views — rollup/forecast (internal) + public projections.
-- Pace (time totals + forecast) is intentionally NOT given a public/anon-granted view:
-- it lives only in internal learning.* views read by the service-role cockpit. Structural
-- enforcement of the "pace cockpit-only" decision — it cannot leak to anon by construction.

-- ── INTERNAL rollup/forecast views (math lives here once) ──────────────

-- closure: (ancestor, descendant) over the whole curriculum tree
create view learning.v_unit_closure as
with recursive tree as (
  select unit_id as ancestor, unit_id as descendant from learning.curriculum_unit
  union all
  select t.ancestor, c.unit_id
  from tree t join learning.curriculum_unit c on c.parent_id = t.descendant
)
select * from tree;

-- leaf time per (learner, subtask) — closed entries only
create view learning.v_unit_time as
select learner_id, unit_id, sum(duration_seconds) as seconds
from learning.time_entry where ended_at is not null
group by learner_id, unit_id;

-- time rolled UP to every ancestor level
create view learning.v_time_rollup as
select cl.ancestor as unit_id, t.learner_id, coalesce(sum(t.seconds),0) as seconds
from learning.v_unit_closure cl
left join learning.v_unit_time t on t.unit_id = cl.descendant
group by cl.ancestor, t.learner_id;

-- progress rolled up: count of descendant subtasks done vs total
create view learning.v_progress_rollup as
select cl.ancestor as unit_id, l.learner_id,
       count(*) filter (where cu.level='subtask') as subtasks_total,
       count(*) filter (where cu.level='subtask' and up.status='done') as subtasks_done
from learning.v_unit_closure cl
join learning.curriculum_unit cu on cu.unit_id = cl.descendant
cross join learning.learner l
left join learning.unit_progress up
       on up.unit_id = cl.descendant and up.learner_id = l.learner_id
group by cl.ancestor, l.learner_id;

-- forecast: velocity (hours per complexity-point) x remaining complexity. COCKPIT-ONLY.
create view learning.v_forecast as
with done as (
  select up.learner_id, cu.complexity, coalesce(t.seconds,0)/3600.0 as hours
  from learning.unit_progress up
  join learning.curriculum_unit cu on cu.unit_id = up.unit_id and cu.level='subtask'
  left join learning.v_unit_time t on t.unit_id = up.unit_id and t.learner_id = up.learner_id
  where up.status='done'
),
agg as (
  select learner_id, count(*) done_n, sum(complexity) done_cx, sum(hours) done_hours,
         stddev_pop(hours / nullif(complexity,0)) hpc_sd
  from done group by learner_id
),
remaining as (
  select l.learner_id, sum(cu.complexity) rem_cx
  from learning.learner l
  cross join learning.curriculum_unit cu
  left join learning.unit_progress up on up.unit_id = cu.unit_id and up.learner_id = l.learner_id
  where cu.level='subtask' and coalesce(up.status,'not_started') <> 'done'
  group by l.learner_id
)
select a.learner_id,
       round(a.done_hours::numeric, 1) as logged_hours,
       case when a.done_cx>0 then round((a.done_hours/a.done_cx)::numeric,2) end as velocity_hpc,
       case when a.done_cx>0 then round(((a.done_hours/a.done_cx)*coalesce(r.rem_cx,0))::numeric,1) end as est_remaining_hours,
       case when a.done_cx>0 then round((a.done_hours + (a.done_hours/a.done_cx)*coalesce(r.rem_cx,0))::numeric,1) end as est_total_hours,
       coalesce(a.hpc_sd,0) as velocity_sd,
       case when a.done_n >= 8 then 'live'
            when a.done_n >= 4 then 'warming'
            else 'cold_start' end as confidence_state
from agg a left join remaining r using (learner_id);

-- ── PUBLIC projection views (PII-free; anon-granted). Pace EXCLUDED. ────
create view public.v_public_curriculum as
  select unit_id, parent_id, level, domain_id, competency_mode,
         kind, title, complexity, is_capstone, sort_order
  from learning.curriculum_unit;

create view public.v_public_progress as
  select pr.unit_id, l.handle as learner, cu.level,
         pr.subtasks_total, pr.subtasks_done,
         case when pr.subtasks_total>0
              then round(100.0*pr.subtasks_done/pr.subtasks_total) else 0 end as pct_done
  from learning.v_progress_rollup pr
  join learning.learner l on l.learner_id = pr.learner_id
  join learning.curriculum_unit cu on cu.unit_id = pr.unit_id;

create view public.v_public_submissions as
  select s.unit_id, l.handle as learner, s.kind, s.title,
         s.public_summary, s.artifact_url, s.submitted_at::date as submitted_on
  from learning.submission s
  join learning.learner l on l.learner_id = s.learner_id
  where s.is_public = true;

grant usage on schema public to anon;
grant select on public.v_public_curriculum, public.v_public_progress,
                public.v_public_submissions to anon;
