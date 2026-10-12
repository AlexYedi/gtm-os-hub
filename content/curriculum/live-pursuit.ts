import type { Area, Resource, RubricLevel } from './types'

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

// Public hiring-side sources for the interview-readiness modules (v4, GTM-27).
// URLs verified 2026-10-11.
const RES: Record<string, Resource> = {
  hireGuide: { title: 'How to hire a GTM Engineer (hiring guide with interview questions + three public take-homes) — The GTM Engineer', url: 'https://thegtme.com/p/how-to-hire-a-gtm-engineer', kind: 'article' },
  breakIn: { title: 'The best GTM Engineering resources (and how to break in) — GTM Engineering Newsletter', url: 'https://newsletter.gtmengineering.ai/p/how-to-break-into-gtm-engineering', kind: 'article' },
  prep: { title: 'GTM engineer interview prep — GTM Engineer Search', url: 'https://www.gtmengineersearch.com/gtm-engineer-interview-prep/', kind: 'article' },
  behavioral: { title: 'Behavioral interview questions — GTM Engineer Search', url: 'https://www.gtmengineersearch.com/gtm-engineer-behavioral-interview-questions/', kind: 'article' },
  technical: { title: 'Technical interview questions — GTM Engineer Search', url: 'https://www.gtmengineersearch.com/gtm-engineer-technical-interview-questions/', kind: 'article' },
  caseStudy: { title: 'Case-study interview briefs — GTM Engineer Search', url: 'https://www.gtmengineersearch.com/gtm-engineer-case-study-interview/', kind: 'article' },
  portfolioReview: { title: 'Portfolio-review interview questions — GTM Engineer Search', url: 'https://www.gtmengineersearch.com/gtm-engineer-portfolio-review-interview/', kind: 'article' },
  portfolio: { title: 'The GTM engineer portfolio — GTM Engineer Search', url: 'https://www.gtmengineersearch.com/gtm-engineer-portfolio/', kind: 'article' },
  reverse: { title: 'Questions to ask the employer — GTM Engineer Search', url: 'https://www.gtmengineersearch.com/gtm-engineer-questions-to-ask-employer/', kind: 'article' },
  // Commercial-loop sources (GTM-28). URLs verified 2026-10-12.
  salesHiring: { title: 'Through the looking glass: hiring sales people — a16z', url: 'https://a16z.com/through-the-looking-glass-hiring-sales-people/', kind: 'article' },
  aeQuestions: { title: 'Interview questions a CEO can ask an Account Executive — SaaStr', url: 'https://www.saastr.com/dear-saastr-what-are-some-interview-questions-a-ceo-can-ask-an-account-executive', kind: 'article' },
  csmQuestions: { title: 'Top questions for a Customer Success Manager interview — SaaStr', url: 'https://www.saastr.com/what-would-be-your-top-3-questions-for-a-customer-success-manager-interview-1m-arr-enterprise-saas', kind: 'article' },
  csmGuide: { title: 'Guide to interviewing Customer Success Managers — Dover', url: 'https://help.dover.com/en/articles/8184662-guide-to-interviewing-customer-success-managers', kind: 'article' },
  amQuestions: { title: 'Sales Account Manager interview questions (with red flags) — FirstHR', url: 'https://firsthr.app/templates/hiring/sales-account-manager-interview-questions', kind: 'article' },
  csProcess: { title: '5 steps to an effective customer success interview process — ClientSuccess', url: 'https://www.clientsuccess.com/resources/5-steps-to-an-effective-customer-success-interview-process', kind: 'article' },
  aiFluency: { title: 'Raising the AI-fluency bar in hiring — Zapier', url: 'https://zapier.com/blog/raising-ai-fluency-bar-in-hiring/', kind: 'article' },
  aeBenchmark: { title: '2026 AE Models, Motions & Metrics — The Bridge Group', url: 'https://www.bridgegroupinc.com/research/2026-ae-models-motions-metrics', kind: 'article' },
}

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
        {
          id: 'd10-pf',
          title: 'Proof that leads with the number',
          summary: 'Write every system up so the business outcome comes first and the architecture comes last.',
          body:
            '## The most common rejection is a strong build told backwards\n\nHiring loops reject candidates whose work is technically excellent but narrated as architecture. The pattern behind the red flags (over-engineering, tunnel vision, "no commercial awareness", "talks about delivery but not adoption") is the same: the business decision the system served never made it into the story.\n\n## The unit of evidence is a system, not a skill\n\nFor each system: **situation** you walked into → **what you built** → **alternatives** you considered → **constraints** → **what happened afterwards, including where it fell short.** Open with the number: what it was before, what it was after, and how much of that delta you would defend as yours. Describe what you *decided*, not only what you built.\n\n## Progressive disclosure, strongest format first\n\n1. Something they can click.\n2. The diagram.\n3. The two-minute walkthrough (recorded).\n4. The written appendix.\n\nLength is itself the judgment test. And close the ownership gap: a system nobody else can run is a liability, so every write-up names who runs it now and what was left behind for them.',
          resources: [RES.portfolio, RES.portfolioReview],
          subtasks: [
            { id: 'd10-pf-writeups', title: 'Three shipped systems written up in proof format (situation → build → alternatives → constraints → outcome and shortfall), each opening with the before/after number', kind: 'project', complexity: 3, rubric: RUBRIC_PURSUIT, prompt: 'Lead with the business number and the adoption story; architecture goes in the appendix. Name what you deliberately did not automate and who wanted it.' },
            { id: 'd10-pf-runbook', title: 'One-page handoff runbook for one shipped system: owner, inputs, failure modes, how you find out it broke, who gets told, cost at 3× volume', kind: 'exercise', complexity: 2, rubric: RUBRIC_PURSUIT, prompt: 'Write it for the ops person who inherits the system, not for an engineer. If you cannot name an owner, that is the finding.' },
            { id: 'd10-pf-demo', title: 'Recorded 2–5 minute demo of one system (problem, the click-through, the number), linked from the Hub', kind: 'exercise', complexity: 2, rubric: RUBRIC_PURSUIT, prompt: 'One take after two practice runs. Tool names only after the business problem is on screen.' },
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
      id: 'd10-rounds',
      title: 'Interview Rounds & Take-Homes',
      summary: 'Each round scores something specific. Drill each one against that, and practice the public take-homes under the clock.',
      modules: [
        {
          id: 'd10-rd',
          title: 'Round-by-round question bank',
          summary: 'What each round type tests, the questions it uses, and the answer shape that scores.',
          body:
            '## What every round is scoring\n\nPublished hiring guides, interview banks and first-hand loop reports converge on seven dimensions:\n\n1. **Commercial bias**: every system tied to a revenue decision and a before/after number.\n2. **Diagnose before build**: reduce the problem, name the owner and the missing data, and refuse to automate a motion that has not earned the right to scale.\n3. **Failure paths**: inputs → sources → rules → *what fails* → what gets written back. These interviews poke the failure path harder than the happy path.\n4. **Adoption and handoff**: who runs it now, and what reps do differently.\n5. **Experimentation**: hypothesis, metric, test; what told you it worked in week one versus month three.\n6. **AI fluency, honestly scoped**: which parts a model wrote and what you changed afterwards.\n7. **Communication across levels**: the same system explained to an executive and to a frustrated rep, without naming a tool first.\n\n## The rounds\n\n- **Behavioral** (usually no AI). The hour goes into the second and third follow-ups, where they ask for the volumes. Core prompts: a bug you caught in a GTM system; the system you are proudest of and what was different for the business; a system built exactly as asked where the number did not move; what you argued against building; what happened after you handed it off.\n- **Technical scenario.** Talking through it, not live coding: a broken lead-routing flow with duplicates and angry reps; webhook versus polling; rate limits across enrichment sources; where a shared business rule should live; low-code chain versus fifty lines of code (and who maintains it).\n- **Case.** "Our reply rates dropped 30%, diagnose it." "Double pipeline in six months without adding headcount." "Here is a funnel with five noisy metrics; what do you inspect before building anything?" Strong answers name external levers (new data) *and* internal ones (routing delays).\n- **Portfolio defense.** Where does this system stop? Which join gives you the most trouble? What would go backwards if you switched it off tomorrow? What breaks first at ten times the volume? Who reviewed it before it went live?\n- **Commercial rounds** (the target roles). Mock discovery call, deal walkthrough, book-of-business review, QBR, renewal-risk save, product-built work sample. Each has its own drill in *Commercial loop rounds* below.\n- **Reverse questions.** Who owns the system after it ships? What is the role measured on? Does this function exist yet, or would I be defining it?\n\n## The answer shape\n\nSituation in one sentence → the number before → what you decided (and what you refused to build) → what happened, with the number after → what you would do differently. Under two minutes, then let them pull on a thread.',
          resources: [RES.hireGuide, RES.prep, RES.behavioral, RES.technical, RES.reverse],
          subtasks: [
            { id: 'd10-rd-story-bank', title: 'Story bank: 8–10 stories keyed to the seven scoring dimensions, each with the before/after number, the share of the delta that is yours, and what you chose not to automate', kind: 'exercise', complexity: 3, rubric: RUBRIC_PURSUIT, prompt: 'Keep the stories themselves in the private prep workspace; this subtask tracks the skill. Every story must survive "what was the number, and how much of that is yours?"' },
            { id: 'd10-rd-behavioral', title: 'Behavioral round drill: answer the five core prompts out loud, recorded, then take the second and third follow-ups (the volumes)', kind: 'exercise', complexity: 2, rubric: RUBRIC_PURSUIT },
            { id: 'd10-rd-failure-path', title: 'Failure-path one-pagers for three systems (inputs, sources, rules, what fails, what gets written back), each explained in three minutes without naming a tool', kind: 'exercise', complexity: 2, rubric: RUBRIC_PURSUIT },
            { id: 'd10-rd-frustrated-rep', title: 'Ten-minute discovery role-play with a frustrated rep: diagnose the workflow without jumping to tools, propose the smallest change, and say how you would know it was adopted', kind: 'exercise', complexity: 2, rubric: RUBRIC_PURSUIT, prompt: 'Have a model play the rep and score the transcript against the seven dimensions.' },
            { id: 'd10-rd-case', title: 'Case round drill: two classic cases (a reply-rate drop, doubling pipeline without headcount) answered live in 20 minutes each, naming external and internal levers', kind: 'exercise', complexity: 3, rubric: RUBRIC_PURSUIT },
            { id: 'd10-rd-portfolio-defense', title: 'Portfolio defense: take one shipped system through the twenty portfolio-review probes, and fix the write-up wherever an answer was weak', kind: 'exercise', complexity: 3, rubric: RUBRIC_PURSUIT },
            { id: 'd10-rd-commercial', title: 'Full commercial mock loop in one sitting: screen, deal walkthrough, discovery or renewal role-play, and work-sample readout, recorded and scored against the commercial dimensions', kind: 'exercise', complexity: 3, rubric: RUBRIC_PURSUIT, prompt: 'Run it after the individual drills in Commercial loop rounds. Use the systems work as the proof inside the answer, not as the answer.' },
            { id: 'd10-rd-reverse', title: 'Reverse-question set by round and interviewer type (recruiter, hiring manager, peer, executive), used in every live loop', kind: 'exercise', complexity: 1, rubric: RUBRIC_PURSUIT },
          ],
        },
        {
          id: 'd10-cr',
          title: 'Commercial loop rounds',
          summary: 'The rounds that decide AE, Account Manager and CSM offers, what each one scores, and the answer shape that wins it.',
          body:
            '## The skeleton is the same everywhere\n\nRecruiter screen → hiring-manager deep dive ("walk me through a deal") → **one work-sample round** → panel → executive or founder final. The work sample decides the outcome. Mature SaaS runs a mock discovery call, demo or QBR. AI-native companies increasingly build the work sample on their own product (a customer plan, kickoff or account study built in the product, with a short recorded video) or add an explicit AI-fluency exercise. Some replace the loop\'s end with a paid multi-day work trial. Ask the recruiter which format it is; never assume.\n\n## What every commercial round is scoring\n\n1. **Owning the number.** Quota, attainment and rank stated without hedging, with honest attribution: how much of the growth was you versus the account growing on its own.\n2. **Discovery over pitching.** Persona-specific questions, pain quantified in the buyer\'s numbers, the economic buyer and the champion found, a dated next step.\n3. **Deal mechanics.** Any deal walked through stage by stage, with the qualification gaps and what you did about them.\n4. **Nerve on price and renewals.** Hold value before reaching for a discount; multi-thread before the risk shows up.\n5. **Owning a loss.** The deal or customer you lost, what you missed, and what changed in how you work. No blaming product or marketing.\n6. **Coachability.** After a role-play the interviewer asks "how do you think you did?", gives one fix, and runs it again. They are scoring the second attempt and how you take the note.\n7. **AI fluency as leverage.** How you use AI in your own selling, scoped honestly, with each build tied to pipeline, retention or time back.\n\n## Red flags hiring guides name verbatim\n\nEvery number is the team\'s, never theirs. Cannot state a quota figure. Discounts as the way to keep clients happy. Pitching before discovery. Generic questions. No close. Vague deal stories.\n\n## The builder question\n\nAt AI-native companies a seller who builds their own systems reads as a plus, and some customer-facing job descriptions ask for it outright. The risk is framing, not the work: builds told as tooling read as someone headed for an engineering seat; builds told as "how I sell more" read as leverage. Lead with the number and the book, use the systems as proof inside the answer, and have a crisp sixty-second answer to "why a commercial seat, not engineering?"\n\n## Know the rules of the room\n\nSome companies bar AI use in take-homes and live rounds unless they say otherwise. Ask before the round, and say what you used.',
          resources: [RES.salesHiring, RES.aeQuestions, RES.csmQuestions, RES.csmGuide, RES.amQuestions, RES.csProcess, RES.aiFluency],
          subtasks: [
            { id: 'd10-cr-number', title: 'The number, stated in sixty seconds: quota, attainment, rank, and how much of the growth was yours versus organic, checked against your own records', kind: 'exercise', complexity: 1, rubric: RUBRIC_PURSUIT, prompt: 'If you carried no formal quota, state the commercial number you did own and say so plainly. Hedging here fails the round before it starts.' },
            { id: 'd10-cr-deal-walkthrough', title: 'Deal walkthrough: three deals (won, lost, stalled) told stage by stage with the qualification gaps and what you did about each, under three minutes apiece', kind: 'exercise', complexity: 2, rubric: RUBRIC_PURSUIT, prompt: 'Use MEDDPICC as the spine. The lost deal must end with what you missed and what changed afterwards, with no blame on product or marketing.' },
            { id: 'd10-cr-discovery', title: 'Mock discovery call (30 minutes): a model plays a buyer with a hidden pain; quantify it in their numbers, find the economic buyer and champion, close on a dated next step; then take one fix and run it again', kind: 'exercise', complexity: 3, rubric: RUBRIC_PURSUIT, prompt: 'Score both attempts. The second attempt and how you received the note are the coachability signal.' },
            { id: 'd10-cr-demo', title: 'Pain-first demo or pitch (15 minutes) for one persona: open on their problem, show only what solves it, handle two objections, ask for the next step', kind: 'exercise', complexity: 3, rubric: RUBRIC_PURSUIT },
            { id: 'd10-cr-renewal-save', title: 'Renewal-risk role-play: the customer opens with "the budget is not there this year"; hold value, multi-thread, and reach a decision without a reflex discount', kind: 'exercise', complexity: 3, rubric: RUBRIC_PURSUIT, prompt: 'Write down the floor you would accept before the role-play. A discount offered before value is re-established counts as a fail.' },
            { id: 'd10-cr-qbr', title: 'Mock QBR / EBR for an executive sponsor: value delivered in their numbers, risks named, the expansion case, and the ask, in under 20 minutes', kind: 'project', complexity: 3, rubric: RUBRIC_PURSUIT },
            { id: 'd10-cr-book-review', title: 'Book-of-business review: retention and expansion for a book you ran, what you started versus what grew on its own, and your top three losses with the lesson from each', kind: 'exercise', complexity: 2, rubric: RUBRIC_PURSUIT },
            { id: 'd10-cr-work-sample', title: 'Product-built work sample (timed): a customer success plan or kickoff for a hypothetical customer, built in the employer\'s own product where possible, with a recorded walkthrough of at most seven minutes', kind: 'project', complexity: 4, rubric: RUBRIC_PURSUIT, prompt: 'Practise the format, not a company. Timebox it, and check the AI-use rules before you start.' },
            { id: 'd10-cr-ai-fluency', title: 'AI-fluency exercise: how you design and use AI in your own selling, with three examples, each tied to pipeline, retention or hours back, and what the model got wrong', kind: 'exercise', complexity: 2, rubric: RUBRIC_PURSUIT },
            { id: 'd10-cr-why-commercial', title: '"Why a commercial seat, not engineering?" answered in sixty seconds, recorded, and used in every recruiter screen', kind: 'exercise', complexity: 1, rubric: RUBRIC_PURSUIT, prompt: 'The systems are how you sell more and keep more, not where you are headed next. Say what you want to be measured on.' },
          ],
        },
        {
          id: 'd10-th',
          title: 'Take-home drills',
          summary: 'The public take-homes, timed, with the deliverable format they are graded on.',
          body:
            '## The take-home playbook\n\n1. **Diagnose above the brief first.** Check the ICP and targeting before optimizing the leak you were pointed at. The best-documented rejection in the public record was a strong technical build that stayed inside the brief while the real problem (wrong targeting) sat above it.\n2. **Ship a usable v1 fast.** "Proactive and faster" beats depth.\n3. **Reserve the last fifth of the time** for a write-up of what you deliberately left out and where the thing breaks.\n4. **Deliver it in the graded format:** a one-page executive summary, 3–5 recommendations, and 1–2 experiments.\n5. **Name both kinds of lever:** external (new data sources) and internal (routing delays, handoffs). Graders say this is what separates strong submissions.\n6. **Record the walkthrough.** Practise it, because candidates report the video takes the longest.\n\n## The drills\n\nThree archetypes are public: an inbound-funnel analysis (~60k leads, speed-to-lead and segment conversion), an outbound reply-rate analysis (~60k sends, segment and timing), and a 60-minute outbound campaign build from messy lists (dedupe, DQ history, signal-to-message). Two portfolio-grade case briefs double as proof: an inbound ICP agent with its eval set, and a public-signal detector scored for precision against a labelled sample.',
          resources: [RES.hireGuide, RES.caseStudy, RES.breakIn],
          subtasks: [
            { id: 'd10-th-inbound-funnel', title: 'Timed drill: inbound-funnel analysis (speed-to-lead, segment conversion, routing) → one-page executive summary, 3–5 recommendations, 1–2 experiments, walkthrough ≤ 5 minutes', kind: 'project', complexity: 3, rubric: RUBRIC_PURSUIT, prompt: 'Use the public brief. If no dataset is available, generate a synthetic one with the same fields and say so in the write-up.' },
            { id: 'd10-th-outbound-reply', title: 'Timed drill: outbound reply-rate analysis (segment, timing, sequence drop-off) in the same graded format', kind: 'project', complexity: 3, rubric: RUBRIC_PURSUIT },
            { id: 'd10-th-campaign-60', title: '60-minute campaign build from messy lists: dedupe, reconcile disqualification history, map signals to messages, choose breadth versus depth', kind: 'exercise', complexity: 3, rubric: RUBRIC_PURSUIT, prompt: 'Hard stop at 60 minutes. Spend the first 10 on targeting: potential = list size × readiness to convert × value per conversion.' },
            { id: 'd10-th-icp-agent-eval', title: 'Case brief: an agent that decides whether an inbound form fill fits the ICP, with a reason a rep can check, plus the eval set that measures it', kind: 'project', complexity: 4, rubric: RUBRIC_PURSUIT, prompt: 'Build it on existing pipeline data. It doubles as a proof write-up (d10-pf-writeups).' },
            { id: 'd10-th-signal-precision', title: 'Case brief: detect three public signals across an account list and report the precision of each against a labelled sample', kind: 'project', complexity: 4, rubric: RUBRIC_PURSUIT, prompt: 'Reuse the signal pipeline; the new work is the labelled sample and the precision report.' },
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
            '## Close like a seller\n\nAim to have finals land within the same two weeks, so offers can be compared rather than accepted in isolation. Write the negotiation plan before the first offer arrives: walk-away number, alternatives, every comp component, and the non-cash asks. A 30/60/90 plan wins finals and makes the first quarter the last interview.\n\n## Commercial comp is a plan, not a salary\n\nFor quota-carrying roles the offer is a comp plan: OTE, the pay mix (new-business sellers often near 50/50, account managers nearer 60/40, CSMs 70/30 to 80/20), the quota as a multiple of OTE, the ramp, and when accelerators start. Benchmark surveys put the median ramp around six months and fewer than half of reps at quota, so ramp terms and the book you inherit are worth as much as the headline number.',
          resources: [RES.aeBenchmark],
          subtasks: [
            { id: 'd10-cl-timing', title: 'Multi-process timing plan: sequence Tier-1 processes so finals land within a two-week window', kind: 'exercise', complexity: 2, rubric: RUBRIC_PURSUIT },
            { id: 'd10-cl-negotiation', title: 'Negotiation plan (walk-away, alternatives, comp components, non-cash asks) written before the first offer', kind: 'exercise', complexity: 3, rubric: RUBRIC_PURSUIT, prompt: 'Anchor on public pay-transparency ranges for the exact title and location, and confirm whether each range is base or OTE. Commercial levers beyond the number: pay mix, ramp length, a guaranteed or non-recoverable draw, reduced quota during ramp, when accelerators start, and the quality of the book or territory you inherit.' },
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
