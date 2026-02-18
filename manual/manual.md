---
description: Hub page for the FitToday arscontexta knowledge vault manual
type: manual
generated_from: "arscontexta-1.0.0"
---

# FitToday Knowledge Vault Manual

This manual covers everything you need to operate the FitToday engineering knowledge vault -- from your first record to advanced graph maintenance.

## Pages

- [[getting-started]] -- Your first session: creating a record, building connections, navigating design maps
- [[skills]] -- Complete reference for every command, grouped by category
- [[workflows]] -- The review cycle, maintenance rhythm, and session structure
- [[configuration]] -- config.yaml structure, /architect usage, and dimension adjustment
- [[meta-skills]] -- /ask, /architect, /reassess, and /flag explained in depth
- [[troubleshooting]] -- Common issues: orphan records, dangling links, stale content, inbox overflow

## Quick Orientation

The vault stores engineering knowledge for FitToday -- a SaaS fitness CMS platform with a Next.js web dashboard, Firebase backend, Stripe Connect payments, and iOS/Android mobile apps.

### Core Concepts

| Concept | What It Means |
|---------|---------------|
| Record | A single architecture decision, endpoint spec, or integration doc in `records/` |
| Design map | A navigation hub that organizes related records by area (e.g., `api-architecture`, `payments`) |
| Inbox | Zero-friction capture zone -- everything enters here before processing |
| Review cycle | The four-phase pipeline: Capture, Document, Connect, Review |
| Area | A broad domain of knowledge (API architecture, payments, platform integration) |
| Wiki link | `[[record title]]` -- the invariant reference format connecting records |

### Folder Structure

```
FitToday-cms/
├── records/          -- Processed knowledge (architecture decisions, specs, rationale)
├── inbox/            -- Raw capture (unprocessed material)
├── self/             -- Agent identity, methodology, current goals
├── ops/              -- Operational state (queue, config, observations, sessions)
├── templates/        -- Record templates with schema definitions
├── archived/         -- Superseded or deprecated records
└── manual/           -- This documentation (you are here)
```

### Where to Start

If you are new to the vault, begin with [[getting-started]]. If you know the basics and need a command reference, go to [[skills]]. If something is broken, check [[troubleshooting]].
