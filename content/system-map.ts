// STATIC topology for the Living System Map (/system). Content-as-code, PII-safe by
// authorship — like the curriculum. Coordinates are AUTHORED percentages (0–100), never
// measured at runtime, so edges are pure functions of these constants: SSR-safe, no
// getBoundingClientRect / ResizeObserver / hydration jank.
//
// Honesty rules baked into the topology (see PHASE_1_BUILD_SPEC §3.1):
//   - No `spine → university` edge — that data flow does not exist. Spine and Notion are
//     ISOLATED nodes (not yet feeding anything); their status dots tell the story.
//   - Every public data path converges on `egress-gate` before reaching `public` — the
//     PII contract (assertPublicSafe) is the literal chokepoint, drawn as one.

export type NodeKind = 'source' | 'core' | 'gate' | 'surface'

export interface SystemNode {
  id: string
  label: string
  kind: NodeKind
  blurb: string // PII-safe by authorship — keep clear of any PII_DENYLIST term
  source: string // short provenance label
  x: number // % 0–100 (authored)
  y: number // % 0–100 (authored)
  href?: string // optional deep-link to the surface this node drives (rendered in NodeDetail)
}

export interface SystemEdge {
  from: string
  to: string
}

export const NODES: SystemNode[] = [
  // --- sources (left column) ---
  {
    id: 'github',
    label: 'GitHub',
    kind: 'source',
    blurb: 'Shipped commits, PRs and releases. The public Work stream reads a fixed-vocabulary projection — commit prose never surfaces.',
    source: 'GitHub REST',
    x: 10,
    y: 16,
  },
  {
    id: 'linear',
    label: 'Linear',
    kind: 'source',
    blurb: 'Roadmap state as counts only on the public surface — no titles, assignees or URLs. Full-fidelity titles live behind the cockpit auth gate.',
    source: 'Linear GraphQL',
    x: 10,
    y: 40,
  },
  {
    id: 'learning',
    label: 'Learning Plane',
    kind: 'source',
    blurb: 'Supabase (GTM_OS_HUB). Public reads go through v_public_* views that exclude PII by construction; pace/time stays private.',
    source: 'Supabase · GTM_OS_HUB',
    x: 10,
    y: 64,
  },
  {
    id: 'spine',
    label: 'Signal Spine',
    kind: 'source',
    blurb: 'Separate signal-pipeline Supabase project. Feeds the Signal surface — topic movement and theme intersections — through counts-only signal_read views; the bridge view that knows *who* stays service-role-only, never read here. Wired; lights up when the read path opens.',
    source: 'Supabase · spine',
    x: 10,
    y: 90,
    href: '/signal',
  },
  // --- core + surfaces ---
  {
    id: 'hub',
    label: 'The Hub',
    kind: 'core',
    blurb: 'Next.js projection layer on Vercel. Owns near-zero canonical state — it reads its sources over APIs and renders; it never mirrors them.',
    source: 'Next.js · Vercel',
    x: 38,
    y: 28,
  },
  {
    id: 'university',
    label: 'GTM University',
    kind: 'surface',
    blurb: 'Self-instrumented learning surface. Public completion metrics only; the forecast and logged time stay in the cockpit.',
    source: 'Next.js route',
    x: 38,
    y: 64,
  },
  {
    id: 'notion',
    label: 'Notion',
    kind: 'source',
    blurb: 'Produced artifacts — writeups, briefs, drafts. Adapter is the next slice; drawn here as a planned source, not yet wired.',
    source: 'Notion API',
    x: 38,
    y: 90,
  },
  {
    id: 'egress-gate',
    label: 'PII Egress Gate',
    kind: 'gate',
    blurb: 'assertPublicSafe(): every public payload is scanned for PII and confidential terms and throws on a hit. Default-deny, CI-enforced.',
    source: 'lib/public-safety.ts',
    x: 66,
    y: 46,
  },
  {
    id: 'public',
    label: 'Public Surfaces',
    kind: 'surface',
    blurb: 'The Work, Live (/) and this Living System Map (/system). Unauthed, cacheable, PII-safe projections only.',
    source: 'Next.js routes',
    x: 90,
    y: 46,
  },
]

export const EDGES: SystemEdge[] = [
  { from: 'github', to: 'hub' },
  { from: 'linear', to: 'hub' },
  { from: 'hub', to: 'egress-gate' },
  { from: 'learning', to: 'university' },
  { from: 'university', to: 'egress-gate' },
  // spine now feeds the Signal surface through the same egress gate (getPublicTopicIntelligence
  // ends with assertPublicSafe). The path is wired; the spine status dot tells whether data flows.
  { from: 'spine', to: 'egress-gate' },
  { from: 'egress-gate', to: 'public' },
  // notion: intentionally isolated — not yet feeding anything.
]
