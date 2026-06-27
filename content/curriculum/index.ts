import type { Curriculum } from './types'

// GTM University — the elevated full-stack GTM curriculum.
// Synthesized from the Full-Stack GTM Roadmap (V1.1) + 4 Phase-0 sources
// (Rosenthal's 11 skills, Clay's GTME whitepaper, the "1000 GTM jobs" analysis,
// Apollo's 2026 technical curriculum) + external best-in-class benchmarking.
//
// Hybrid competency model: Own areas (D1/D2/D3/D5) carry a leveled rubric
// (novice -> practitioner -> expert); Do/Recognize areas use binary completion.
// Every area is capped by a capstone. Time-on-task is logged per subtask.

const RUBRIC_BUILD = [
  { level: 'novice' as const, descriptor: 'Followed a reference/tutorial; works on the happy path; little error handling.' },
  { level: 'practitioner' as const, descriptor: 'Built it independently with idempotency, error handling, and a test; can explain the trade-offs.' },
  { level: 'expert' as const, descriptor: 'Production-grade and reusable; handles edge cases + observability; could teach it and defend it in a systems interview.' },
]

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
              subtasks: [
                { id: 'd3-sde-icp-attrs', title: 'Define ICP fit attributes + scoring rubric', kind: 'exercise', complexity: 3, ref: 'YED-59', rubric: RUBRIC_BUILD },
                { id: 'd3-sde-score-model', title: 'Build a propensity / fit-score model', kind: 'project', complexity: 4, ref: 'YED-59', rubric: RUBRIC_BUILD, prompt: 'Implement a weighted fit/propensity score over enriched account attributes; validate against known-good accounts.' },
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
      summary: 'The AI multiplier: LLM fundamentals, prompt engineering, RAG, agents + tool use/MCP, evals, and Content Engineering (the D5×D9 bridge).',
      sections: [
        {
          id: 'd5-foundations',
          title: 'Foundations & Prompting',
          modules: [
            {
              id: 'd5-llm',
              title: 'LLM fundamentals + prompt engineering',
              subtasks: [
                { id: 'd5-prompt-craft', title: 'Prompt craft (system prompts, few-shot, CoT, prompt chaining)', kind: 'exercise', complexity: 2, rubric: RUBRIC_BUILD },
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
              subtasks: [
                { id: 'd5-eval-harness', title: 'Eval harness (10 golden examples + LLM-as-judge + regression log)', kind: 'project', complexity: 4, rubric: RUBRIC_BUILD },
                { id: 'd5-mcp-server', title: 'Ship one MCP server (reads a Notion DB or a Supabase view)', kind: 'project', complexity: 3, rubric: RUBRIC_BUILD },
                { id: 'd5-agentic-system', title: 'Non-Empire-State agentic system (single LLM + 3–5 tools + 1 eval suite)', kind: 'project', complexity: 4, rubric: RUBRIC_BUILD },
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
      summary: 'Recognize-only: executive decision-making, org structure, high-output management. Two books, no benchmarks.',
      sections: [
        {
          id: 'd8-reading',
          title: 'Reading',
          modules: [
            {
              id: 'd8-books',
              title: 'Foundational reading',
              subtasks: [
                { id: 'd8-hard-things', title: 'Read "The Hard Thing About Hard Things" (Horowitz)', kind: 'exercise', complexity: 1 },
                { id: 'd8-working-backwards', title: 'Skim "Working Backwards" (Bryar & Carr)', kind: 'exercise', complexity: 1 },
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
}

export default curriculum
