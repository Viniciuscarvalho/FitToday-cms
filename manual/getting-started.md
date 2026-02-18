---
description: First session guide -- creating your first record, building connections, and navigating the vault
type: manual
generated_from: "arscontexta-1.0.0"
---

# Getting Started

This page walks you through your first session with the FitToday knowledge vault. By the end, you will have captured raw material, processed it into a structured record, connected it to the knowledge graph, and verified its quality.

## Before You Begin

The vault is already fully configured. All skills, templates, quality gates, and maintenance mechanisms are active. You do not need to set anything up.

Read the following files to orient yourself:

- `self/identity.md` -- who the agent is and how it approaches FitToday
- `self/goals.md` -- what threads are currently active
- `ops/reminders.md` -- any time-bound commitments

## Session Rhythm

Every session follows the same three-phase structure:

1. **Status Check** -- Read identity, goals, and reminders. Check for overdue maintenance.
2. **Work** -- Do the actual task. Surface connections as you go.
3. **Save State** -- Write new insights, update design maps, update goals.

## Step 1: Capture to Inbox

Everything enters through `inbox/`. Do not think about structure at capture time. Speed of capture beats precision of filing.

### Example: Capturing a Stripe Webhook Decision

Create a file in `inbox/` with raw content:

```markdown
Decided to use Stripe webhook events instead of polling for payment status.
The /api/webhooks/stripe endpoint receives invoice.paid and
invoice.payment_failed events. This lets the CMS update trainer
subscription status in real time without cron jobs.
```

Save it as `inbox/stripe-webhook-decision.md`. No frontmatter needed at this stage. The inbox is a scratchpad.

### What Goes to Inbox

- Architecture decisions made during development
- API endpoint design rationale
- Integration choices (why Stripe Connect, why Firebase Auth)
- Data model reasoning (why workouts are nested under trainers)
- Links to external documentation
- Anything where the destination is unclear

## Step 2: Document with /document

The `/document` skill transforms raw inbox content into a structured record. It reads the source material through the FitToday lens and asks: "Does this serve the project's architecture knowledge?"

Run `/document` on your inbox item. The skill will:

1. Read the raw content
2. Extract the core decision or specification
3. Create a properly titled record with YAML frontmatter
4. Place it in `records/`

### What a Processed Record Looks Like

```markdown
---
description: Webhook-driven updates eliminate polling; the CMS reacts to invoice.paid and invoice.payment_failed in real time
type: architecture
status: active
created: 2026-02-18
---

# stripe webhooks were chosen over polling to update trainer subscription status in real time

The FitToday CMS receives Stripe webhook events at /api/webhooks/stripe
rather than polling the Stripe API on a schedule. This decision was driven
by the need for immediate subscription status updates when trainers'
payments succeed or fail.

## Alternatives Considered

- **Polling on a cron schedule**: Simpler to implement but introduces latency
  between payment events and CMS state updates. A trainer whose payment
  failed would still see an active subscription until the next poll cycle.
- **Client-side status checks**: Would require the web CMS to query Stripe
  on every dashboard load, adding latency and API rate limit pressure.

## Implementation

The webhook endpoint handles two primary events:
- `invoice.paid` -- marks the trainer's subscription as active
- `invoice.payment_failed` -- flags the subscription for follow-up

---

Relevant Records:
- [[payments]] -- this decision shapes the core payment flow

Areas:
- [[api-architecture]]
- [[payments]]
```

### Key Rules for Records

- **Title as proposition**: The title must work as prose in a sentence. "Since [[stripe webhooks were chosen over polling to update trainer subscription status in real time]], the billing system never has stale state."
- **Rationale adds information**: The `description` field must say something the title does not.
- **One decision per file**: Each record captures exactly one decision, endpoint spec, or integration doc.

## Step 3: Connect with /connect

After `/document` creates records, `/connect` integrates them into the knowledge graph.

Run `/connect` on your new record. The skill will:

1. Find **forward connections** -- what existing records relate to this one?
2. Find **backward connections** -- what older records need updating now that this exists?
3. Update **design maps** -- every record belongs in at least one design map.

### Example Connections

Your Stripe webhook record might connect to:

- The payments design map (it is a core payment architecture decision)
- An existing record about Stripe Connect account setup (the webhook receives events from connected accounts)
- The api-architecture design map (it defines an API endpoint)

### Connection Semantics

When linking records, always explain the relationship:

```markdown
- [[stripe connect was chosen for multi-trainer payouts]] -- enables this; webhooks receive events from connected accounts
```

Never write bare links without context:
```markdown
- [[stripe connect was chosen for multi-trainer payouts]]  # BAD: no relationship context
```

## Step 4: Review with /review

The `/review` skill runs three checks:

1. **Rationale quality (cold-read test)**: Read only the title and rationale. Without reading the body, can you predict what the record contains?
2. **Schema compliance**: All required fields present, enum values valid, design map links exist.
3. **Health check**: No broken wiki links, no orphaned records, link density within healthy range.

Run `/review` on your new record to verify it meets quality standards before moving on.

## Step 5: Verify Your Work

After completing the review cycle, check that your record is properly integrated:

```bash
# Verify the record exists
ls records/stripe-webhooks-were-chosen*.md

# Check it appears in a design map
rg 'stripe webhooks' records/api-architecture.md records/payments.md

# Find any dangling links
./ops/scripts/dangling-links.sh
```

## What to Do Next

- Read [[skills]] for the complete command reference
- Read [[workflows]] to understand the full review cycle and maintenance rhythm
- Explore existing design maps in `records/` to see how the vault is organized:
  - `records/api-architecture.md` -- API endpoints, auth, data flow
  - `records/payments.md` -- Stripe Connect, trainer billing
  - `records/platform-integration.md` -- iOS/Android communication
  - `records/multi-tenancy.md` -- trainer isolation, student management
  - `records/data-models.md` -- workout structures, user schemas

## Common First-Session Mistakes

| Mistake | Fix |
|---------|-----|
| Writing directly to `records/` | Route through `inbox/` first, then `/document` |
| Topic-label titles ("Stripe integration") | Use propositions ("stripe connect was chosen because...") |
| Rationale restates the title | Add scope, mechanism, or implication beyond the title |
| Bare wiki links without context | Always add a relationship phrase after the link |
| Forgetting to update `self/goals.md` at session end | Make it the last thing you do every session |
