---
name: flag
description: Capture friction as methodology notes. Three modes — explicit description, contextual (review recent corrections), session mining (scan transcripts for patterns). Triggers on "/flag", "/flag [description]".
version: "1.0"
generated_from: "arscontexta-v1.6"
user-invocable: true
context: fork
model: sonnet
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
---

## Runtime Configuration (Step 0 — before any processing)

Read these files to configure domain-specific behavior:

1. **`ops/derivation-manifest.md`** — vocabulary mapping, domain context
   - Use `vocabulary.notes` for the records folder name
   - Use `vocabulary.note` for the record type name in output
   - Use `vocabulary.rethink` for reassess command name in threshold alerts
   - Use `vocabulary.topic_map` for design map references

2. **`ops/config.yaml`** — thresholds
   - `self_evolution.observation_threshold` (default: 10) — for threshold alerts
   - `self_evolution.tension_threshold` (default: 5) — for threshold alerts

3. **`ops/methodology/`** — read existing methodology notes before creating new ones (prevents duplicates)

If these files don't exist (pre-init invocation or standalone use), use universal defaults.

## EXECUTE NOW

**Target: $ARGUMENTS**

Parse immediately:
- If target contains a quoted description or unquoted text: **explicit mode** — user describes friction directly
- If target is empty: **contextual mode** — review recent conversation for corrections
- If target contains `--mine-sessions` or `--mine`: **session mining mode** — scan ops/sessions/ for patterns

**START NOW.** Reference below defines the three modes.

---

## Explicit Mode

User provides a description: `/flag "don't process personal notes like research"` or `/flag always check for duplicates before creating`

### Step 1: Parse the Friction

Analyze the user's description to extract:
- **What the agent did wrong** (or what the user wants to prevent)
- **What the user wants instead** (the correct behavior)
- **The scope** — when does this apply? Always? Only for specific content types? Only in certain phases?
- **The category** — which area of agent behavior does this affect?

| Category | Applies When |
|----------|-------------|
| processing | How to extract, document, or handle content |
| capture | How to record, file, or organize incoming material |
| connection | How to find, evaluate, or add links between records |
| maintenance | How to handle health checks, updating, cleanup |
| voice | How to write, what tone or style to use |
| behavior | General agent conduct, interaction patterns |
| quality | Standards for records, rationales, titles |

### Step 2: Check for Existing Methodology Notes

Before creating a new note, read all files in `ops/methodology/`:

```bash
ls -1 ops/methodology/*.md 2>/dev/null
```

For each existing note, check if it covers the same behavioral area.

| Check Result | Action |
|-------------|--------|
| No existing notes in this area | Create new methodology note |
| Existing note covers different aspect of same area | Create new note, link to existing |
| Existing note covers same friction | Extend existing note with new evidence |
| Existing note contradicts new friction | Create new note AND observation about contradiction |

### Step 3: Create Methodology Note

Write to `ops/methodology/`:

**Rule Zero:** This methodology note becomes part of the system's canonical specification. ops/methodology/ is not a log of what happened — it is the authoritative declaration of how the system should behave.

**Filename:** Convert the prose title to kebab-case.

```markdown
---
description: [what this methodology note teaches — specific enough to be actionable]
type: methodology
category: [processing | capture | connection | maintenance | voice | behavior | quality]
source: explicit
created: YYYY-MM-DD
status: active
---

# [prose-as-title describing the learned behavior]

## What to Do
[Clear, specific guidance.]

## What to Avoid
[The specific anti-pattern this note prevents.]

## Why This Matters
[What goes wrong without this guidance.]

## Scope
[When does this apply? Be explicit about boundaries.]

---

Related: [[methodology]]
```

### Step 4: Update Methodology MOC

Edit `ops/methodology/methodology.md`: add the note with a context phrase.

### Step 5: Check Pattern Threshold

If 3+ notes exist in the same category, suggest running /reassess.

### Step 6: Output

```
--=={ flag }==--

  Captured: [brief description of the learning]
  Filed to: ops/methodology/[filename].md
  Updated: ops/methodology/methodology.md MOC
  Category: [category]
```

---

## Contextual Mode

No argument provided: `/flag`

Review the current conversation for correction signals (direct corrections, redirections, preference statements, frustration signals, quality corrections).

Present detected corrections to user for confirmation before creating methodology notes.

---

## Session Mining Mode

Flag provided: `/flag --mine-sessions` or `/flag --mine`

Scan stored session transcripts for friction patterns. Classify findings as methodology notes or observations. Deduplicate against existing notes. Mark sessions as mined after processing.

---

## The Methodology Learning Loop

```
Work happens
  → user corrects agent behavior
  → /flag captures correction as methodology note
  → methodology note filed to ops/methodology/
  → agent reads methodology notes at session start
  → agent behavior improves
  → when methodology notes accumulate (3+ in same category)
  → /reassess triages and detects patterns
  → patterns elevated to context file changes
  → system methodology evolves
```

### Rule Zero: Methodology as Canonical Specification

The methodology folder is the system's authoritative self-model. Every methodology note you create becomes part of the spec. Write directives, not incident reports.

---

## Edge Cases

- **No ops/methodology/ Directory:** Create it and the MOC
- **Duplicate Friction:** Extend existing note with new evidence
- **Contradicting Existing Methodology:** Create observation, supersede old note, create new note
- **Empty Conversation Context:** Report and suggest explicit mode
