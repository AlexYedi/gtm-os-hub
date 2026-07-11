// PostHog client instrumentation — minimal, PII-safe pageview analytics.
//
// Next.js auto-loads this file on the client (Next 15.3+); no import needed in layout.
//
// Design constraints (honor ARCHITECTURE.md §0, the PII/confidentiality contract):
//   • Env-gated — with no NEXT_PUBLIC_POSTHOG_KEY set (local dev, CI, or not-yet-configured),
//     PostHog stays fully dormant. Nothing is sent.
//   • Pageviews only. autocapture is OFF so we never capture arbitrary DOM text / form inputs.
//   • Session recording is OFF — no replay of any surface.
//   • The private, auth-gated cockpit (/cockpit/*) is excluded at the source: before_send drops
//     any event originating there, so private management activity never reaches PostHog.
//
// Project: gtm_os_hub (PostHog US cloud). The key is a *publishable* project key (safe in the
// client bundle by design) — set NEXT_PUBLIC_POSTHOG_KEY in .env.local / Vercel, not in source.
import posthog from 'posthog-js'

const key = process.env.NEXT_PUBLIC_POSTHOG_KEY

if (key) {
  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
    defaults: '2026-05-30',
    capture_pageview: 'history_change', // minimal: pageviews only, incl. SPA route changes
    autocapture: false, // PII contract: never capture arbitrary clicks / text / inputs
    disable_session_recording: true, // PII contract: no session replay
    before_send: (event) => {
      // Never send telemetry from the private cockpit surface.
      const url = (event?.properties?.['$current_url'] as string | undefined) ?? ''
      if (url.includes('/cockpit')) return null
      return event
    },
  })
}
