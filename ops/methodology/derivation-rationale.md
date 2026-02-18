---
description: Why each configuration dimension was chosen -- the reasoning behind initial system setup
category: derivation-rationale
created: 2026-02-18
status: active
---
# derivation rationale for FitToday

## Domain Context

FitToday is a SaaS fitness CMS platform that enables personal trainers to manage students and deliver individualized workouts through iOS and Android mobile apps, with an API layer connecting the CMS to the apps. The platform integrates with Stripe Connect for payments and Firebase for authentication.

## Key Dimension Choices

**Granularity: moderate** -- Per-decision and per-specification records, not atomic claims. A single architecture decision (like "Stripe Connect was chosen over direct integration") is the natural unit. Decomposing further would fragment the rationale that makes each decision valuable.

**Organization: flat** -- Decisions cross-cut features, platforms, and integrations. A Stripe decision affects both the CMS and mobile apps. Folder-based organization would create silos. Flat with design map overlay lets the same record appear in multiple project areas.

**Linking: explicit** -- Direct wiki links between related decisions. "The JWT auth decision enables the stateless mobile app communication" is a connection worth tracking explicitly. At moderate volume, explicit links suffice without semantic search.

**Processing: moderate** -- Complete documentation with rationale, not just capture. The user explicitly stated "complete documentation on the reason for each of these uses." But this isn't academic research requiring heavy extraction -- it's project documentation requiring structured reasoning.

**Navigation: 3-tier** -- Multiple clear project areas: CMS, API, iOS, Android (future), Stripe, architecture, data models. This warrants topic-level design maps organized under a hub. Hub -> area maps -> individual records.

**Schema: moderate** -- Structured fields for decision tracking: type (architecture, endpoint, integration, feature, platform, data-model), status (active, superseded, deprecated), superseded_by. Rich enough for queries but not so dense as to slow capture.

**Automation: full** -- Claude Code platform supports hooks, skills, and pipeline automation. All 16 skills generated, all hooks installed. The user can opt down via config.yaml.

## Platform
- Tier: Claude Code (full automation support)
- Self-space: enabled (agent should maintain project understanding)
- Semantic search: disabled (can add later via qmd when records > 100)

## Coherence Validation
All hard constraints passed. No soft constraint violations. The configuration is internally consistent: moderate granularity + moderate processing + full automation + 3-tier navigation is a well-validated coherence point.

## Failure Mode Risks
- Temporal staleness is the highest risk -- API endpoints and architecture evolve faster than most domains
- Productivity porn is a risk for any meta-system -- the vault serves the product, not the reverse

---

Areas:
- [[methodology]]
