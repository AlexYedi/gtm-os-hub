-- learning_06_drop_empire_leftovers — remove early Empire State objects from GTM_OS_HUB (YED-165).
-- Apply to GTM_OS_HUB (nnywrmetdoixdbevvsvf) in the dashboard SQL editor; there is no CLI/REST path
-- from this repo (no linked CLI, and the API exposes only `public`). Kept here for version control.
--
-- WHY: these four public.* tables predate the learning plane (early Empire State pipeline work,
-- ~2026-04). They are not part of the Hub or GTM University, nothing in this repo reads them,
-- and `contacts` was shaped for PII (name, email, LinkedIn URL). The publishable key could read
-- 0 rows from all four (RLS), so nothing was ever publicly exposed. Dropping them leaves this
-- database holding only the learning plane.
--
-- BACKUP: rows (events 4, event_briefs 6, contacts 0, content_drafts 0) + column definitions were
-- exported first to the private gtm-os repo: supabase/archive/gtm-os-hub-leftovers-2026-09-13/.
--
-- SAFETY: no CASCADE, so an unexpected dependent object makes the drop fail instead of silently
-- removing it. Order follows the foreign keys (children before events). One transaction, so a
-- failure leaves all four tables in place.
--
-- The matching empty storage bucket `post-event-uploads` was deleted via the Storage API
-- (Supabase blocks direct SQL deletes on storage objects), not here.

begin;

drop table if exists public.content_drafts;  -- FKs -> events, contacts
drop table if exists public.event_briefs;    -- FK  -> events
drop table if exists public.contacts;        -- FK  -> events
drop table if exists public.events;

commit;
