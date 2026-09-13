import type { Curriculum, Resource } from './types'

// GTM University — the elevated full-stack GTM curriculum.
// Synthesized from the Full-Stack GTM Roadmap (V1.1) + 4 Phase-0 sources
// (Rosenthal's 11 skills, Clay's GTME whitepaper, the "1000 GTM jobs" analysis,
// Apollo's 2026 technical curriculum) + external best-in-class benchmarking.
//
// Hybrid competency model: Own areas (D1/D2/D3/D5) carry a leveled rubric
// (novice -> practitioner -> expert); Do/Recognize areas use binary completion.
// Every area is capped by a capstone. Time-on-task is logged per subtask.
//
// v2 (2026-09-13, YED-164): re-aimed against a GTM agent-engineering benchmark —
// agents that run revenue motions end to end, human-oversight design, evals in
// development and production, instrumentation tied to pipeline, governed MCP
// access, shared builder platforms, explainable models. Blend, not pivot: every
// v1 unit is kept (ids are immutable), gaps are filled add-only, and `path`
// sequences the whole program into stages.

const RUBRIC_BUILD = [
  { level: 'novice' as const, descriptor: 'Followed a reference/tutorial; works on the happy path; little error handling.' },
  { level: 'practitioner' as const, descriptor: 'Built it independently with idempotency, error handling, and a test; can explain the trade-offs.' },
  { level: 'expert' as const, descriptor: 'Production-grade and reusable; handles edge cases + observability; could teach it and defend it in a systems interview.' },
]

// ── Resources — every URL verified live 2026-09-13 ─────────────────────
const R = {
  agentsBuilding: { title: 'Building effective agents — Anthropic', url: 'https://www.anthropic.com/engineering/building-effective-agents', kind: 'article' },
  contextEng: { title: 'Effective context engineering for AI agents — Anthropic', url: 'https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents', kind: 'article' },
  toolsWriting: { title: 'Writing effective tools for AI agents — Anthropic', url: 'https://www.anthropic.com/engineering/writing-tools-for-agents', kind: 'article' },
  codeExecMcp: { title: 'Code execution with MCP — Anthropic', url: 'https://www.anthropic.com/engineering/code-execution-with-mcp', kind: 'article' },
  multiAgent: { title: 'How we built our multi-agent research system — Anthropic', url: 'https://www.anthropic.com/engineering/multi-agent-research-system', kind: 'article' },
  agentSkills: { title: 'Equipping agents for the real world with Agent Skills — Anthropic', url: 'https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills', kind: 'article' },
  claudeCodeBP: { title: 'Claude Code best practices — Anthropic', url: 'https://www.anthropic.com/engineering/claude-code-best-practices', kind: 'article' },
  evalsDemystified: { title: 'Demystifying evals for AI agents — Anthropic', url: 'https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents', kind: 'article' },
  agentSdk: { title: 'Claude Agent SDK — overview', url: 'https://platform.claude.com/docs/en/agent-sdk/overview', kind: 'docs' },
  anthropicCourses: { title: 'Anthropic courses (GitHub)', url: 'https://github.com/anthropics/courses', kind: 'course' },
  mcpIntro: { title: 'Model Context Protocol — introduction', url: 'https://modelcontextprotocol.io/docs/getting-started/intro', kind: 'docs' },
  mcpSpec: { title: 'Model Context Protocol — specification (2025-06-18)', url: 'https://modelcontextprotocol.io/specification/2025-06-18', kind: 'docs' },
  mcpTsSdk: { title: 'MCP TypeScript SDK', url: 'https://github.com/modelcontextprotocol/typescript-sdk', kind: 'repo' },
  hamelEvals: { title: 'Your AI product needs evals — Hamel Husain', url: 'https://hamel.dev/blog/posts/evals/', kind: 'article' },
  hamelFieldGuide: { title: 'A field guide to rapidly improving AI products — Hamel Husain', url: 'https://hamel.dev/blog/posts/field-guide/', kind: 'article' },
  hamelJudge: { title: 'Creating an LLM-as-a-judge that drives business results — Hamel Husain', url: 'https://hamel.dev/blog/posts/llm-judge/', kind: 'article' },
  eugeneEvals: { title: 'Task-specific LLM evals — Eugene Yan', url: 'https://eugeneyan.com/writing/evals/', kind: 'article' },
  validators: { title: 'Who Validates the Validators? — Shankar et al., 2024', url: 'https://arxiv.org/abs/2404.12272', kind: 'paper' },
  otelGenAI: { title: 'OpenTelemetry semantic conventions for generative AI', url: 'https://opentelemetry.io/docs/specs/semconv/gen-ai/', kind: 'docs' },
  posthogLLM: { title: 'PostHog LLM analytics', url: 'https://posthog.com/docs/llm-analytics', kind: 'docs' },
  molnar: { title: 'Interpretable Machine Learning — Christoph Molnar', url: 'https://christophm.github.io/interpretable-ml-book/', kind: 'book' },
  shap: { title: 'A Unified Approach to Interpreting Model Predictions (SHAP) — Lundberg & Lee, 2017', url: 'https://arxiv.org/abs/1705.07874', kind: 'paper' },
  experimentGuide: { title: 'Trustworthy Online Controlled Experiments — Kohavi, Tang & Xu', url: 'https://experimentguide.com/', kind: 'book' },
  mixtape: { title: 'Causal Inference: The Mixtape — Scott Cunningham', url: 'https://mixtape.scunning.com/', kind: 'book' },
  modeSql: { title: 'Mode SQL tutorial', url: 'https://mode.com/sql-tutorial', kind: 'course' },
  tsHandbook: { title: 'The TypeScript Handbook', url: 'https://www.typescriptlang.org/docs/handbook/intro.html', kind: 'docs' },
  pyTutorial: { title: 'The Python Tutorial', url: 'https://docs.python.org/3/tutorial/', kind: 'docs' },
  googleReview: { title: 'Google engineering practices — code review', url: 'https://google.github.io/eng-practices/review/', kind: 'docs' },
  sweAtGoogle: { title: 'Software Engineering at Google (free online)', url: 'https://abseil.io/resources/swe-book', kind: 'book' },
  innersource: { title: 'Adopting InnerSource (free)', url: 'https://innersourcecommons.org/learn/books/adopting-innersource-principles-and-case-studies/', kind: 'book' },
  codeowners: { title: 'GitHub — about code owners', url: 'https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners', kind: 'docs' },
  staffEng: { title: 'Staff Engineer — Will Larson', url: 'https://staffeng.com/book', kind: 'book' },
  huyen: { title: 'AI Engineering — Chip Huyen', url: 'https://huyenchip.com/books/', kind: 'book' },
} satisfies Record<string, Resource>

export const curriculum: Curriculum = {
  areas: [
    // ───────────────────────── D1 — Commercial ─────────────────────────
    {
      id: 'd1-commercial',
      domainId: 'd1',
      title: 'Commercial & Enterprise Sales',
      tier: 'own',
      competencyMode: 'leveled',
      summary:
        'The commercial spine: modern enterprise deal shape, value-based selling, and qualification as an inspection tool. The "commercial thinker" half of the GTME hybrid.',
      sections: [
        {
          id: 'd1-deal-architecture',
          title: 'Deal Architecture',
          summary: 'MEDDPICC + SPICED as inspection frameworks; multi-threaded org maps.',
          modules: [
            {
              id: 'd1-deal-frameworks',
              title: 'Qualification frameworks as inspection tools',
              summary: 'MEDDPICC, Command of the Message, Winning by Design (SPICED).',
              subtasks: [
                { id: 'd1-deal-memo', title: 'Deal strategy memo (MEDDPICC + SPICED, multi-thread org map)', kind: 'project', complexity: 4, rubric: RUBRIC_BUILD, prompt: 'Write a 3–5 page deal strategy memo on a real prospect.' },
                { id: 'd1-discovery-call', title: 'Mock discovery call + self-review vs SPICED', kind: 'exercise', complexity: 2, rubric: RUBRIC_BUILD },
              ],
            },
          ],
        },
        {
          id: 'd1-value-negotiation',
          title: 'Value Selling & Negotiation',
          summary: 'Quantified outcomes; Voss-style negotiation.',
          modules: [
            {
              id: 'd1-value',
              title: 'Value-based selling',
              subtasks: [
                { id: 'd1-exec-email', title: 'Exec-sponsor email to a CRO using only public signals', kind: 'exercise', complexity: 2, rubric: RUBRIC_BUILD },
              ],
            },
          ],
        },
        {
          id: 'd1-workflow-grounding',
          title: 'Seller Workflow Grounding',
          summary: 'v2: agents encode real selling work — observe it before you automate it.',
          modules: [
            {
              id: 'd1-wg-shadow',
              title: 'Shadow the motion, then design the agent',
              summary: 'Turn selling experience into agent requirements: what the work actually is, where judgment lives, what must stay human.',
              body:
                '## Why this matters\n\nThe fastest way to build a useless sales agent is to automate the process as documented instead of the process as practiced. Sit with the work first: time each step, note where sellers override the playbook, and mark every decision that carries relationship or deal risk.\n\n## What you are building\n\nA friction map of real workflows and an agent design brief naming the trigger, the decision points, the data each step needs, and the steps that stay human. Every later build in the path is graded against this brief.',
              resources: [R.agentsBuilding],
              subtasks: [
                { id: 'd1-wg-shadow-sessions', title: 'Shadow 3 real seller workflows (inbound triage, outbound prep, pipeline review) → time-and-friction map', kind: 'exercise', complexity: 2, rubric: RUBRIC_BUILD },
                { id: 'd1-wg-agent-brief', title: 'Agent design brief grounded in an observed workflow (trigger, decision points, data needs, what stays human)', kind: 'project', complexity: 3, rubric: RUBRIC_BUILD, prompt: 'Pick the highest-friction workflow from the shadow map and write the brief an engineer could build from.' },
              ],
            },
          ],
        },
        {
          id: 'd1-capstones',
          title: 'Capstone',
          modules: [
            {
              id: 'd1-cap-velocity',
              title: 'Sales-velocity / enablement system',
              summary: 'ELEVATION: deal acceleration + collateral lifecycle + rep enablement, designed as a system.',
              subtasks: [
                { id: 'd1-cap-velocity-build', title: 'Design a sales-velocity system (deal acceleration + enablement)', kind: 'capstone', complexity: 5, isCapstone: true, rubric: RUBRIC_BUILD },
              ],
            },
          ],
        },
      ],
    },

    // ───────────────────────── D2 — GTM Systems ────────────────────────
    {
      id: 'd2-gtm-systems',
      domainId: 'd2',
      title: 'Full-Funnel GTM Systems',
      tier: 'own',
      competencyMode: 'leveled',
      summary:
        'Head-of-GTM-architecture thinking: the bowtie funnel, operating rhythm, capacity/comp/territory modeling, and funnel diagnostics.',
      sections: [
        {
          id: 'd2-funnel',
          title: 'Funnel & Diagnostics',
          summary: 'Bowtie funnel; conversion, velocity, slippage, CAC, payback, retention, magic number.',
          modules: [
            {
              id: 'd2-bowtie',
              title: 'Bowtie funnel & diagnostics',
              subtasks: [
                { id: 'd2-funnel-decomp', title: 'Funnel decomposition retrospective on one closed deal', kind: 'exercise', complexity: 3, rubric: RUBRIC_BUILD },
              ],
            },
          ],
        },
        {
          id: 'd2-modeling',
          title: 'Operating Rhythm & Modeling',
          summary: 'Capacity modeling, comp design, territory/routing, operating cadence.',
          modules: [
            {
              id: 'd2-capacity',
              title: 'Capacity & operating-rhythm modeling',
              subtasks: [
                { id: 'd2-capacity-model', title: 'Capacity model for a 20-AE team hitting $40M new ARR (stress-tested)', kind: 'project', complexity: 4, rubric: RUBRIC_BUILD },
                { id: 'd2-roe', title: 'Rules-of-engagement doc (Commercial ≤500 vs Enterprise >500)', kind: 'exercise', complexity: 2, rubric: RUBRIC_BUILD },
              ],
            },
          ],
        },
        {
          id: 'd2-agent-motions',
          title: 'Motions as Agent-Runnable Systems',
          summary: 'v2: specify inbound, outbound, and pipeline management precisely enough for an agent to run them — and baseline them so ROI is provable.',
          modules: [
            {
              id: 'd2-am-motion-map',
              title: 'Motion specs + ROI baselines',
              body:
                '## Why this matters\n\nAn agent can only run a motion that is specified: inputs, SLAs, CRM state transitions, and the metric that says it worked. ROI can only be proven against a baseline captured *before* the agent ships.',
              subtasks: [
                { id: 'd2-am-motion-spec', title: 'Motion spec for inbound, outbound, and pipeline management (inputs, SLAs, CRM state transitions, success metrics)', kind: 'project', complexity: 3, rubric: RUBRIC_BUILD },
                { id: 'd2-am-roi-model', title: 'ROI baseline for one motion (time and cost per unit today, conversion rates, attribution plan)', kind: 'exercise', complexity: 3, rubric: RUBRIC_BUILD },
              ],
            },
          ],
        },
        {
          id: 'd2-capstones',
          title: 'Capstone',
          modules: [
            {
              id: 'd2-cap',
              title: 'Operating-rhythm proposal for a Series B AI-native',
              subtasks: [
                { id: 'd2-cap-build', title: 'One-page operating rhythm proposal (forecast calls, pipeline councils, QBRs, variance reviews)', kind: 'capstone', complexity: 4, isCapstone: true, rubric: RUBRIC_BUILD },
              ],
            },
          ],
        },
      ],
    },

    // ─────────────────────── D3 — GTM Engineering ──────────────────────
    // The load-bearing "engineer" area. Richest in the curriculum; the
    // V1 vertical slice fully fleshes the "Signal & Data Engineering" section.
    {
      id: 'd3-gtm-engineering',
      domainId: 'd3',
      title: 'GTM Engineering Craft',
      tier: 'own',
      competencyMode: 'leveled',
      summary:
        'The craft of building automated revenue systems: orchestration, data engineering for GTM, signal & scoring, activation channels, and stack architecture. Spans all three rungs (foundation -> modeling -> activation).',
      sections: [
        {
          id: 'd3-orchestration',
          title: 'Workflow & Orchestration',
          summary: 'Event-driven workflows, webhooks, idempotency, retries, error handling.',
          modules: [
            {
              id: 'd3-orch-eventdriven',
              title: 'Event-driven workflow design',
              subtasks: [
                { id: 'd3-orch-webhook-schema', title: 'Webhook + event-schema design (reliable triggers)', kind: 'project', complexity: 3, rubric: RUBRIC_BUILD },
                { id: 'd3-orch-idempotency', title: 'Idempotency + retry/error-handling pattern', kind: 'exercise', complexity: 3, rubric: RUBRIC_BUILD },
              ],
            },
          ],
        },
        {
          id: 'd3-signal-data-eng',
          title: 'Signal & Data Engineering',
          summary:
            'The rung-1/rung-2 core: a clean data foundation, then the modeling that predicts. Fully fleshed for the V1 slice — these are live gtm-os builds you can log against tonight.',
          modules: [
            {
              id: 'd3-sde-spine',
              title: 'Supabase spine scaffold',
              summary: 'Stand up the canonical data spine with production rigor.',
              body:
                '## Why this matters\n\nRung 1 is the make-or-break: *"most companies stumble on the first rung."* Before any scoring or activation, the spine must be trustworthy — schema rigor, idempotency, RLS, and PII-safe projection views.\n\n## What you are building\n\nA schema-per-domain Supabase foundation: append-only raw landing, resolved canonical entities, and `v_public_*` views that exclude PII by construction. Ordered UUID keys, `updated_at` triggers, insert-time uniqueness for idempotency.\n\n> Meta: the GTM University `learning` schema you are reading this through **is** an instance of this module — log the time you spend building it here.',
              subtasks: [
                {
                  id: 'd3-sde-spine-scaffold',
                  title: 'Scaffold a Supabase schema with rigor (tables, RLS, idempotency, v_public_ views)',
                  kind: 'project',
                  complexity: 3,
                  ref: 'YED-45',
                  prompt: 'Design + apply a domain schema: stable keys, RLS, generated/derived columns, and PII-safe public projection views. Document the migration.',
                  rubric: RUBRIC_BUILD,
                },
              ],
            },
            {
              id: 'd3-sde-hygiene',
              title: 'Hygiene tier-1: identity resolution + dedup + provenance',
              summary: 'ELEVATION (D3 skill-tree): name identity resolution, dedup, and provenance as distinct craft skills.',
              body:
                '## Rung 1, properly\n\nClean, de-duped, trustworthy records. Three named craft skills:\n\n1. **Identity resolution** — a canonical entity ID with a crosswalk to source IDs (Notion/HubSpot/Apollo).\n2. **Deduplication** — insert-time uniqueness + a merge-and-purge sweep.\n3. **Provenance** — every row stamped with `source` + `ingested_at`, so conflicts are explainable.',
              subtasks: [
                { id: 'd3-sde-identity', title: 'Identity resolution + entity crosswalk', kind: 'project', complexity: 4, ref: 'YED-47', rubric: RUBRIC_BUILD, prompt: 'Build a canonical entity ID with a crosswalk table (source, external_id).' },
                { id: 'd3-sde-dedup', title: 'Dedup + merge-and-purge routine', kind: 'project', complexity: 3, ref: 'YED-47', rubric: RUBRIC_BUILD },
                { id: 'd3-sde-provenance', title: 'Provenance / source stamping + conflict log', kind: 'exercise', complexity: 2, ref: 'YED-47', rubric: RUBRIC_BUILD },
              ],
            },
            {
              id: 'd3-sde-scoring',
              title: 'Propensity / fit scoring model',
              summary: 'ELEVATION (Rung-2 thickening): the explicit modeling deliverable that separates "data plumber" from "growth architect".',
              body:
                '## Rung 2 — the differentiator\n\nUnique data points that *predict* purchase, expansion, or churn. This is the thinnest rung in most curricula and the clearest hiring signal. You will define ICP fit attributes, weight them, and produce a fit/propensity score that downstream activation can act on.',
              resources: [R.molnar, R.shap],
              subtasks: [
                { id: 'd3-sde-icp-attrs', title: 'Define ICP fit attributes + scoring rubric', kind: 'exercise', complexity: 3, ref: 'YED-59', rubric: RUBRIC_BUILD },
                { id: 'd3-sde-score-model', title: 'Build a propensity / fit-score model', kind: 'project', complexity: 4, ref: 'YED-59', rubric: RUBRIC_BUILD, prompt: 'Implement a weighted fit/propensity score over enriched account attributes; validate against known-good accounts.' },
                { id: 'd3-sde-explainable', title: 'Explainable score: per-account reason codes (feature contributions) an agent can quote to a seller', kind: 'project', complexity: 3, rubric: RUBRIC_BUILD, prompt: 'Extend the score so every output carries its top contributing factors in plain language; check with sellers that the reasons hold up on 10 known accounts.' },
              ],
            },
            {
              id: 'd3-sde-enrichment',
              title: 'Enrichment waterfalls & reverse ETL',
              summary: 'ELEVATION: enrichment waterfalls + reverse ETL (warehouse -> CRM activation).',
              subtasks: [
                { id: 'd3-sde-waterfall', title: 'Enrichment waterfall (multi-source, cost-aware)', kind: 'project', complexity: 3, rubric: RUBRIC_BUILD },
                { id: 'd3-sde-reverse-etl', title: 'Reverse ETL: push scored data warehouse -> CRM', kind: 'project', complexity: 4, rubric: RUBRIC_BUILD },
              ],
            },
          ],
        },
        {
          id: 'd3-activation',
          title: 'Activation Channels',
          summary: 'ELEVATION: automated outbound, inbound orchestration, ads audiences.',
          modules: [
            {
              id: 'd3-act-channels',
              title: 'Multi-channel activation',
              subtasks: [
                { id: 'd3-act-outbound', title: 'Automated outbound (signal -> personalize -> send)', kind: 'project', complexity: 4, rubric: RUBRIC_BUILD },
                { id: 'd3-act-inbound', title: 'Inbound orchestration (form -> enrich -> route -> score)', kind: 'project', complexity: 3, rubric: RUBRIC_BUILD },
                { id: 'd3-act-ads', title: 'Ads audiences (CRM-synced custom audiences)', kind: 'exercise', complexity: 2, rubric: RUBRIC_BUILD },
                { id: 'd3-act-pipeline-agent', title: 'Pipeline-management agent (stale-deal + risk detection → next-best-action draft → rep approval)', kind: 'project', complexity: 4, rubric: RUBRIC_BUILD },
              ],
            },
          ],
        },
        {
          id: 'd3-stack-crm',
          title: 'Stack & CRM Architecture',
          summary: 'Tech-stack evaluation, CRM data modeling, iPaaS/middleware.',
          modules: [
            {
              id: 'd3-stack',
              title: 'Stack architecture',
              subtasks: [
                { id: 'd3-stack-eval', title: 'Tech-stack evaluation (fewer, better-connected tools)', kind: 'exercise', complexity: 2, rubric: RUBRIC_BUILD },
                { id: 'd3-stack-crm-model', title: 'CRM data modeling (consistent objects across sales + marketing)', kind: 'project', complexity: 3, rubric: RUBRIC_BUILD },
              ],
            },
          ],
        },
        {
          id: 'd3-prod-eng',
          title: 'Production Engineering Fundamentals',
          summary: 'v2: the gap between "ships AI systems" and "engineer on a production team" — typed code, tests, CI, and code review as habits.',
          modules: [
            {
              id: 'd3-pe-core',
              title: 'Typed, tested, reviewed, shipped',
              body:
                '## Why this sits first in the path\n\nEvery later build (agents, evals, MCP servers) is judged on production rigor, not on whether it ran once. Agentic coding makes code cheap to produce; it makes *judgment about code* the scarce skill. You need to read a diff and know whether it is safe to merge.\n\n## What you are building\n\nOne existing pipeline script rebuilt as a typed TypeScript module with unit tests and a CI gate, a Python port of one data job, and a written code-review checklist applied to real PRs.',
              resources: [R.tsHandbook, R.pyTutorial, R.googleReview, R.sweAtGoogle, R.claudeCodeBP],
              subtasks: [
                { id: 'd3-pe-ts-service', title: 'Rebuild one pipeline script as a typed TypeScript module with unit tests + CI (lint, typecheck, test on every PR)', kind: 'project', complexity: 3, rubric: RUBRIC_BUILD },
                { id: 'd3-pe-python', title: 'Python working fluency: port one data job to Python with pytest', kind: 'exercise', complexity: 3, rubric: RUBRIC_BUILD },
                { id: 'd3-pe-code-review', title: 'Review 5 real PRs against a written review checklist; record what you caught and what you missed', kind: 'exercise', complexity: 2, rubric: RUBRIC_BUILD },
              ],
            },
          ],
        },
        {
          id: 'd3-shared-platform',
          title: 'Shared Platform & Inner Source',
          summary: 'v2: a codebase many GTM builders contribute to — conventions, ownership, and automated checks that keep quality high without a bottleneck reviewer.',
          modules: [
            {
              id: 'd3-sp-repo',
              title: 'Contribution conventions + tested skills',
              body:
                '## Why this matters\n\nOnce more than one person publishes agents and skills, quality is a property of the repo, not of the author. The `alex` plugin is already a shared library; this module makes it one that others could safely contribute to.',
              resources: [R.innersource, R.codeowners, R.agentSkills],
              subtasks: [
                { id: 'd3-sp-contrib-conventions', title: 'Contribution conventions for a shared skills repo (CONTRIBUTING, CODEOWNERS, PR template, required checks)', kind: 'project', complexity: 3, rubric: RUBRIC_BUILD },
                { id: 'd3-sp-skill-tests', title: 'Every published skill/agent ships with eval cases that run in CI', kind: 'project', complexity: 4, rubric: RUBRIC_BUILD },
              ],
            },
          ],
        },
        {
          id: 'd3-capstones',
          title: 'Capstones',
          summary: 'The three D3 capstones (foundation -> modeling -> activation).',
          modules: [
            {
              id: 'd3-cap-modules',
              title: 'GTM Engineering capstones',
              subtasks: [
                { id: 'd3-cap-1-signal-pipeline', title: 'Capstone 1 — Signal Pipeline live (spine + hygiene + 2–3 signals + R2 dashboard)', kind: 'capstone', complexity: 5, isCapstone: true, rubric: RUBRIC_BUILD },
                { id: 'd3-cap-2-outbound-engine', title: 'Capstone 2 — Event-Driven Outbound Engine (signal -> ICP -> personalize -> CRM -> sequence)', kind: 'capstone', complexity: 5, isCapstone: true, rubric: RUBRIC_BUILD },
                { id: 'd3-cap-3-consulting-sim', title: 'Capstone 3 — Forward-Deployed Consulting Simulation (scope-only)', kind: 'capstone', complexity: 3, isCapstone: true, rubric: RUBRIC_BUILD },
              ],
            },
          ],
        },
      ],
    },

    // ───────────────────────── D4 — Data ───────────────────────────────
    {
      id: 'd4-data',
      domainId: 'd4',
      title: 'Data & Analytics Fluency',
      tier: 'do',
      competencyMode: 'binary',
      summary: 'A credible conversation partner with analytics engineers; the rung-1/2 validator. SQL, the modern data stack, dbt, metrics, cohorts.',
      sections: [
        {
          id: 'd4-sql',
          title: 'SQL & Modeling',
          modules: [
            {
              id: 'd4-sql-core',
              title: 'Working SQL + dbt',
              resources: [R.modeSql],
              subtasks: [
                { id: 'd4-mode-sql', title: 'Mode SQL tutorial (joins, windows, CTEs, date math)', kind: 'exercise', complexity: 3 },
                { id: 'd4-dbt-model', title: 'Build one dbt model (stg_ + fct_) on a real CRM export', kind: 'project', complexity: 3 },
              ],
            },
          ],
        },
        {
          id: 'd4-metrics',
          title: 'Metrics & Cohorts',
          modules: [
            {
              id: 'd4-metrics-core',
              title: 'Metrics dictionary & cohort analysis',
              subtasks: [
                { id: 'd4-metrics-dict', title: 'Metrics dictionary (ARR/NRR/GRR/CAC/Payback/Magic Number/Rule of 40)', kind: 'exercise', complexity: 2 },
                { id: 'd4-cohort', title: 'Cohort retention analysis from CSV + 1-paragraph narrative', kind: 'exercise', complexity: 2 },
              ],
            },
          ],
        },
        {
          id: 'd4-experimentation',
          title: 'Experimentation & Causal Analysis',
          summary: 'v2: prove an agent changed an outcome — not just that the outcome changed.',
          modules: [
            {
              id: 'd4-exp',
              title: 'A/B tests and causal reads',
              resources: [R.experimentGuide, R.mixtape],
              subtasks: [
                { id: 'd4-exp-ab-design', title: 'A/B test design: agent-drafted vs human-drafted outreach step (hypothesis, unit, sample size, guardrail metrics)', kind: 'exercise', complexity: 3 },
                { id: 'd4-exp-causal', title: 'Causal read on one agent intervention (difference-in-differences or matched comparison) with stated limitations', kind: 'project', complexity: 4 },
              ],
            },
          ],
        },
        {
          id: 'd4-capstones',
          title: 'Capstone',
          modules: [
            {
              id: 'd4-cap',
              title: 'Analytics mini-capstone',
              subtasks: [
                { id: 'd4-cap-build', title: 'dbt model + metrics dictionary + cohort analysis, shipped together', kind: 'capstone', complexity: 4, isCapstone: true },
              ],
            },
          ],
        },
      ],
    },

    // ───────────────────────── D5 — AI / Agent ─────────────────────────
    {
      id: 'd5-ai-agent',
      domainId: 'd5',
      title: 'AI / Agent Engineering',
      tier: 'own',
      competencyMode: 'leveled',
      summary: 'The AI multiplier: LLM fundamentals, context engineering, agents + tool use/MCP, the Claude Agent SDK, human-oversight design, evals in development and production, observability tied to revenue, and Content Engineering (the D5×D9 bridge).',
      sections: [
        {
          id: 'd5-foundations',
          title: 'Foundations & Prompting',
          modules: [
            {
              id: 'd5-llm',
              title: 'LLM fundamentals + prompt engineering',
              resources: [R.anthropicCourses, R.huyen],
              subtasks: [
                { id: 'd5-prompt-craft', title: 'Prompt craft (system prompts, few-shot, CoT, prompt chaining)', kind: 'exercise', complexity: 2, rubric: RUBRIC_BUILD },
              ],
            },
          ],
        },
        {
          id: 'd5-context-tools',
          title: 'Context Engineering & Tool Design',
          summary: 'v2: what enters the context window, and the tools an agent calls, decide most agent quality.',
          modules: [
            {
              id: 'd5-ct',
              title: 'Context engineering + tool design',
              resources: [R.contextEng, R.toolsWriting, R.codeExecMcp],
              subtasks: [
                { id: 'd5-ct-context', title: 'Context-engineering pass on one existing agent (what enters the window, compaction, just-in-time retrieval)', kind: 'exercise', complexity: 2, rubric: RUBRIC_BUILD },
                { id: 'd5-ct-tool-design', title: "Redesign one agent's tool set per tool-design guidance; measure before/after on 10 fixed test cases", kind: 'project', complexity: 3, rubric: RUBRIC_BUILD },
              ],
            },
          ],
        },
        {
          id: 'd5-agents-evals',
          title: 'Agents, Tools & Evals',
          modules: [
            {
              id: 'd5-agents',
              title: 'Agents, tool use, MCP, and evaluation',
              resources: [R.agentsBuilding, R.multiAgent, R.mcpIntro, R.hamelEvals],
              subtasks: [
                { id: 'd5-eval-harness', title: 'Eval harness (10 golden examples + LLM-as-judge + regression log)', kind: 'project', complexity: 4, ref: 'YED-48', rubric: RUBRIC_BUILD },
                { id: 'd5-mcp-server', title: 'Ship one MCP server (reads a Notion DB or a Supabase view)', kind: 'project', complexity: 3, rubric: RUBRIC_BUILD },
                { id: 'd5-agentic-system', title: 'Non-Empire-State agentic system (single LLM + 3–5 tools + 1 eval suite)', kind: 'project', complexity: 4, rubric: RUBRIC_BUILD },
              ],
            },
          ],
        },
        {
          id: 'd5-agent-sdk',
          title: 'Claude Agent SDK & Governed MCP',
          summary: 'v2: from agents that run inside Claude Code to standalone agents and MCP servers other people and agents can safely use.',
          modules: [
            {
              id: 'd5-sdk',
              title: 'Standalone agents + governed access to revenue systems',
              body:
                '## The step up\n\nAgents that run inside Claude Code have you at the keyboard. Production agents run without you: their own permissions, sessions, and failure handling. A governed MCP server is the other half — scoped tools over a revenue system with auth, an audit log, and limits, so sellers and their agents get access without getting the keys to the CRM.',
              resources: [R.agentSdk, R.mcpSpec, R.mcpTsSdk, R.agentSkills],
              subtasks: [
                { id: 'd5-sdk-agent', title: 'Port one Claude Code workflow to a standalone Claude Agent SDK agent (tools, permissions, sessions, error handling)', kind: 'project', complexity: 4, rubric: RUBRIC_BUILD },
                { id: 'd5-sdk-mcp-governed', title: 'Governed MCP server over a revenue system (scoped read/write tools, auth, audit log, rate limits)', kind: 'project', complexity: 4, rubric: RUBRIC_BUILD, prompt: 'Extend the basic MCP server: split read and write tools, require approval for writes, and log every call with who, what, and when.' },
              ],
            },
          ],
        },
        {
          id: 'd5-oversight',
          title: 'Human Oversight Design',
          summary: 'v2: approval gates, handoffs, and escalation paths that keep sellers in control — and the evidence that earns an agent more autonomy.',
          modules: [
            {
              id: 'd5-ov',
              title: 'Oversight design + evidence-based autonomy',
              body:
                '## Oversight is a design surface, not a checkbox\n\nFor each motion decide, step by step: who approves, what the approver sees, what happens on timeout, when the agent must escalate, and how a seller stops it. Then define the evidence (eval pass rates, production error rates, human override rates) that moves a step from *approve first* to *act and report*. This formalizes the human-in-the-loop discipline already running in the Empire State pipeline.',
              resources: [R.agentsBuilding, R.evalsDemystified],
              subtasks: [
                { id: 'd5-ov-gates', title: 'Oversight design doc for one motion (approval gates, handoffs, escalation paths, kill switch, autonomy levels)', kind: 'project', complexity: 3, rubric: RUBRIC_BUILD },
                { id: 'd5-ov-autonomy-promotion', title: 'Autonomy promotion criteria: the eval + production thresholds that move a step from approve-first to automatic', kind: 'exercise', complexity: 3, rubric: RUBRIC_BUILD },
              ],
            },
          ],
        },
        {
          id: 'd5-eval-ops',
          title: 'Evals in Development & Production',
          summary: 'v2: find real failures in transcripts, turn them into seeded scenarios, and gate every change on a regression run.',
          modules: [
            {
              id: 'd5-eo',
              title: 'Transcript analysis → seeded suites → regression gates',
              body:
                '## Start from failures, not metrics\n\nRead real transcripts first. Label what went wrong in plain words, group the labels into a failure taxonomy, and fix the most frequent failures. Only then write scenarios and rubrics — they now test failures you have actually seen. An LLM judge is an instrument: check it against human labels before trusting its scores.',
              resources: [R.hamelFieldGuide, R.hamelEvals, R.hamelJudge, R.eugeneEvals, R.validators, R.evalsDemystified],
              subtasks: [
                { id: 'd5-eo-transcript-analysis', title: 'Error analysis on 50 real agent transcripts (open coding → failure taxonomy → top-3 fixes shipped)', kind: 'exercise', complexity: 3, rubric: RUBRIC_BUILD },
                { id: 'd5-eo-seeded-suite', title: 'Seeded scenarios + scoring rubrics + a regression run on every change (CI-gated)', kind: 'project', complexity: 4, rubric: RUBRIC_BUILD },
                { id: 'd5-eo-judge-validation', title: 'Validate an LLM judge against human labels (agreement rate, disagreement review, rubric fixes)', kind: 'exercise', complexity: 3, ref: 'YED-109', rubric: RUBRIC_BUILD },
              ],
            },
          ],
        },
        {
          id: 'd5-observability',
          title: 'Observability & ROI Measurement',
          summary: 'v2: instrument model and tool calls in production, then tie agent actions to pipeline and revenue.',
          modules: [
            {
              id: 'd5-obs',
              title: 'Tracing + action-to-revenue attribution',
              body:
                '## Two questions every agent must answer\n\n1. **What did it do?** Traces of every model and tool call: inputs, outputs, tokens, latency, cost, errors.\n2. **Did it matter?** A join from each agent action to its CRM outcome (meeting booked, stage advanced, deal won), rolled into a weekly readout against the ROI baseline from D2.',
              resources: [R.otelGenAI, R.posthogLLM],
              subtasks: [
                { id: 'd5-obs-tracing', title: 'Instrument model + tool calls (traces, tokens, latency, cost, outcome) using the GenAI semantic conventions', kind: 'project', complexity: 3, rubric: RUBRIC_BUILD },
                { id: 'd5-obs-roi', title: 'Tie agent actions to pipeline: action → CRM outcome join + weekly ROI readout vs baseline', kind: 'project', complexity: 4, rubric: RUBRIC_BUILD },
              ],
            },
          ],
        },
        {
          id: 'd5-content-engineering',
          title: 'Content Engineering (D5×D9 bridge)',
          summary: 'ELEVATION (sources’ highest-leverage flag): programmatic AI content generation with evals — the bridge to distribution.',
          modules: [
            {
              id: 'd5-ce',
              title: 'Programmatic content generation with evals',
              body:
                '## The highest-leverage skill\n\nRosenthal flags Content Engineering as *"potentially the most powerful"* GTME skill; Apollo treats AI content systems as table stakes. This is not "writing with ChatGPT" — it is a **system**: structured generation, voice/quality evals, human-in-the-loop review, and a distribution pipeline. It sits between D5 (AI) and D9 (Writing) and powers the Empire State distribution work.',
              subtasks: [
                { id: 'd5-ce-pipeline', title: 'Build a content-generation pipeline with quality evals + HITL review', kind: 'project', complexity: 4, rubric: RUBRIC_BUILD },
              ],
            },
          ],
        },
        {
          id: 'd5-capstones',
          title: 'Capstone',
          modules: [
            {
              id: 'd5-cap',
              title: 'AI/Agent capstone',
              subtasks: [
                { id: 'd5-cap-build', title: 'Eval harness + agentic system + MCP server, shipped as a portfolio set', kind: 'capstone', complexity: 5, isCapstone: true, rubric: RUBRIC_BUILD },
              ],
            },
            {
              id: 'd5-cap-motion',
              title: 'Agent-run motion capstone',
              summary: 'v2: the integrated proof — one revenue motion run end to end by an agent, with every production discipline attached.',
              subtasks: [
                { id: 'd5-cap-motion-build', title: 'One GTM motion run end to end by an agent: first signal → drafted, human-reviewed action, with oversight design, seeded eval suite, governed MCP access, production tracing, and an ROI readout', kind: 'capstone', complexity: 5, isCapstone: true, rubric: RUBRIC_BUILD },
              ],
            },
          ],
        },
      ],
    },

    // ───────────────────────── D6 — PMM ────────────────────────────────
    {
      id: 'd6-pmm',
      domainId: 'd6',
      title: 'Product Marketing & Narrative',
      tier: 'do',
      competencyMode: 'binary',
      summary: 'Positioning vs messaging, JTBD, competitive intelligence, strategic narrative.',
      sections: [
        {
          id: 'd6-positioning',
          title: 'Positioning & Narrative',
          modules: [
            {
              id: 'd6-pos',
              title: 'Positioning + strategic narrative',
              subtasks: [
                { id: 'd6-positioning-onepager', title: 'Positioning one-pager for yourself (Dunford template)', kind: 'exercise', complexity: 2 },
                { id: 'd6-battlecard', title: 'Competitive battlecard (Clay vs one alternative), published', kind: 'exercise', complexity: 2 },
                { id: 'd6-narrative', title: 'Strategic narrative piece (Raskin 5-part, ~1,500–2,000 words)', kind: 'project', complexity: 3 },
              ],
            },
          ],
        },
        {
          id: 'd6-capstones',
          title: 'Capstone',
          modules: [
            {
              id: 'd6-cap',
              title: 'PMM capstone',
              subtasks: [
                { id: 'd6-cap-build', title: 'Positioning + battlecard + narrative as one published set', kind: 'capstone', complexity: 3, isCapstone: true },
              ],
            },
          ],
        },
      ],
    },

    // ───────────────────────── D7 — CS ─────────────────────────────────
    {
      id: 'd7-cs',
      domainId: 'd7',
      title: 'Customer Strategy & Expansion',
      tier: 'do',
      competencyMode: 'binary',
      summary: 'Land-Adopt-Expand, success planning, health scoring, expansion plays, and win/loss analysis.',
      sections: [
        {
          id: 'd7-success',
          title: 'Success & Expansion',
          modules: [
            {
              id: 'd7-core',
              title: 'Success planning + health scoring',
              subtasks: [
                { id: 'd7-msp', title: 'Mutual Success Plan for a real prospect', kind: 'exercise', complexity: 2 },
                { id: 'd7-health', title: 'Health scorecard (10-metric, weighted, for AI-native SaaS)', kind: 'project', complexity: 3 },
                { id: 'd7-winloss', title: 'Win/loss analysis (ELEVATION: customer feedback loop)', kind: 'exercise', complexity: 2 },
              ],
            },
          ],
        },
        {
          id: 'd7-capstones',
          title: 'Capstone',
          modules: [
            {
              id: 'd7-cap',
              title: 'CS capstone',
              subtasks: [
                { id: 'd7-cap-build', title: 'Mutual Success Plan + health scorecard + win/loss, as one set', kind: 'capstone', complexity: 3, isCapstone: true },
              ],
            },
          ],
        },
      ],
    },

    // ───────────────────────── D8 — Leadership ─────────────────────────
    {
      id: 'd8-leadership',
      domainId: 'd8',
      title: 'Leadership & Org Design',
      tier: 'recognize',
      competencyMode: 'binary',
      summary: 'Recognize-only: executive decision-making, org structure, high-output management, and setting technical direction without management authority. Three books, no benchmarks.',
      sections: [
        {
          id: 'd8-reading',
          title: 'Reading',
          modules: [
            {
              id: 'd8-books',
              title: 'Foundational reading',
              resources: [R.staffEng],
              subtasks: [
                { id: 'd8-hard-things', title: 'Read "The Hard Thing About Hard Things" (Horowitz)', kind: 'exercise', complexity: 1 },
                { id: 'd8-working-backwards', title: 'Skim "Working Backwards" (Bryar & Carr)', kind: 'exercise', complexity: 1 },
                { id: 'd8-staff-eng', title: 'Read "Staff Engineer" (Larson) — archetypes and setting technical direction', kind: 'exercise', complexity: 1 },
              ],
            },
          ],
        },
      ],
    },

    // ───────────────────────── D9 — Writing ────────────────────────────
    {
      id: 'd9-writing',
      domainId: 'd9',
      title: 'Written Communication & Meta-Skills',
      tier: 'do',
      competencyMode: 'binary',
      summary: 'Writing as thinking (BLUF, Minto, SCQA), a public cadence, and the meta-skills (decision journal, weekly review). Practiced at Own intensity.',
      sections: [
        {
          id: 'd9-writing-craft',
          title: 'Writing & Cadence',
          modules: [
            {
              id: 'd9-craft',
              title: 'Writing as thinking + public cadence',
              subtasks: [
                { id: 'd9-exec-brief', title: '1-page executive brief (BLUF/Minto)', kind: 'exercise', complexity: 2 },
                { id: 'd9-scqa-rewrite', title: 'Narrative rewrite of a post using SCQA + engagement compare', kind: 'exercise', complexity: 2 },
                { id: 'd9-cadence', title: 'Public cadence: ship a weekly post (running)', kind: 'exercise', complexity: 1 },
              ],
            },
          ],
        },
        {
          id: 'd9-technical-comms',
          title: 'Technical Communication',
          summary: 'v2: explain technical decisions to sellers and engineers alike, and turn field observations into insight product teams can act on.',
          modules: [
            {
              id: 'd9-tc',
              title: 'Design docs + field reports',
              subtasks: [
                { id: 'd9-tc-design-doc', title: 'Design doc for one agent build, written for sellers and engineers (decision first, trade-offs explicit)', kind: 'exercise', complexity: 2 },
                { id: 'd9-tc-field-report', title: 'Field report: a repeatable pattern seen in production, written for a product/engineering audience', kind: 'exercise', complexity: 2 },
              ],
            },
          ],
        },
        {
          id: 'd9-meta',
          title: 'Meta-Skills',
          modules: [
            {
              id: 'd9-meta-core',
              title: 'Decision journal + weekly review',
              subtasks: [
                { id: 'd9-decision-journal', title: 'Decision journal (1 entry/week, running)', kind: 'exercise', complexity: 1 },
                { id: 'd9-weekly-review', title: 'Weekly review ritual (running)', kind: 'exercise', complexity: 1 },
              ],
            },
          ],
        },
        {
          id: 'd9-capstones',
          title: 'Capstone',
          modules: [
            {
              id: 'd9-cap',
              title: 'Writing capstone',
              subtasks: [
                { id: 'd9-cap-build', title: 'Published writeups + a pinned strategic narrative', kind: 'capstone', complexity: 3, isCapstone: true },
              ],
            },
          ],
        },
      ],
    },
  ],

  // ── The path: one sequence across all nine areas ─────────────────────
  // Areas say WHAT a skill is; the path says WHEN to learn it. Every subtask
  // sits in exactly one stage (enforced by lib/curriculum.test.ts).
  path: [
    {
      id: 'stage-0-rituals',
      title: 'Always on — operating rituals',
      continuous: true,
      goal: 'A weekly public post, a decision journal, and a weekly review running underneath every other stage.',
      why: 'These compound only when they run the whole way through; they are not a phase to finish.',
      exit: 'Running, not finished — measured by streak.',
      subtaskIds: ['d9-cadence', 'd9-decision-journal', 'd9-weekly-review'],
    },
    {
      id: 'stage-1-engineering-baseline',
      title: 'Engineering baseline',
      goal: 'Write, test, and review production code in TypeScript and Python; query data in SQL; control what a model sees.',
      why: 'The largest gap against the benchmark role. Every later build is judged on production rigor, so this comes first.',
      exit: 'One pipeline module rebuilt typed + tested behind a CI gate, and 5 PR reviews logged.',
      subtaskIds: ['d3-pe-ts-service', 'd3-pe-python', 'd3-pe-code-review', 'd4-mode-sql', 'd5-prompt-craft', 'd5-ct-context'],
    },
    {
      id: 'stage-2-ground-in-the-motion',
      title: 'Ground in the revenue motion',
      goal: 'Know the motions an agent will run — as practiced, with the metrics and baselines that define success.',
      why: 'Agents encode workflows. You cannot design oversight or prove ROI for a motion you have not mapped and baselined.',
      exit: 'Motion specs for inbound, outbound, and pipeline management, an ROI baseline, and an agent design brief.',
      subtaskIds: ['d1-wg-shadow-sessions', 'd2-funnel-decomp', 'd4-metrics-dict', 'd1-deal-memo', 'd1-discovery-call', 'd2-am-motion-spec', 'd2-am-roi-model', 'd1-wg-agent-brief'],
    },
    {
      id: 'stage-3-data-foundation',
      title: 'Data foundation (rung 1)',
      goal: 'A trustworthy, de-duplicated, provenance-stamped data layer agents can read from and write to safely.',
      why: 'Agents amplify whatever data they touch, so a clean foundation comes before anything acts on it.',
      exit: 'Capstone 1 — the signal pipeline live on a governed schema.',
      subtaskIds: ['d3-sde-spine-scaffold', 'd3-stack-crm-model', 'd3-orch-webhook-schema', 'd3-orch-idempotency', 'd3-sde-identity', 'd3-sde-dedup', 'd3-sde-provenance', 'd4-dbt-model', 'd3-stack-eval', 'd3-cap-1-signal-pipeline'],
    },
    {
      id: 'stage-4-first-agent',
      title: 'Build the agent, with oversight designed in',
      goal: 'A standalone agent with well-designed tools and MCP access, plus a written oversight design for the motion it serves.',
      why: 'The first build that acts. Oversight is designed alongside it, not bolted on after.',
      exit: 'An Agent SDK agent + MCP server running one workflow, with an oversight design and a design doc sellers can read.',
      subtaskIds: ['d5-ct-tool-design', 'd5-mcp-server', 'd5-agentic-system', 'd5-ov-gates', 'd5-sdk-agent', 'd9-tc-design-doc'],
    },
    {
      id: 'stage-5-prove-it',
      title: 'Prove it: evals + observability',
      goal: 'Find real failures in transcripts, gate every change on a regression suite, trust the judge, and trace production behavior.',
      why: 'An agent is not ready for customer-facing work until it is measured. This stage turns a demo into a system.',
      exit: 'The D5 capstone set — eval harness + agentic system + MCP server — with tracing on and CI-gated evals.',
      subtaskIds: ['d5-eo-transcript-analysis', 'd5-eval-harness', 'd5-eo-seeded-suite', 'd5-eo-judge-validation', 'd5-obs-tracing', 'd3-sp-skill-tests', 'd5-cap-build'],
    },
    {
      id: 'stage-6-model-and-explain',
      title: 'Model and explain (rung 2)',
      goal: 'Predictive scores that explain themselves, plus the experiment design to test whether acting on them works.',
      why: 'Agents that suggest actions need reasons a seller will trust. Modeling follows once the data and the eval discipline exist.',
      exit: 'An explainable fit/propensity score with reason codes, and the analytics mini-capstone shipped.',
      subtaskIds: ['d3-sde-icp-attrs', 'd3-sde-score-model', 'd3-sde-explainable', 'd4-cohort', 'd4-exp-ab-design', 'd4-cap-build'],
    },
    {
      id: 'stage-7-run-motions',
      title: 'Run motions end to end (rung 3)',
      goal: 'Inbound, outbound, and pipeline management run by agents under governed access, with autonomy earned by evidence and ROI measured.',
      why: 'Everything before this is a prerequisite: data, agents, evals, tracing, and models come together here.',
      exit: 'The agent-run motion capstone and the outbound engine, each with an ROI readout and a causal read.',
      subtaskIds: ['d3-sde-waterfall', 'd3-act-inbound', 'd3-act-outbound', 'd3-act-pipeline-agent', 'd3-sde-reverse-etl', 'd3-act-ads', 'd5-sdk-mcp-governed', 'd5-ov-autonomy-promotion', 'd5-obs-roi', 'd4-exp-causal', 'd5-ce-pipeline', 'd3-cap-2-outbound-engine', 'd5-cap-motion-build'],
    },
    {
      id: 'stage-8-commercial-breadth',
      title: 'Commercial breadth',
      goal: 'The seller-side artifacts — enablement, capacity, rules of engagement, success planning, positioning — that make agent designs commercially credible.',
      why: 'Mostly existing strength, so little new learning. It can run alongside stages 2–7 whenever a real deal or account supplies the material.',
      exit: 'The D1, D2, D6, and D7 capstone sets shipped.',
      subtaskIds: ['d1-exec-email', 'd2-capacity-model', 'd2-roe', 'd7-msp', 'd7-health', 'd7-winloss', 'd6-positioning-onepager', 'd6-battlecard', 'd6-narrative', 'd9-exec-brief', 'd9-scqa-rewrite', 'd1-cap-velocity-build', 'd2-cap-build', 'd6-cap-build', 'd7-cap-build'],
    },
    {
      id: 'stage-9-platform-and-direction',
      title: 'Shared platform and technical direction',
      goal: 'Set the conventions others build on, turn field patterns into product insight, and practice technical direction at senior level.',
      why: 'Senior-level scope only means something once there are shipped systems to generalize from.',
      exit: 'A contributable shared repo, a published field report, and the writing capstone.',
      subtaskIds: ['d3-sp-contrib-conventions', 'd9-tc-field-report', 'd8-staff-eng', 'd8-hard-things', 'd8-working-backwards', 'd3-cap-3-consulting-sim', 'd9-cap-build'],
    },
  ],
}

export default curriculum
