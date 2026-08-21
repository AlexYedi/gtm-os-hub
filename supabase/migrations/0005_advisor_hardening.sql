-- learning_05_advisor_hardening — resolve Supabase Advisor `function_search_path_mutable`.
-- Applied to GTM_OS_HUB (nnywrmetdoixdbevvsvf) via `supabase db push`. Kept here for version control.
--
-- WHY: the two learning.* helpers (0001) declared no fixed search_path, so the Security/Performance
-- Advisor flags them as `function_search_path_mutable` (a real hardening gap: a mutable search_path
-- lets a caller shadow unqualified names). Both functions call only pg_catalog built-ins, so pinning
-- search_path = '' and fully-qualifying the calls is a behavior-preserving fix.
--
-- The public.uni_* RPCs (0003/0004) already `set search_path = learning, public` and are NOT touched.
-- The 3 `security_definer_view` CRITICALs on public.v_public_* are accepted-by-design (see
-- ARCHITECTURE.md §0 "Advisor exceptions") and are deliberately NOT changed here — flipping them to
-- security_invoker would force granting anon direct access to learning.* base tables (a downgrade).

create or replace function learning.uuid_generate_v7()
returns uuid language sql volatile
set search_path = ''
as $$
  select pg_catalog.encode(
    pg_catalog.set_bit(
      pg_catalog.set_bit(
        overlay(pg_catalog.uuid_send(pg_catalog.gen_random_uuid())
                placing substring(pg_catalog.int8send(pg_catalog.floor(extract(epoch from pg_catalog.clock_timestamp()) * 1000)::bigint) from 3)
                from 1 for 6),
        52, 1),
      53, 1),
    'hex')::uuid;
$$;

create or replace function learning.set_updated_at() returns trigger
  language plpgsql
  set search_path = ''
as $$
begin new.updated_at = pg_catalog.now(); return new; end $$;
