# Implementation Plan: SDUI + BFF Architecture

## Codebase Analysis

### Current State

- **34 API route handlers** under `web-cms/app/api/` — all contain inline Firestore queries
- **No service layer** — business logic duplicated across route handlers
- **No test framework** — only Playwright for e2e; need to add vitest
- **Zod already installed** (^3.22.4) — no new dependency for schema definition
- **Firebase Admin** fully set up: Auth, Firestore, Storage, Messaging
- **Auth utilities** exist: `verifyTrainerRequest`, `verifyAuthRequest`, `verifyAdminRequest`
- **N+1 query patterns** — e.g., workouts GET fetches progress + feedback per workout in loop
- **`toPublicProfile`** in `lib/trainer-utils.ts` — needs to move into trainer service
- **`serializeFirestoreData`** used in students route — needs centralization

### Key Dependencies

| Dep                 | Status    | Action            |
| ------------------- | --------- | ----------------- |
| zod 3.22+           | Installed | None              |
| zod-to-json-schema  | Missing   | Install as devDep |
| vitest              | Missing   | Install as devDep |
| firebase-admin 13.6 | Installed | None              |

### Risk Areas

1. **Recursive Zod types** — `z.lazy()` for nested component children may cause type inference issues
2. **Service extraction regressions** — existing CMS must keep working; test before/after
3. **N+1 queries in workout service** — need to batch progress/feedback queries
4. **No existing tests** — can't verify regression automatically; manual smoke-test after service extraction

---

## Implementation Order

### Phase 1: Foundation (Tasks 1.1, 1.9, 2.1, 2.5)

Start with foundational pieces that have no dependencies and unblock everything else.

**1.1 — Service layer foundation**

- Create `lib/services/types.ts` with `ServiceResult<T>`, `PaginatedResult<T>`, `ServiceError`
- Create `lib/services/firestore-helpers.ts` — extract `serializeTimestamp()`, `docToObject()`
- Create `lib/services/validation.ts` — common Zod schemas for pagination/status
- Create `lib/services/index.ts` barrel

**1.9 — BFF directory + auth middleware**

- Create `app/api/mobile/v1/` directory
- Create `lib/sdui/auth.ts` — `verifyMobileAuth()` wrapping existing `verifyAuthRequest`
- Create `lib/sdui/config.ts` — schema version, cache defaults

**2.1 — Design tokens**

- Create `lib/sdui/tokens.ts` — spacing, color, radius, shadow, text style enums

**2.5 — Action schemas**

- Create `lib/sdui/schemas/actions.ts` — 11 action types as discriminated union

### Phase 2: Service Extraction (Tasks 1.2-1.7, parallel)

All 6 services can be built in parallel after 1.1.

**Order by complexity (do hardest first):**

1. **1.2 — Workout service** (L) — most complex, N+1 queries, signed URL regeneration
2. **1.3 — Program service** (M) — marketplace vs private visibility logic
3. **1.6 — Trainer service** (M) — city filtering, toPublicProfile, reviews
4. **1.4 — Student service** (M) — profile, progress, analytics
5. **1.5 — Exercise service** (M) — search dedup, diacritics
6. **1.7 — Connection service** (M) — batch write for accept flow

### Phase 3: Schema Definition (Tasks 2.2-2.4, 2.6, parallel with Phase 2)

Can proceed in parallel with service extraction.

1. **2.2 — Layout component schemas** — vstack, hstack, scroll-view, section, grid, spacer, divider
2. **2.3 — Content + interactive schemas** — text, image, button, card, etc.
3. **2.4 — Navigation + domain schemas** — workout-card, trainer-card, etc.
4. **2.6 — Screen envelope + component union** — wire up recursive children, barrel export

### Phase 4: Route Refactor + Builders (Tasks 1.8, 2.7, 2.8)

**1.8 — Refactor existing routes** — delegate GET handlers to services; POST/PATCH/DELETE stay as-is
**2.7 — Builder functions** — after schemas done, create all builders
**2.8 — JSON Schema export** — install zod-to-json-schema, create generation script

### Phase 5: BFF Endpoints (Tasks 3.1-3.8)

All endpoints can be built in parallel after services + builders are ready.

1. **3.1 — student-workouts** — simplest screen, good first endpoint
2. **3.2 — workout-detail** — PDF viewer, progress, feedback
3. **3.3 — student-home** — dashboard, aggregates multiple services
4. **3.4 — trainer-profile** — public profile, connection status
5. **3.5 — exercise-catalog** — search, CDN-cacheable
6. **3.6 — program-detail** — week-by-week breakdown
7. **3.7 — trainer-discovery** — list + filters
8. **3.8 — Cache headers** — apply cache strategy to all endpoints

### Phase 6: Testing (Tasks 4.1-4.5)

1. **4.1 — Service layer unit tests** — mock Firestore, test all services
2. **4.2 — Builder unit tests** — validate output against Zod schemas
3. **4.3 — Schema validation tests** — round-trip JSON Schema
4. **4.4 — Integration tests** — full endpoint tests
5. **4.5 — Snapshot tests** — response shape regression

---

## Critical Path

```
1.1 → 1.2 → 1.8 → 3.1-3.7 → 3.8 → 4.4
2.1 → 2.2-2.4 → 2.6 → 2.7 ↗
2.5 ─────────────────────────↗
```

The longest path goes through: foundation → workout service → schemas → builders → endpoints → caching → integration tests.

## File Structure (New Files)

```
web-cms/
├── lib/
│   ├── services/
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── firestore-helpers.ts
│   │   ├── validation.ts
│   │   ├── workout-service.ts
│   │   ├── program-service.ts
│   │   ├── student-service.ts
│   │   ├── exercise-service.ts
│   │   ├── trainer-service.ts
│   │   └── connection-service.ts
│   └── sdui/
│       ├── auth.ts
│       ├── config.ts
│       ├── cache.ts
│       ├── tokens.ts
│       ├── schemas/
│       │   ├── index.ts
│       │   ├── actions.ts
│       │   ├── layout.ts
│       │   ├── content.ts
│       │   ├── navigation.ts
│       │   ├── domain.ts
│       │   └── screen.ts
│       └── builders/
│           ├── index.ts
│           ├── actions.ts
│           ├── layout.ts
│           ├── content.ts
│           ├── domain.ts
│           └── screen.ts
├── app/api/mobile/v1/screens/
│   ├── student-workouts/route.ts
│   ├── workout-detail/route.ts
│   ├── student-home/route.ts
│   ├── trainer-profile/route.ts
│   ├── exercise-catalog/route.ts
│   ├── program-detail/route.ts
│   └── trainer-discovery/route.ts
├── scripts/
│   └── generate-sdui-schema.ts
└── __tests__/
    ├── services/
    │   ├── workout-service.test.ts
    │   ├── program-service.test.ts
    │   ├── student-service.test.ts
    │   ├── exercise-service.test.ts
    │   ├── trainer-service.test.ts
    │   └── connection-service.test.ts
    └── sdui/
        ├── builders.test.ts
        ├── schema-validation.test.ts
        └── snapshots/
            └── *.snap.test.ts
```

## Implementation Conventions

- **Services return serialized data** — Timestamps converted to ISO strings at service boundary
- **Builders are pure functions** — given same input, always return same output
- **Route handlers are thin** — auth → params → service → builder → envelope → respond
- **Zod schemas are source of truth** — TypeScript types derived via `z.infer<>`
- **No breaking changes to existing CMS** — services are additive; route handlers delegate to them
