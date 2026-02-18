---
name: audit
description: Schema validation for records. Checks against domain-specific templates. Validates required fields, enum values, rationale quality, and link health. Non-blocking — warns but doesn't prevent capture. Triggers on "/audit", "/audit [record]", "check schema", "audit record", "audit all".
user-invocable: true
allowed-tools: Read, Grep, Glob
context: fork
model: sonnet
---

## Runtime Configuration (Step 0 — before any processing)

Read these files to configure domain-specific behavior:

1. **`ops/derivation-manifest.md`** — vocabulary mapping, platform hints
   - Use `vocabulary.notes` for the records folder name
   - Use `vocabulary.note` / `vocabulary.note_plural` for record type references
   - Use `vocabulary.topic_map` for design map references
   - Use `vocabulary.templates` for the templates folder path

2. **`ops/config.yaml`** — processing depth
   - `processing.depth`: deep | standard | quick

If these files don't exist, use universal defaults.

**Processing depth adaptation:**

| Depth | Validation Behavior |
|-------|---------------------|
| deep | Full schema validation. All checks enabled including composability analysis and cross-reference verification |
| standard | Full validation — all checks enabled |
| quick | Basic schema validation only — required fields, YAML validity, enum values |

## EXECUTE NOW

**Target: $ARGUMENTS**

Parse immediately:
- If target contains a record name: audit that specific record
- If target contains `--handoff`: output RALPH HANDOFF block at end
- If target is "all" or "records": audit all records in records/ directory
- If target is empty: ask which record to audit

**Execute these steps:**

### Step 1: Locate Template

Determine which template applies to the target record:

1. Check the record's location — records in records/ use the standard record template
2. Check the `type` field in frontmatter — specialized types may have dedicated templates
3. Look for a templates directory (check `ops/templates/` or domain-specific path from derivation manifest)
4. If the template has a `_schema` block, read it — this is the authoritative schema definition

If no template is found, use the default schema checks below.

### Step 2: Read Target Record

Read the target record's full YAML frontmatter. Parse:
- All YAML fields and their values
- The body content (for link scanning)
- The footer section (for Areas and Relevant Records)

### Step 3: Run Schema Checks

Run ALL validation checks. Each check produces PASS, WARN, or FAIL.

**START NOW.**

---

## Schema Checks

### Required Fields (FAIL if missing)

| Check | Rule | How to Verify |
|-------|------|---------------|
| `rationale` | Must exist and be non-empty | Check YAML frontmatter for `rationale:` field with non-empty value |
| Areas | Must link to at least one design map | Check for `areas:` in YAML or `Areas:` section in footer. Must contain at least one wiki link |

A missing required field is a hard failure. The record cannot pass validation without these.

### Rationale Quality (WARN if weak)

| Check | Rule | How to Verify |
|-------|------|---------------|
| Length | Should be ~50-200 characters | Count characters in rationale value |
| New information | Must add context beyond the title | Compare rationale text against filename/title — if semantically equivalent, WARN |
| No trailing period | Convention: rationales don't end with periods | Check last character |
| Single sentence | Should be one coherent statement | Check for sentence-ending punctuation mid-rationale |

**How to check "adds new info":** Read the title (filename without .md). Read the rationale. If the rationale merely restates the title using different words, it fails this check. A good rationale adds one of:
- **Mechanism** — how or why the claim works
- **Scope** — what boundaries the claim has
- **Implication** — what follows from the claim
- **Context** — where the claim applies

**Examples:**

Bad (restates title):
- Title: `vector proximity measures surface overlap not deep connection`
- Rationale: "Semantic similarity captures surface-level overlap rather than genuine conceptual relationships"

Good (adds mechanism):
- Title: `vector proximity measures surface overlap not deep connection`
- Rationale: "Two records about the same concept with different vocabulary score high, while genuinely related ideas across domains score low"

### YAML Validity (FAIL if broken)

| Check | Rule | How to Verify |
|-------|------|---------------|
| Frontmatter delimiters | Must start with `---` on line 1 and close with `---` | Read first line and scan for closing delimiter |
| Valid YAML | Must parse without errors | Check for common YAML errors: unquoted colons in values, mismatched quotes, bad indentation |
| No duplicate keys | Each YAML key appears only once | Scan for repeated field names |
| No unknown fields | Fields not in the template schema | Compare against `_schema.required` and `_schema.optional` if available — unknown fields get WARN |

### Domain-Specific Enum Checks (WARN if invalid)

If the record has fields with enumerated values, check them against the template's `_schema.enums` block:

| Field | Expected | Severity |
|-------|----------|----------|
| `type` | Values from template enum (e.g., claim, methodology, tension, problem, learning) | WARN |
| `status` | Values from template enum (e.g., preliminary, open, dissolved) | WARN |
| `classification` | Values from template enum (e.g., open, closed) | WARN |
| Custom domain fields | Values from template enum | WARN |

If a field has a value not in the enum list, report the invalid value and list the valid options.

### Link Health (WARN per broken link)

| Check | Rule | How to Verify |
|-------|------|---------------|
| Body wiki-links | Each `[[link]]` should point to an existing file | Extract all `[[...]]` patterns from body, check each against file tree |
| Areas links | Design map referenced in Areas must exist | Verify each area wiki link resolves |
| Relevant records links | Each record in `relevant_records` must exist | Verify each wiki link in relevant_records resolves |
| Backtick exclusion | Wiki links inside backticks are examples, not real links | Skip `[[...]]` patterns inside single or triple backtick blocks |

**How to verify link resolution:** For each `[[link text]]`, check if a file named `link text.md` exists anywhere in the vault. Wiki links resolve by filename, not path.

### Relevant Records Format (WARN if incorrect)

| Check | Rule | Severity |
|-------|------|----------|
| Format | Array with context: `["[[record]] -- relationship"]` | WARN |
| Context phrase present | Each entry should include `--` or `—` followed by relationship rationale | WARN |
| Relationship type | Standard types: extends, foundation, contradicts, enables, example | INFO |
| No bare links | `["[[record]]"]` without context is a bare link — useless for navigation | WARN |

### Composability (WARN if fails)

| Check | Rule | How to Verify |
|-------|------|---------------|
| Title test | Can you complete "This record argues that [title]"? | Read the title as a sentence fragment — does it make a claim? |
| Specificity | Is the claim specific enough to disagree with? | Could someone reasonably argue the opposite? |
| Prose fitness | Would `since [[title]]` read naturally in another record? | Check if the title works as an inline wiki link |

**Area labels vs claims:**
- "knowledge management" — area label, not a claim, FAILS composability
- "knowledge management requires curation not accumulation" — claim, PASSES composability

## Batch Mode

When auditing all records (target is "all" or "records"):

1. Discover all .md files in records/ directory
2. Optionally include additional directories (e.g., self/memory/) if they exist
3. Run all schema checks on each record
4. Produce summary report:
   - Total records checked
   - PASS / WARN / FAIL counts
   - Top issues grouped by check type
   - Records needing immediate attention (FAIL items)
   - Pattern analysis: are certain check types failing systematically?

**Batch output format:**

```
## Validation Summary

Checked: N records
- PASS: M (X%)
- WARN: K (Y%)
- FAIL: J (Z%)

### FAIL Items (immediate attention)
| Record | Check | Detail |
|--------|-------|--------|
| [[record]] | rationale | Missing |
| [[record]] | areas | No areas footer |

### Top WARN Patterns
- Rationale restates title: N records
- Missing context phrases in relevant_records: N records
- Enum value not in template: N records

### Records Needing Attention
1. [[record]] — 2 FAIL, 1 WARN
2. [[record]] — 1 FAIL, 3 WARN
```

## Output Format (Single Record)

```
=== AUDIT: [[record title]] ===

PASS:
- rationale: present, 147 chars, adds mechanism beyond title
- areas: ["[[area-name]]"] — exists
- yaml: well-formed, valid delimiters
- composability: title works as prose ("This record argues that [title]")

WARN:
- relevant_records: bare link without context phrase for [[record-x]]
- type: "observation" not in template enum (valid: claim, methodology, tension, problem, learning)

FAIL:
- (none)

Overall: PASS (2 warnings)
===
```

If WARN or FAIL items exist, include:

```
### Suggested Fixes
- **relevant_records**: Add context phrase — e.g., `["[[record-x]] -- extends this by adding..."]`
- **type**: Change to valid enum value or propose adding "observation" to template
```

## Handoff Mode (--handoff flag)

When invoked with `--handoff`, output this structured format at the END:

```
=== RALPH HANDOFF: audit ===
Target: [[record title]]

Work Done:
- Audited against [template name] schema
- Checks run: N
- Status: PASS | WARN | FAIL

Findings:
- PASS: [list]
- WARN: [list or "none"]
- FAIL: [list or "none"]

Files Modified:
- [task file path] (Audit section updated, if applicable)

Learnings:
- [Friction]: [rationale] | NONE
- [Surprise]: [rationale] | NONE
- [Methodology]: [rationale] | NONE
- [Process gap]: [rationale] | NONE

Queue Updates:
- Mark: audit done for this task
=== END HANDOFF ===
```

## Task File Update

When a task file is in context (pipeline execution), update the `## Audit` section:

```markdown
## Audit
**Audited:** [UTC timestamp]

Schema check against [template name]:
- rationale: PASS (147 chars, adds mechanism beyond title)
- areas: PASS (["[[area-name]]"])
- yaml: PASS (well-formed)
- type: not specified (optional)
- relevant_records: WARN (bare link for [[record-x]])
- composability: PASS

Overall: PASS (1 warning)
```

## Severity Levels

| Level | Meaning | Action |
|-------|---------|--------|
| PASS | Meets requirement fully | None needed |
| WARN | Optional issue or soft violation | Consider fixing, not blocking |
| FAIL | Required field missing or invalid format | Must fix before verification passes |
| INFO | Informational observation | No action needed |

**FAIL blocks pipeline completion.** A record with any FAIL-level issue should NOT be marked done in the queue. It stays at `current_phase: "review"` (or "audit" if run standalone) for re-validation after fixes.

**WARN does not block.** Warnings are quality signals, not gates. A record can proceed through the pipeline with warnings.

## Critical Constraints

**never:**
- block record creation based on validation failures (validation is a quality check, not a gate)
- auto-fix issues without reporting them first
- skip checks because the record "looks fine"
- report PASS without actually running the check
- ignore `_schema` blocks in templates when they exist

**always:**
- check ALL schema requirements, not a subset
- report specific field values in FAIL/WARN messages (not just "rationale is weak")
- suggest concrete fixes for every WARN and FAIL
- use template `_schema` as the authoritative source when available
- fall back to default checks gracefully when no template exists
- log patterns when running batch validation (recurring issues signal systematic problems)
