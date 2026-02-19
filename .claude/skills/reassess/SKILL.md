---
name: reassess
description: Challenge system assumptions against accumulated evidence. Triages observations and tensions, detects patterns, generates proposals. The scientific method applied to knowledge systems. Triggers on "/reassess", "review observations", "challenge assumptions", "what have I learned".
version: "1.0"
generated_from: "arscontexta-v1.6"
user-invocable: true
context: fork
allowed-tools: Read, Write, Edit, Grep, Glob, Bash, AskUserQuestion
---

## Runtime Configuration (Step 0 — before any processing)

Read these files to configure domain-specific behavior:

1. **`ops/derivation-manifest.md`** — vocabulary mapping, domain context
   - Use `vocabulary.notes` for the records folder name
   - Use `vocabulary.note` for the record type name in output
   - Use `vocabulary.rethink` for the command name in output
   - Use `vocabulary.topic_map` for design map references
   - Use `vocabulary.cmd_reflect` for connection-finding references

2. **`ops/config.yaml`** — thresholds, processing preferences
   - `self_evolution.observation_threshold`: number of pending observations before suggesting reassess (default: 10)
   - `self_evolution.tension_threshold`: number of pending tensions before suggesting reassess (default: 5)

3. **`ops/methodology/`** — existing methodology notes (read all to understand current system self-knowledge)

If these files don't exist, use universal defaults.

## EXECUTE NOW

**Target: $ARGUMENTS**

Parse immediately:
- If target is empty: run full six-phase reassess on all pending observations and tensions
- If target is "triage": run Phase 1 only (triage and methodology updates)
- If target is "patterns": skip triage, run Phases 3-5 only
- If target is "drift": run Phase 0 only (drift check)
- If target is a specific filename: triage that single item interactively

**START NOW.** Reference below defines the six-phase workflow.

---

## Philosophy

**The system is not sacred. Evidence beats intuition.**

Every rule was a hypothesis. Observation notes in `ops/observations/` capture friction. Tension notes in `ops/tensions/` capture conflicts. Reassess triages these individually, then compares remaining evidence against system assumptions and proposes changes when patterns emerge.

---

## Phase 0: Drift Check

Rule Zero: ops/methodology/ is the canonical specification. Before triaging, check whether the system has drifted from what methodology says.

Load methodology notes, system configuration (config.yaml, CLAUDE.md, derivation-manifest.md), and compare across three drift types:

- **Staleness** — config changed since methodology was last updated
- **Coverage Gap** — features without methodology coverage
- **Assertion Mismatch** — methodology notes that contradict system config

Create drift observations in `ops/observations/` for each finding. Proceed to Phase 1.

---

## Phase 1: Triage

Gather pending evidence from ops/observations/ and ops/tensions/. Read each fully.

### Classify Each Item

| Disposition | Action |
|-------------|--------|
| PROMOTE | Create record in records/, set `status: promoted` |
| IMPLEMENT | Update specific file, set `status: implemented` |
| METHODOLOGY | Create/update ops/methodology/ note |
| ARCHIVE | Set `status: archived` |
| KEEP PENDING | No change |

Present triage table to user. **Wait for approval** via AskUserQuestion before executing.

After approval, execute all dispositions. Update MOCs to reflect status changes.

---

## Phase 2: Methodology Folder Updates

For METHODOLOGY items, create or update notes in `ops/methodology/`. Check for duplicates first. Extend existing notes when overlap > 80%.

Methodology notes include: description, type, category, source, evidence fields, and sections for What to Do, What to Avoid, Why This Matters, Scope.

---

## Phase 3: Pattern Detection

Analyze remaining pending evidence for systemic patterns:

| Pattern Type | Threshold |
|-------------|-----------|
| Recurring themes | 3+ observations same area |
| Contradiction clusters | Multiple tensions same assumption |
| Friction accumulation | Multiple observations same workflow |
| Drift signals | Vocabulary/structure mismatch |
| Methodology convergence | 3+ /flag captures same category |

**Do not fabricate patterns from insufficient evidence.**

---

## Phase 4: Proposal Generation

For each detected pattern, generate one specific, actionable proposal with:
1. Specific file references
2. Evidence backing (at least 2 items)
3. Risk awareness
4. Proportionality
5. Reversibility assessment

**NEVER auto-implement proposals.**

---

## Phase 5: Present for Approval

Present summary. Use AskUserQuestion: "Which proposals should I implement? (all / none / list numbers)"

For approved proposals: draft changes, show before/after, apply, log to ops/changelog.md, update feeding evidence.

---

## Post-Reassess Actions

- If records were promoted, suggest running /connect
- Log session to `ops/rethink-log.md`
- Report queue additions

---

## Edge Cases

- **Nothing Pending:** Report clean state and exit
- **< 5 Total Items:** Triage normally, note pattern detection needs more data
- **Evidence Suggests /reseed:** Recommend /architect review
- **Large Backlog (20+ items):** Triage in batches of 10
- **Conflicting Proposals:** Present both, ask user to choose

## Critical Constraints

**Never:** Auto-implement changes. Dismiss evidence. Re-propose rejected changes.
**Always:** Trace proposals to evidence. Log changes. Respect human decisions.
