import type { Area, RubricLevel } from './types'

// D10 — Live Pursuit (added 2026-09-29).
// The job search run as a full-cycle enterprise pursuit: the product is me, the
// accounts are target employers, the buying committee is the hiring loop. Every
// skill in D1–D9 gets a live counterparty here.
//
// Method only. Target companies, contacts and process state live in the private
// CRM pipeline and Notion — never in this file (see CLAUDE.md guardrail 2).

const RUBRIC_PURSUIT: RubricLevel[] = [
  { level: 'novice', descriptor: 'Done once, from a template; the output exists but nothing downstream reads it.' },
  { level: 'practitioner', descriptor: 'Done on live accounts, logged in the pipeline, and it changed a next step (a meeting, an intro, a stage move).' },
  { level: 'expert', descriptor: 'Repeatable and measured against a baseline; could be handed to a rep as a play and defended in a sales-leadership interview.' },
]

export const livePursuit: Area = {
  id: 'd10-live-pursuit',
  domainId: 'd10',
  title: 'Live Pursuit — the search as a GTM motion',
  tier: 'own',
  competencyMode: 'leveled',
  summary:
    'The job search run as a full-cycle enterprise pursuit: a written ICP, a tiered account list, buying-committee maps, signal-timed multi-threaded outreach, interviews run as discovery, MEDDPICC-qualified processes, a negotiated close, and a weekly pipeline review. The method is public; the accounts are not.',
  sections: [
    {
      id: 'd10-market',
      title: 'Market Mapping & Tiering',
      summary: 'ICP first, then a tiered account list scored the way a GTM engineer would score a TAM.',
      modules: [
        {
          id: 'd10-mm',
          title: 'Target-employer ICP + tiered account list',
          body:
            '## Treat it like an ABM list\n\nA job search without a written ICP is spray-and-pray with extra steps. Write the criteria down (company stage, what AI is to the business, role shape, segment, location, the disqualifiers) so every account can be scored against them and every drop has a reason.\n\n## What you are building\n\n1. **ICP**: company criteria plus role criteria, each testable from public data, with the explicit disqualifiers.\n2. **Tiered list**: Tier 1 (10–15 accounts you would sign with tomorrow), Tier 2 (25–40 worth a process), each with a fit score and the reasons behind it.\n3. **The pipeline itself**: one CRM deal per live account, with stages, a named next step and a date on every deal. From here on, the CRM is the source of truth; this curriculum only tracks the skill.',
          subtasks: [
            { id: 'd10-mm-icp', title: 'Written target-employer ICP: company + role criteria, each testable from public data, with explicit disqualifiers', kind: 'exercise', complexity: 2, rubric: RUBRIC_PURSUIT },
            { id: 'd10-mm-tiering', title: 'Tiered account list (Tier 1 ≈ 10–15, Tier 2 ≈ 25–40) with a fit score and reason codes per account', kind: 'project', complexity: 3, rubric: RUBRIC_PURSUIT, prompt: 'Score every candidate against the ICP; keep the top-contributing reasons next to each score so a drop or a promotion is explainable.' },
            { id: 'd10-mm-pipeline', title: 'Stand up the pursuit pipeline in the CRM (stages, required next step + date, qualification fields) and load Tier 1', kind: 'project', complexity: 2, rubric: RUBRIC_PURSUIT, prompt: 'Stages: Target → Engaged → Screening → Interviewing → Final → Offer → Closed. No deal without a next step and a date.' },
          ],
        },
      ],
    },
    {
      id: 'd10-positioning',
      title: 'Positioning & Proof',
      summary: 'What I sell, to whom, and the evidence that makes the claim cheap to believe.',
      modules: [
        {
          id: 'd10-pos',
          title: 'Proof inventory mapped to buyer metrics',
          body:
            '## Claims are cheap; artifacts are not\n\nA hiring manager is measured on pipeline, win rate, ramp time and forecast accuracy. Map every proof artifact (shipped systems, published work, closed deals) to the metric it moves for them. The gaps in that map tell you what to build next, which is how this area feeds D1–D9.',
          subtasks: [
            { id: 'd10-pos-proof-map', title: 'Proof inventory: every artifact mapped to the metric it moves for a Tier-1 hiring manager, with the gaps named', kind: 'exercise', complexity: 2, rubric: RUBRIC_PURSUIT },
            { id: 'd10-pos-pitch', title: 'The 90-second pitch and the 2-minute "why me, why now, why you" tailored to one Tier-1 account, recorded and self-reviewed', kind: 'exercise', complexity: 2, rubric: RUBRIC_PURSUIT },
          ],
        },
      ],
    },
    {
      id: 'd10-signals',
      title: 'Signals & Timing',
      summary: 'Reach out when something changed, not when you remembered.',
      modules: [
        {
          id: 'd10-sig',
          title: 'Account signal watchlist',
          body:
            '## Timing beats volume\n\nThe signals that open a hiring window: funding, a new sales leader, open reqs in your segment, a launch into a new market, an event they host. Watch Tier 1 for them weekly and tie each one to a play, the same way a signal-based outbound engine would.',
          subtasks: [
            { id: 'd10-sig-watchlist', title: 'Signal watchlist for Tier 1 (funding, leadership hires, open reqs, launches, hosted events), each signal type tied to a play, reviewed weekly', kind: 'exercise', complexity: 2, rubric: RUBRIC_PURSUIT },
          ],
        },
      ],
    },
    {
      id: 'd10-prospecting',
      title: 'Buying Committee & Warm Paths',
      summary: 'Nobody is hired by an ATS. Map the people who decide.',
      modules: [
        {
          id: 'd10-bc',
          title: 'Hiring-loop maps + warm-path discovery',
          body:
            '## The buying committee\n\n- **Champion**: the hiring manager (sales leader, head of GTM, founding operator).\n- **Economic buyer**: the skip-level (CEO at Series A–B, CRO/COO later).\n- **Influencers**: peers already doing a slice of the role.\n- **Gatekeeper**: the recruiter or talent partner.\n- **Connector**: someone one or two degrees from any of the above.\n\nWarm-path discovery is a repeatable process, not luck: former colleagues, alumni, and the people you meet in rooms. The hard part is asking for the intro.',
          subtasks: [
            { id: 'd10-bc-map', title: 'Buying-committee map for every Tier-1 account (champion, economic buyer, influencer, gatekeeper, connector path) logged in the CRM', kind: 'project', complexity: 3, rubric: RUBRIC_PURSUIT },
            { id: 'd10-bc-warm-paths', title: 'Warm-path sprint: find a connector for ≥ half of Tier 1 and make the intro asks', kind: 'exercise', complexity: 2, rubric: RUBRIC_PURSUIT },
          ],
        },
      ],
    },
    {
      id: 'd10-outreach',
      title: 'Multi-Threaded Outreach',
      summary: 'Value first, three threads per account, every touch logged.',
      modules: [
        {
          id: 'd10-out',
          title: 'Field plays, sequences, and artifact gifts',
          body:
            '## Three channels\n\n1. **In the room**: an event the account hosts or speaks at is a field-marketing touch. Walk in with an account plan (who, why, the one ask) and log follow-ups within 24 hours.\n2. **In their feed**: engage with their public work before you ask for anything.\n3. **In the inbox**: a short note that leads with something built for them. An artifact gift (a teardown, a working prototype on their own product, a POV on their market) beats a resume every time.',
          subtasks: [
            { id: 'd10-out-field-play', title: 'Field play: attend a target-hosted event with a written account plan (who, why, the one ask), then log every follow-up within 24 hours', kind: 'exercise', complexity: 2, rubric: RUBRIC_PURSUIT, prompt: 'Build the plan from the event research brief. After the room, log contacts and next steps in the CRM the same day.' },
            { id: 'd10-out-sequence', title: 'Multi-threaded sequence per Tier-1 account (3 people, 3 touches, value-first), sent and logged', kind: 'project', complexity: 3, rubric: RUBRIC_PURSUIT },
            { id: 'd10-out-artifact-gift', title: 'Artifact gift for one Tier-1 account: something built on or for their product or market, shipped to the hiring manager', kind: 'project', complexity: 4, rubric: RUBRIC_PURSUIT },
          ],
        },
      ],
    },
    {
      id: 'd10-evaluation',
      title: 'Discovery & Qualification',
      summary: 'Interviews are discovery calls in both directions. Qualify them as hard as they qualify you.',
      modules: [
        {
          id: 'd10-ev',
          title: 'Interview as discovery + MEDDPICC per process',
          body:
            '## Qualify the process\n\nFor every live process, fill in MEDDPICC as if it were a deal. *Metrics*: what the role is measured on. *Economic buyer*: who signs the offer. *Decision criteria*: what they are testing for. *Decision process*: the loop and the timeline. *Paper process*: comp approval and levels. *Identify pain*: why the role is open now. *Champion*: who is pushing for you. *Competition*: the other candidates and internal options. The gaps are your next questions.',
          subtasks: [
            { id: 'd10-ev-meddpicc', title: 'MEDDPICC on every live process, updated after each conversation; gaps become the next call\'s questions', kind: 'exercise', complexity: 2, rubric: RUBRIC_PURSUIT },
            { id: 'd10-ev-dossier', title: 'Interview-prep dossier per process (company × role × stage × interviewer), reviewed before every call', kind: 'exercise', complexity: 2, rubric: RUBRIC_PURSUIT },
            { id: 'd10-ev-mock', title: 'Mock loop: a role-play or pitch exercise and a hiring-manager screen, recorded and self-reviewed', kind: 'exercise', complexity: 3, rubric: RUBRIC_PURSUIT },
          ],
        },
      ],
    },
    {
      id: 'd10-close',
      title: 'Offer, Negotiation & Ramp',
      summary: 'Leverage comes from parallel processes and a plan for day one.',
      modules: [
        {
          id: 'd10-cl',
          title: 'Multi-process timing, negotiation, 30/60/90',
          body:
            '## Close like a seller\n\nAim to have finals land within the same two weeks, so offers can be compared rather than accepted in isolation. Write the negotiation plan before the first offer arrives: walk-away number, alternatives, every comp component, and the non-cash asks. A 30/60/90 plan wins finals and makes the first quarter the last interview.',
          subtasks: [
            { id: 'd10-cl-timing', title: 'Multi-process timing plan: sequence Tier-1 processes so finals land within a two-week window', kind: 'exercise', complexity: 2, rubric: RUBRIC_PURSUIT },
            { id: 'd10-cl-negotiation', title: 'Negotiation plan (walk-away, alternatives, comp components, non-cash asks) written before the first offer', kind: 'exercise', complexity: 3, rubric: RUBRIC_PURSUIT },
            { id: 'd10-cl-90day', title: '30/60/90 plan for a finalist role, used in the final round', kind: 'exercise', complexity: 3, rubric: RUBRIC_PURSUIT },
          ],
        },
      ],
    },
    {
      id: 'd10-operating',
      title: 'Operating Rhythm',
      summary: 'The forecast call you run on yourself.',
      modules: [
        {
          id: 'd10-op',
          title: 'Weekly pipeline review',
          body:
            '## Run the forecast call\n\nEvery week: each deal\'s stage, next step, date and risk; coverage against target; and what moved versus the prior week (the baseline). Every process that closes, won or lost, gets a win/loss note (D7) that feeds back into the ICP and the pitch.',
          subtasks: [
            { id: 'd10-op-pipeline-review', title: 'Weekly pipeline review (stage, next step, date, risk, week-over-week movement), running', kind: 'exercise', complexity: 1, rubric: RUBRIC_PURSUIT },
          ],
        },
      ],
    },
    {
      id: 'd10-capstones',
      title: 'Capstone',
      modules: [
        {
          id: 'd10-cap',
          title: 'Closed-won',
          subtasks: [
            { id: 'd10-cap-offer', title: 'Signed offer from a Tier-1 or Tier-2 account, and the pursuit written up as a public case study (method and metrics public, names private)', kind: 'capstone', complexity: 5, isCapstone: true, rubric: RUBRIC_PURSUIT },
          ],
        },
      ],
    },
  ],
}
