---
name: review
description: Combined verification — recite (rationale quality via cold-read prediction) + audit (schema compliance) + health checks. Use as a quality gate after creating records or as periodic maintenance. Triggers on "/review", "/review [record]", "review record quality", "check record health".
user-invocable: true
allowed-tools: Read, Write, Edit, Grep, Glob, mcp__qmd__vector_search
context: fork
---

## Runtime Configuration (Step 0 — before any processing)

Read these files to configure domain-specific behavior:

1. **`ops/derivation-manifest.md`** — vocabulary mapping, platform hints
   - Use `vocabulary.notes` for the records folder name
   - Use `vocabulary.note` / `vocabulary.note_plural` for record type references
   - Use `vocabulary.verify` for the process verb in output
   - Use `vocabulary.topic_map` for design map references
   - Use `vocabulary.templates` for the templates folder path
   - Use `vocabulary.cmd_reflect` for redirect when missing connections found

2. **`ops/config.yaml`** — processing depth, verification settings
   - `processing.depth`: deep | standard | quick
   - `processing.verification.description_test`: true | false
   - `processing.verification.schema_check`: true | false
   - `processing.verification.link_check`: true | false

If these files don't exist, use universal defaults.

**Processing depth adaptation:**

| Depth | Verification Behavior |
|-------|-----------------------|
| deep | Full verification: cold-read prediction, complete schema check, exhaustive link verification, design map coverage, orphan risk analysis, content staleness detection, bundling analysis |
| standard | Balanced: cold-read prediction, schema check, link verification, design map coverage |
| quick | Basic: schema check, link verification only. Skip cold-read prediction and health analysis |

## EXECUTE NOW

**Target: $ARGUMENTS**

Parse immediately:
- If target contains a record name: review that specific record
- If target contains `--handoff`: output RALPH HANDOFF block at end
- If target is "all" or "recent": review recently created/modified records
- If target is empty: ask which record to review

## Anti-Shortcut Warning

Before marking verification as passed, you MUST complete ALL four categories:

1. COMPLETE rationale quality test — cold-read the title + rationale,
   predict what the record contains, compare against actual content.
   A rationale that merely restates the title FAILS.

2. COMPLETE schema validation — check ALL required fields from the
   template schema, verify ALL enum values are valid, confirm ALL
   constraints are met. A single missing required field FAILS.

3. COMPLETE link verification — confirm ALL wiki links in the record
   resolve to existing files. A single dangling link FAILS.

4. COMPLETE design map integration — verify the record appears in at least
   one design map's Core Ideas section with a context phrase.
   A record with no design map mention FAILS.

Do NOT declare success after checking only one or two categories.
ALL FOUR must pass.

**Execute these steps IN ORDER:**

### Step 0: INDEX FRESHNESS CHECK

Before any retrieval tests, verify the semantic search index is current:

1. Try `mcp__qmd__vector_search` with a simple test query to confirm MCP availability
2. If MCP is unavailable (tool fails or returns error), try qmd CLI (`qmd status`) to confirm local CLI availability
3. If either MCP or qmd CLI is available, proceed to Step 1
4. If neither MCP nor qmd CLI is available: note "retrieval test will be deferred" and proceed — do NOT let index issues block verification

The index freshness check prevents false retrieval failures on recently created records. If the index is stale, retrieval test results should be interpreted with that context.

### Step 1: RECITE (cold-read prediction test)

**CRITICAL: Do NOT read the full record yet. Only read frontmatter.**

This step tests whether the title + rationale alone enable an agent to predict the record's content. The cold-read constraint is the entire point — reading the record first contaminates the prediction.

**1. Read ONLY title + rationale**

Use Read with a line limit to get just the first few lines of frontmatter. Extract:
- Title (the filename without .md)
- Rationale (the rationale field)

Do NOT scroll past the frontmatter closing `---`.

**2. Form prediction**

Before reading further, write out what you expect:
- Core argument: what claim does this record make?
- Mechanism: what reasoning or evidence does it use?
- Scope: what boundaries does the argument have?
- Likely connections: what other records would it reference?

Write this prediction explicitly in your output. It must be specific enough to be wrong.

**3. Read full record content**

NOW read the complete record. Compare against your prediction.

**4. Score prediction accuracy (1-5)**

| Score | Meaning | Threshold |
|-------|---------|-----------|
| **5** | Perfect — rationale fully captured the argument | Pass |
| **4** | Strong — minor details missed, core predicted | Pass |
| **3** | Adequate — general area right, missed key aspects | Pass (minimum) |
| **2** | Weak — significant mismatch between prediction and content | FAIL |
| **1** | Failed — record argued something different than expected | FAIL |

**Passing threshold: 3 or above.**

**5. Run semantic retrieval test**

Test whether the rationale enables semantic retrieval:

- Tier 1 (preferred): `mcp__qmd__vector_search` with query = "[the record's rationale text]", collection = "records", limit = 10
- Tier 2 (CLI fallback): `qmd vsearch "[the record's rationale text]" --collection records -n 10`
- Tier 3: if both MCP and qmd CLI are unavailable, report "retrieval test deferred (semantic search unavailable)" — do NOT skip silently

Check where the record appears in results:
- Top 3: rationale works well for semantic retrieval
- Position 4-10: adequate but could improve
- Not in top 10: flag — rationale may not convey the record's meaning

**Why vector_search specifically:** Agents find records via semantic search during connect and update. Testing with keyword search tests the wrong retrieval method. Full hybrid search with LLM reranking compensates for weak rationales — too lenient. vector_search tests real semantic findability without hiding bad rationales behind reranking.

**6. Draft improved rationale if needed**

If prediction score < 3:
- Diagnose the failure: too vague? missing mechanism? wrong emphasis? restates title?
- Draft an improved rationale that would score higher
- If you have Edit tool access: apply the improvement

**7. Combined scoring**

| Prediction Score | Retrieval Rank | Suggested Action |
|------------------|----------------|------------------|
| 4-5 | top 3 | Rationale works — no changes needed |
| 3-4 | top 5 | Adequate — minor improvements possible |
| 3+ | 6-10 | Investigate — passes prediction but weak retrieval |
| any | not in top 10 | Flag for review — rationale may not enable retrieval |
| < 3 | any | FAIL — rationale needs rewriting |

### Step 2: AUDIT (schema check)

Read the template that applies to this record type. Determine the template by checking:
- Record location (e.g., records/ uses the standard record template)
- Type field in frontmatter (if present, may indicate a specialized template)

If the vault has templates with `_schema` blocks, read the `_schema` from the relevant template for authoritative field requirements. If no `_schema` exists, use the checks below as defaults.

**Required fields (FAIL if missing):**

| Field | Requirement | Severity |
|-------|-------------|----------|
| `rationale` | Must exist and be non-empty | FAIL |
| Areas footer or `areas` field | Must reference at least one design map | FAIL |

**Rationale constraints (WARN if violated):**

| Constraint | Check | Severity |
|------------|-------|----------|
| Length | Should be ~50-200 characters | WARN |
| Format | Single sentence, no trailing period | WARN |
| Content | MUST add NEW information beyond title | WARN |
| Semantic value | Should capture mechanism, not just topic | WARN |

**How to check "adds new info":** Read the title, read the rationale. If the rationale says the same thing in different words, it fails this check. A good rationale adds: mechanism (how/why), scope (boundaries), implication (what follows), or context (where it applies).

**YAML validity (FAIL if broken):**

| Check | Rule | Severity |
|-------|------|----------|
| Frontmatter delimiters | Must start with `---` and close with `---` | FAIL |
| Valid YAML | Must parse without errors | FAIL |
| No unknown fields | Fields not in the template | WARN |

**Domain-specific field enums (WARN if invalid):**

If the record has fields with enumerated values (type, category, status, etc.), check them against the template's `_schema.enums` block. Each invalid enum value produces a WARN.

**Relevant records format (WARN if incorrect):**

| Constraint | Check | Severity |
|------------|-------|----------|
| Format | Array with context: `["[[record]] -- relationship"]` | WARN |
| Relationship type | Should use standard types: extends, foundation, contradicts, enables, example | INFO |
| Links exist | Each referenced record must exist as a file | WARN |

**Areas format (FAIL if invalid):**

| Constraint | Check | Severity |
|------------|-------|----------|
| Format | Array of wiki links: `["[[area]]"]` | FAIL |
| Links exist | Each design map must exist as a file | WARN |

**Composability (WARN if fails):**

| Check | Rule | Severity |
|-------|------|----------|
| Title test | Can you complete "This record argues that [title]"? | WARN |
| Specificity | Is the claim specific enough to disagree with? | WARN |

### Step 3: HEALTH CHECKS (per-record)

Run these 5 checks on the record:

**1. YAML frontmatter integrity**
- File starts with `---`, has closing `---`
- YAML parses without errors
- No duplicate keys

**2. Rationale quality (independent of recite)**
- Rationale is present and non-empty
- Rationale adds information beyond the title
- Rationale is not just the title rephrased

**3. Design map connection**
- Record appears in at least one design map's Core Ideas section
- How to check: grep for `[[record title]]` in files that serve as design maps
- The record's Areas footer references a valid design map
- A record with no design map mention is orphaned — FAIL

**4. Wiki link density**
- Count outgoing wiki links in the record body (not just frontmatter)
- Expected minimum: 2 outgoing links
- If < 2: flag as sparse — the record is not participating in the graph
- Sparse records should be routed to /connect for connection finding

**5. Link resolution**
- Scan ALL wiki links in the record — body, frontmatter `relevant_records`, and Areas
- For each `[[link]]`, confirm a matching file exists in the vault
- **Exclude** wiki links inside backtick-wrapped code blocks (single backtick or triple backtick) — these are syntax examples, not real links
- A single dangling link = FAIL with the specific broken link identified

**Deep-only checks (when processing.depth = deep):**

**6. Orphan risk assessment**
- Count incoming links: grep for `[[record title]]` across all .md files
- If 0 incoming links: AT RISK — record exists but nothing references it
- If 1 incoming link: LOW RISK — single point of connection
- If 2+ incoming links: OK

**7. Content staleness detection**
- Read the record's content and assess whether claims still seem current
- Check if referenced concepts/tools/approaches have changed
- Flag anything that reads as potentially outdated

**8. Bundling analysis**
- Does the record make multiple distinct claims that could be separate records?
- Check: could you link to part of this record without dragging unrelated context?
- If yes: flag for potential splitting

### Step 4: APPLY FIXES

If you have Edit tool access, apply fixes for clear-cut issues:

**Auto-fix (safe to apply):**
- Improved rationale if recite score < 3
- Missing `---` frontmatter delimiters
- Trailing period on rationale
- Missing Areas footer (if obvious which design map applies)

**Do NOT auto-fix (requires judgment):**
- Bundled records (splitting requires understanding the claims)
- Content staleness (needs human review of factual accuracy)
- Missing connections (use /connect instead — connection finding is its own phase)
- Ambiguous design map assignment (when record could fit multiple)

### Step 5: Compile Results

Combine all checks into a unified report:

```
=== REVIEW: [record title] ===

RECITE:
  Prediction score: N/5
  Retrieval rank: #N (or "not in top 10" or "deferred")
  Rationale: [pass/improved/needs work]

AUDIT:
  Required fields: [PASS/FAIL — detail]
  Rationale constraints: [PASS/WARN — detail]
  Areas format: [PASS/FAIL — detail]
  Optional fields: [PASS/WARN/N/A]
  Relevant records: [PASS/WARN/N/A]
  Composability: [PASS/WARN]

HEALTH:
  Frontmatter: [PASS/FAIL]
  Rationale quality: [PASS/WARN]
  Design map connection: [PASS/FAIL — which design map]
  Wiki links: N outgoing [PASS/WARN if < 2]
  Link resolution: [PASS/FAIL — broken links listed]

Overall: [PASS / WARN (N warnings) / FAIL (N failures)]

Actions Taken:
- [List of fixes applied, or "none"]

Recommended Actions:
- [List of suggested next steps, or "none"]
===
```

### Step 6: Update task file and capture observations

- If a task file is in context (pipeline execution): update the `## Review` section with results
- Reflect on the process: friction? surprises? methodology insights? process gaps?
- If any observations worth capturing: create atomic note in the observations directory per the observation capture pattern
- If `--handoff` in target: output RALPH HANDOFF block (see below)

**START NOW.** The reference material below explains philosophy and methodology — use to guide reasoning, not as output to repeat.

---

# Review

Combined verification: recite (rationale quality) + audit (schema compliance) + health checks. Three lightweight checks in one context window.

## philosophy

**verification is one concern, not three.**

recite tests whether the rationale enables retrieval. audit checks schema compliance. health checks graph health. all three operate on the same record, read the same frontmatter, and together answer one question: is this record ready?

running them separately meant three context windows, three subagent spawns, three rounds of reading the same file. the checks are lightweight enough (combined context ~15-25% of window) that they fit comfortably in one session while staying in the smart zone.

> "the unit of verification is the record, not the check type."

## execution order matters

**Recite MUST run first.** The cold-read prediction test requires forming an honest prediction from title + rationale BEFORE reading the full record. If audit or health ran first (both read the full record), the prediction would be contaminated. Recite's constraint: predict first, read second.

**Index freshness runs before everything.** The retrieval test in recite depends on semantic search having current data. Without a freshness check, recently created records produce false retrieval failures that obscure actual rationale quality issues.

After recite reads the full record, audit and health can run in any order since they both need the full content.

## recite: rationale quality

the testing effect applied to vault quality. read only title + rationale, predict what the record argues, then check. if your prediction fails, the rationale fails.

**why this matters:** rationales are the API of the vault. agents decide whether to load a record based on title + rationale. a misleading rationale causes two failure modes:
- **false positive:** agent reads the record expecting X, wastes context on Y
- **false negative:** agent skips the record because rationale doesn't signal relevance

both degrade the vault's value as a knowledge tool.

**retrieval test rationale:** agents find records via semantic search during connect and update. testing with BM25 keyword matching tests the wrong retrieval method. full hybrid search with LLM reranking compensates for weak rationales — too lenient. vector_search tests real semantic findability without hiding bad rationales.

## audit: schema compliance

checks against the relevant template schema:

| Check | Requirement | Severity |
|-------|-------------|----------|
| `rationale` | Must exist, non-empty | FAIL |
| `areas` | Must exist, array of wiki links | FAIL |
| rationale length | < 200 chars | WARN |
| rationale content | Adds info beyond title | WARN |
| rationale format | No trailing period | WARN |
| domain enum fields | Valid values per template `_schema.enums` | WARN |
| `relevant_records` format | Array with context phrases | WARN |
| YAML integrity | Well-formed, `---` delimiters | FAIL |
| Composability | Title passes "This record argues that [title]" test | WARN |

**FAIL means fix needed. WARN is informational but worth addressing.**

**template discovery:** The skill reads the template for the record type to get its `_schema` block. If no template exists or no `_schema` block is found, fall back to the default checks above.

## health: per-record checks

5 focused checks per record (not a full vault-wide audit):

1. **YAML frontmatter** — well-formed, has `---` delimiters, valid parsing
2. **Rationale quality** — present, adds info beyond title, not a restatement
3. **Design map connection** — appears in at least one design map
4. **Wiki link count** — >= 2 outgoing links (graph participation threshold)
5. **Link resolution** — all wiki links point to existing files (full body scan, excluding backtick-wrapped examples)

plus 3 deep-only checks for comprehensive audits:
6. **Orphan risk** — incoming link count (is anything pointing here?)
7. **Content staleness** — does the content still seem accurate?
8. **Bundling** — does the record make multiple distinct claims?

## common failure patterns

| Pattern | Symptom | Fix |
|---------|---------|-----|
| Title restated as rationale | Recite score 1-2, prediction trivially correct but content is richer | Rewrite rationale to add mechanism/scope |
| Missing design map | Health fails design map check | Add to appropriate design map or create Areas footer |
| Dangling links | Health fails link resolution | Remove link, create the target record, or fix the spelling |
| Sparse record | < 2 outgoing links | Route to /connect for connection finding |
| Schema drift | Enum values not in template | Update record to use valid values, or propose enum addition |

## batch mode (--all)

When reviewing all records:

1. Discover all records in records/ directory
2. For each record, run the full verification pipeline
3. Produce summary report:
   - Total records checked
   - PASS / WARN / FAIL counts per category
   - Top issues grouped by check type
   - Records needing immediate attention (FAIL items)
   - Pattern analysis across failures

**Performance note:** In batch mode, the recite cold-read test runs honestly for each record. Do not "warm up" by reading multiple records first — each prediction must be genuinely cold.

## standalone invocation

### /review [record]

Run all three checks on a specific record. Full detailed report.

### /review --all

Comprehensive audit of all records in records/. Summary table + flagged failures.

### /review --handoff [record]

Pipeline mode for orchestrator. Runs full workflow, outputs RALPH HANDOFF block.

## handoff mode (--handoff flag)

When invoked with `--handoff`, output this structured format at the END of the session:

```
=== RALPH HANDOFF: review ===
Target: [[record name]]

Work Done:
- Recite: prediction N/5, retrieval #N, [pass/fail]
- Audit: [PASS/WARN/FAIL] (N checks, M warnings, K failures)
- Health: [PASS/WARN/FAIL] (N checks, M issues)
- Rationale improved: [yes/no]

Files Modified:
- records/[record].md (rationale improved, if applicable)
- [task file path] (Review section updated, if applicable)

Learnings:
- [Friction]: [rationale] | NONE
- [Surprise]: [rationale] | NONE
- [Methodology]: [rationale] | NONE
- [Process gap]: [rationale] | NONE

Queue Updates:
- Mark: review done for this task
=== END HANDOFF ===
```

## task file update

When a task file is in context (pipeline execution), update the `## Review` section:

```markdown
## Review
**Reviewed:** [UTC timestamp]

Recite:
- Prediction: N/5 — [brief reason]
- Retrieval: #N via MCP vector_search or CLI vsearch (or "deferred")
- Rationale: [kept/improved — brief note]

Audit:
- Required fields: PASS
- Rationale constraints: PASS (147 chars, adds mechanism)
- Areas: PASS (["[[area]]"])
- Optional: [status]

Health:
- Frontmatter: PASS
- Design map connection: PASS ([[area]])
- Wiki links: N outgoing
- Link resolution: PASS (all resolve)

Overall: [PASS/WARN/FAIL]
```

## Pipeline Chaining

Review is the **final pipeline phase**. After verification completes:

- **manual:** Output "Reviewed. Pipeline complete." — no next step
- **suggested:** Output completion summary AND suggest marking task done in queue
- **automatic:** Task marked done, summary logged to task file

If verification FAILS (recite score < 3 or any FAIL-level issue), do NOT mark done. Instead:
- Output what failed and what needs fixing
- Keep task at `current_phase: "review"` for re-run after fixes

The chaining output uses domain-native vocabulary from the derivation manifest.

## queue.json update (interactive execution)

When running interactively (NOT via orchestrator), YOU must execute queue updates:

```bash
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
jq '(.tasks[] | select(.id=="TASK_ID")).status = "done" | (.tasks[] | select(.id=="TASK_ID")).completed = "'"$TIMESTAMP"'"' ops/queue/queue.json > tmp.json && mv tmp.json ops/queue/queue.json
```

The queue path uses the domain-native operations folder. Check `ops/` or equivalent.

## critical constraints

**never:**
- read the record before forming the recite prediction (cold-read is the whole point)
- auto-fix FAIL-level issues without flagging them in the report
- skip the semantic retrieval test without reporting "deferred"
- leave failures without suggested improvements
- declare PASS after checking only some categories

**always:**
- run recite FIRST (before audit/health — execution order is load-bearing)
- be honest about prediction accuracy (inflated scores defeat the purpose)
- suggest specific improved rationales for score < 3
- report all severity levels clearly (PASS/WARN/FAIL)
- update task file if one is in context
- capture observations for friction, surprises, or methodology insights
