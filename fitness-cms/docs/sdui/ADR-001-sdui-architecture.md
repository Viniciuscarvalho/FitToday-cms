# ADR-001: Use JSON Schema-based SDUI with BFF Layer for Mobile Clients

## Status

Proposed

## Date

2026-03-10

## Decision Drivers

- **Multi-platform expansion:** Android app is planned; UI changes currently require coordinated releases per platform
- **Feature velocity:** New screens and layout changes require app store review cycles (1-7 days)
- **Small team:** Solo/small engineering team; cannot afford separate toolchains for each platform
- **Existing tech stack:** Next.js 14 + TypeScript + Zod + Firebase; must minimize new infrastructure
- **iOS Codable compatibility:** Swift's native JSON decoding must work seamlessly with the schema
- **Offline-first requirements:** Students train in gyms with poor connectivity; UI must render offline
- **Incremental adoption:** Cannot afford a big-bang migration; must coexist with existing 34 REST endpoints

## Context

FitToday's backend is a monolithic Next.js 14 application serving both the trainer CMS dashboard and 34 REST API endpoints consumed by the iOS app. The current architecture has several limitations that block scaling:

1. **No BFF separation** — Same endpoints serve the CMS web dashboard and mobile app with different data needs
2. **No service layer** — Business logic is duplicated across route handlers (e.g., workout queries in `/api/workouts` and `/api/students/workouts`)
3. **Manual serialization** — Every endpoint converts Firestore Timestamps to ISO strings via `serializeFirestoreData()`
4. **Client-driven UI** — All layout, styling, and navigation decisions are hardcoded in the iOS app. Any visual change requires an app update through App Store review
5. **No API versioning** — Breaking response changes affect all mobile clients simultaneously
6. **No caching** — Every request hits Firestore directly (`export const dynamic = 'force-dynamic'`)

Industry leaders (Airbnb, Uber, Netflix, Faire) have proven that Server-Driven UI can dramatically improve feature velocity (Uber: 10x), reduce client rendering logic (Faire: 90%), and enable cross-platform parity from a single backend.

## Considered Options

### Option 1: JSON Schema-based SDUI over REST (Recommended)

Define a JSON Schema for SDUI component types. The Next.js BFF returns JSON payloads validated by Zod schemas. iOS decodes with native Codable. Components use discriminated unions (`type` field).

### Option 2: Protocol Buffers over gRPC

Define `.proto` files for SDUI components. Server serializes to binary protobuf. iOS decodes with SwiftProtobuf library.

### Option 3: GraphQL-based SDUI (Apollo)

Define SDUI component types as GraphQL types with interfaces and unions. iOS uses Apollo iOS Client for typed queries and caching.

### Option 4: Custom Format (No Schema)

Design a bespoke JSON format without formal schema validation. Rely on conventions and integration tests.

### Option 5: Adopt DivKit (Yandex Open Source)

Use Yandex's open-source SDUI framework directly, with its pre-built iOS/Android/Web renderers and JSON schema.

## Decision

**Option 1: JSON Schema-based SDUI over REST**, implemented as a new BFF layer within the existing Next.js application at `/api/mobile/v1/screens/*`.

## Architecture

```
                         ┌──────────────────┐
                         │  iOS / Android    │
                         │  SDUI Renderer    │
                         └────────┬─────────┘
                                  │
                         ┌────────▼─────────┐
                         │ /api/mobile/v1/* │  ← SDUI BFF (NEW)
                         └────────┬─────────┘
                                  │
                         ┌────────▼─────────┐
                         │  SDUI Builders   │  ← Screen composers (NEW)
                         │  lib/sdui/*      │
                         └────────┬─────────┘
                                  │
                         ┌────────▼─────────┐
                         │  Service Layer   │  ← Shared logic (NEW)
                         │  lib/services/*  │
                         └────────┬─────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                   │
    ┌─────────▼────────┐  ┌──────▼───────┐  ┌───────▼────────┐
    │ /api/* (existing) │  │  Firestore   │  │ Firebase Auth  │
    └──────────────────┘  └──────────────┘  └────────────────┘
```

### Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Schema format | JSON with Zod validation | Best DX; native iOS Codable; debuggable; existing Zod dependency |
| BFF placement | `/api/mobile/v1/` in same Next.js app | No new infrastructure; same deployment; separate concerns |
| SDUI granularity | Screen-level responses | One request per screen; natural caching unit; simpler client |
| Component approach | Domain-specific + generic primitives | 36 components: 28 generic + 8 fitness-domain-specific |
| Action system | 11 typed discriminated union actions | Type-safe; extensible; handles navigation, API calls, sheets, haptics |
| Styling | Design token system | Platform-specific rendering; consistent across SDUI and native |
| Versioning | Schema version in response meta | Additive evolution; `minClientVersion` for breaking changes |
| Offline | Client-side persistence of last response | Critical for gym environments with poor connectivity |
| Caching | 3-layer (CDN, BFF in-memory, client) | Balances freshness and performance |

### Response Envelope

```json
{
  "sdui": {
    "version": "1.0",
    "screen": {
      "id": "student-workouts",
      "title": "Meus Treinos",
      "refreshPolicy": { "type": "time-based", "intervalSeconds": 300 },
      "cachePolicy": { "maxAgeSeconds": 60, "staleWhileRevalidate": true },
      "layout": { "type": "scroll-view", "children": [...] },
      "emptyState": { "icon": "dumbbell", "title": "Nenhum treino ainda" },
      "errorState": { "title": "Erro ao carregar", "retryAction": { "type": "refresh-screen" } }
    }
  },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2026-03-10T14:30:00Z",
    "schemaVersion": "1.0.0",
    "minClientVersion": "1.0.0"
  }
}
```

## Consequences

### Positive

- **Ship UI changes without app updates.** New screens, layout changes, and content updates deploy server-side. No App Store review required.
- **Single source of truth for mobile UI.** Both iOS and future Android render from the same SDUI responses. Guaranteed cross-platform parity.
- **Incremental adoption.** New `/api/mobile/v1/` namespace runs alongside existing endpoints. No migration risk for the working CMS dashboard.
- **Forced service layer extraction.** The BFF pattern requires extracting business logic from route handlers into shared services — improving testability and code reuse.
- **Native developer experience.** JSON + Zod + TypeScript on backend; JSON + Codable + SwiftUI on iOS. No new languages, libraries, or toolchains.
- **Offline rendering.** Cached SDUI responses render identically when offline — critical for gym environments.
- **A/B testing capability.** The server can return different screen layouts to different user segments without client changes.

### Negative

- **Initial investment.** Building the SDUI type system (36 components), BFF endpoints, and iOS renderer is a ~10-15 week effort before full value is realized.
- **Schema maintenance burden.** Adding new components requires updates to Zod schemas, JSON Schema export, and Swift Codable types. Must be kept in sync.
- **Debugging complexity.** Issues can occur at three layers: service data, SDUI builder logic, or client renderer. Requires good logging at each layer.
- **Limited interactivity.** Complex gestures, animations, and platform-specific behaviors must still be implemented natively. SDUI handles layout and data, not custom interactions.
- **Server dependency for new screens.** Unlike native development, the iOS app cannot render a screen it hasn't received from the server (mitigated by offline caching).

### Neutral

- **Existing CMS is unaffected.** The web dashboard continues using direct API calls. SDUI is for mobile clients only.
- **Performance is comparable to current REST API.** JSON payload sizes for SDUI screens are similar to current aggregated responses. Caching compensates for any overhead.

## Alternatives Rejected

### Option 2: Protocol Buffers — Rejected

**Score: 60/90** (vs. 80/90 for JSON Schema)

Protocol Buffers offer 3-10x smaller payloads and fastest serialization. However:
- Binary format is **not human-readable** — cannot inspect responses in browser dev tools or logging
- Requires `protoc` toolchain and `SwiftProtobuf` dependency — adds build complexity
- Team must learn Protobuf-specific patterns (field numbering, evolution rules)
- Performance advantage is **irrelevant at FitToday's scale** (thousands of users, not millions)

**When to reconsider:** If FitToday exceeds 10M active users or if bandwidth-sensitive real-time features (live set tracking during workouts) require binary efficiency.

### Option 3: GraphQL (Apollo) — Rejected

**Score: 66/90**

GraphQL provides elegant schema introspection, typed fragments, and built-in caching via Apollo Client. However:
- Introduces **significant new infrastructure** (Apollo Server, schema management, Apollo iOS Client)
- The existing 34 REST endpoints would need migration or awkward coexistence
- **Overkill for current team size** — GraphQL shines with large teams and complex data graphs
- Learning curve for GraphQL patterns adds friction

**When to reconsider:** If the team grows beyond 5 engineers and data fetching patterns become complex enough to warrant query optimization.

### Option 4: Custom Format — Rejected

**Score: 57/90**

Maximum flexibility with zero schema constraints, but:
- **No validation tooling** — drift between server and client is inevitable
- **No code generation** — manual parser updates on both platforms
- Maintenance liability grows exponentially with component count
- Every bug is a "works for me" debugging nightmare

**Not recommended at any scale.**

### Option 5: DivKit Adoption — Rejected

DivKit is the most complete open-source SDUI framework with production-proven iOS/Android/Web renderers. However:
- Generic components (`div-container`, `div-text`) **lack fitness domain semantics** — no `workout-card`, `set-tracker`, `streak-counter`
- Building domain-specific components on top of DivKit adds a second abstraction layer
- DivKit's JSON schema is **opinionated and complex** — learning curve for the specific format
- Dependency on Yandex's maintenance and release cycle
- Harder to customize for FitToday's specific design language

**When to reconsider:** If generic UI rendering (marketing pages, onboarding flows) becomes a major use case where domain-specific components aren't needed.

## Implementation Phases

| Phase | Duration | Scope |
|-------|----------|-------|
| **1. BFF Layer** | 2-3 weeks | Service layer extraction; `/api/mobile/v1/` namespace; auth middleware |
| **2. Schema Definition** | 1-2 weeks | Zod schemas for 36 components; JSON Schema export; Swift Codable types |
| **3. SDUI Endpoints** | 3-4 weeks | First 3-6 screen endpoints (student-workouts, workout-detail, trainer-profile) |
| **4. iOS Renderer** | 4-6 weeks | SDUIKit: component renderers, action handler, navigation, caching, offline |

## Validation

This decision should be validated after Phase 3 by measuring:
- **Time to ship a screen change** (target: <1 hour from code to production, vs. current 1-7 days)
- **Code reduction on iOS** (target: 50%+ less rendering logic for SDUI screens)
- **Response payload size** (target: <50KB per screen, acceptable with gzip)
- **Offline rendering reliability** (target: 100% of cached screens render offline)

If Phase 3 validation fails to meet these targets, reassess before investing in Phase 4.

## Related Documents

- [SDUI_RESEARCH.md](./SDUI_RESEARCH.md) — Full case study analysis and trade-off research
- [component-schema.json](./component-schema.json) — JSON Schema for the SDUI type system
- [sdui-components.yaml](./sdui-components.yaml) — Component library specification
