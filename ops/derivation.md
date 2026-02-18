---
description: How this knowledge system was derived -- enables architect and reseed commands
created: 2026-02-18
engine_version: "1.0.0"
---

# System Derivation

## Configuration Dimensions
| Dimension | Position | Conversation Signal | Confidence |
|-----------|----------|--------------------|--------------------|
| Granularity | moderate | "architecture decisions", "what each endpoint does", "reason for each of these uses" | High |
| Organization | flat | Domain default -- decisions cross-cut features, platforms, integrations | Inferred |
| Linking | explicit | "how the CMS communicates with applications", "integrate solutions" | High |
| Processing | moderate | "complete documentation on the reason for each of these uses" | High |
| Navigation | 3-tier | Multiple clear areas: CMS, API, iOS, Android, Stripe, architecture | Medium |
| Maintenance | condition-based | Default -- no explicit signals | Inferred |
| Schema | moderate | "reason for each of these uses", "what each endpoint does" | High |
| Automation | full | Claude Code platform supports full automation | High |

## Personality Dimensions
| Dimension | Position | Signal |
|-----------|----------|--------|
| Warmth | neutral | default -- technical/engineering domain |
| Opinionatedness | neutral | default |
| Formality | professional | implicit from technical language |
| Emotional Awareness | task-focused | engineering domain |

## Vocabulary Mapping
| Universal Term | Domain Term | Category |
|---------------|-------------|----------|
| notes | records | folder |
| inbox | inbox | folder |
| archive | archived | folder |
| note (type) | record | note type |
| note (plural) | records | note type |
| reduce | document | process phase |
| reflect | connect | process phase |
| reweave | update | process phase |
| verify | review | process phase |
| validate | audit | process phase |
| rethink | reassess | process phase |
| MOC | design map | navigation |
| topic map | design map | navigation |
| description | rationale | schema field |
| topics | areas | schema field |
| wiki link | reference | linking |
| processing/pipeline | review cycle | process |
| orient | status check | session |
| persist | save state | session |
| self/ space | project mind | space |
| hub | hub | navigation |
| cmd_reduce | /document | command |
| cmd_reflect | /connect | command |
| cmd_reweave | /update | command |
| cmd_verify | /review | command |
| cmd_rethink | /reassess | command |

## Platform
- Tier: Claude Code
- Automation level: full
- Automation: full (default)

## Active Feature Blocks
- [x] wiki-links -- always included (kernel)
- [x] atomic-notes -- moderate granularity benefits from composability
- [x] mocs -- 3-tier navigation
- [x] processing-pipeline -- always included (always)
- [x] schema -- always included (always)
- [x] maintenance -- always included (always)
- [x] self-evolution -- always included (always)
- [x] methodology-knowledge -- always included (always)
- [x] session-rhythm -- always included (always)
- [x] templates -- always included (always)
- [x] ethical-guardrails -- always included (always)
- [x] helper-functions -- always included (always)
- [x] graph-analysis -- always included (always)
- [x] self-space -- agent should maintain project understanding
- [ ] semantic-search -- excluded: not opted in, can add later
- [ ] personality -- excluded: neutral-helpful default, no personality signals
- [ ] multi-domain -- excluded: single project focus

## Coherence Validation Results
- Hard constraints checked: 3. Violations: none
- Soft constraints checked: 7. Auto-adjusted: none. User-confirmed: none
- Compensating mechanisms active: none needed

## Failure Mode Risks
1. Temporal Staleness (HIGH) -- API endpoints and architecture evolve, decisions become outdated
2. Productivity Porn (HIGH) -- spending more time on the knowledge system than on the product
3. Collector's Fallacy (MEDIUM) -- documenting decisions without connecting them
4. Schema Erosion (MEDIUM) -- structured fields drift as the project grows

## Generation Parameters
- Folder names: records/, inbox/, archived/, self/, ops/, templates/, manual/
- Skills to generate: 16 (vocabulary-transformed)
- Hooks to generate: session-orient, session-capture, validate-note, auto-commit
- Templates to create: record-note.md, design-map.md, source-capture.md, observation.md
- Topology: single-agent with fresh-context pipeline
- Domain: SaaS fitness CMS (FitToday) -- personal trainer platform with iOS/Android apps and API
- Use case: Engineering knowledge base -- architecture decisions, API design, integration rationale
- Extraction categories: architecture-decisions, endpoint-specs, integration-docs, feature-specs, platform-decisions, data-models
