---
name: refactor
description: Plan vault restructuring from config changes. Compares config.yaml against derivation.md, identifies dimension shifts, shows restructuring plan, executes on approval. Triggers on "/refactor", "restructure vault".
version: "1.0"
generated_from: "arscontexta-v1.6"
user-invocable: true
context: fork
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
argument-hint: "[dimension|--dry-run] — focus on specific dimension or preview without approval prompt"
---

## Runtime Configuration (Step 0 — before any processing)

Read these files to configure domain-specific behavior:

1. **`ops/derivation-manifest.md`** — vocabulary mapping, dimension positions, platform hints
   - Use `vocabulary.notes` for the records folder name
   - Use `vocabulary.note` / `vocabulary.note_plural` for record type references
   - Use `vocabulary.topic_map` for design map references
   - Use `vocabulary.inbox` for the inbox folder name

2. **`ops/config.yaml`** — current live configuration (the "after" state)

3. **`ops/derivation.md`** — original derivation record (the "before" state)

If these files don't exist, report error: "Cannot refactor without both ops/config.yaml and ops/derivation.md."

---

## EXECUTE NOW

**INVARIANT: /refactor never executes without approval.** The plan is always shown first.

**Target: $ARGUMENTS**

Parse immediately:
- If target is empty: detect ALL config changes and plan restructuring
- If target names a specific dimension: focus on that dimension only
- If target is `--dry-run`: show plan without asking for approval

**Execute these phases:**
1. Detect changes between config.yaml and derivation.md
2. Plan restructuring for each changed dimension
3. Show the plan with affected artifacts and risk assessment
4. Execute on approval (unless --dry-run)
5. Validate post-restructuring

**START NOW.**

---

## Philosophy

**Configuration changes cascade.**

Changing a dimension affects multiple artifacts — skills, templates, context file sections, hooks, design map structure. /refactor makes these cascades visible and manages them.

**The relationship to /architect:** /architect RECOMMENDS changes. /refactor IMPLEMENTS them.

---

## Phase 1: Detect Changes

Compare each dimension in `ops/config.yaml` against `ops/derivation.md`. Also compare feature flags. If no changes detected, report clean state and exit.

---

## Phase 2: Plan Restructuring

### Dimension-to-Artifact Mapping

| Change | Affected Artifacts |
|--------|-------------------|
| **Granularity shift** | Record templates, /document extraction depth, processing skills, context file |
| **Organization shift** | Folder structure, design map hierarchy, context file, hub |
| **Linking shift** | Semantic search config, /connect density, context file |
| **Processing shift** | /document depth, /connect passes, pipeline skills, context file |
| **Navigation shift** | Design map tiers, hub, context file, record Areas footers |
| **Maintenance shift** | /health thresholds, condition triggers, context file |
| **Schema shift** | Templates (_schema blocks), /audit skill, query scripts |
| **Automation shift** | Hooks, skill activation, config.yaml |

### Content Impact Assessment

| Change Type | Action Required |
|-------------|----------------|
| Template field addition | Schema migration on old records |
| Folder restructure | Move files, update wiki links |
| Design map tier change | Merge/split maps, update Areas footers |

Check interaction constraints for hard blocks and soft warns.

---

## Phase 3: Show Plan

Present complete restructuring plan with affected artifacts and risk. If `--dry-run`, stop here. Otherwise ask: "Proceed with restructuring? (yes / no / adjust)"

---

## Phase 4: Execute on Approval

Execute in strict order:
1. Archive current state in ops/changelog.md
2. Regenerate affected skills with vocabulary transformation
3. Update context file (only affected sections)
4. Update templates (_schema blocks)
5. Update hooks (if automation changed)
6. Update derivation records (derivation.md, derivation-manifest.md)
7. Content migration if needed (schema migration, folder moves, link updates)

---

## Phase 5: Validate

Run kernel validation:

| Check | Pass Criterion |
|-------|----------------|
| Wiki link resolution | Zero dangling links |
| Schema compliance | All required fields present |
| Design map hierarchy | All tiers connected |
| Three-space boundaries | No content in wrong space |
| Vocabulary consistency | No stale universal terms |
| Skill integrity | All skills parseable |

Report results with restructuring summary.

---

## Edge Cases

- **No config.yaml or derivation.md:** Report error, suggest /setup
- **Single Dimension Focus:** Only check named dimension, still check constraints
- **Hard Block Detected:** WARN user, do NOT proceed
- **Large Content Migration (100+ records):** Offer batch processing
- **Feature Flag Changes:** Handle specifically (create/remove dirs, install tools, etc.)
