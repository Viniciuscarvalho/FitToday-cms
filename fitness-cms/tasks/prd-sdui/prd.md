# Product Requirements Document (PRD)

**Project Name:** FitToday SDUI + BFF Architecture
**Document Version:** 1.0
**Date:** 2026-03-10
**Author:** FitToday Engineering
**Status:** Draft

---

## Executive Summary

**Problem Statement:**
FitToday's mobile clients (iOS today, Android planned) consume 34 REST API endpoints that couple UI layout, data fetching, and business logic into hardcoded native code. Every screen change -- a new card layout, a reordered section, an added metric -- requires an App Store submission and a 1-7 day review cycle. There is no BFF layer: the same endpoints serve the CMS web dashboard and mobile apps with conflicting data shapes. Business logic is duplicated across route handlers, serialization is manual, there is no caching, and there is no API versioning. When Android launches, the problem doubles.

**Proposed Solution:**
Introduce a Backend-for-Frontend (BFF) layer at `/api/mobile/v1/screens/*` within the existing Next.js 14 application, returning Server-Driven UI (SDUI) JSON responses. The server describes complete screen layouts using a typed component tree (36 components, 11 action types, design token system). The iOS (and future Android) app becomes a rendering engine that decodes and displays whatever the server sends, eliminating the need for app updates to ship UI changes. A shared service layer extracted from existing route handlers provides the data substrate for both CMS and BFF endpoints.

**Business Value:**
- Ship UI changes to mobile clients in minutes instead of days (target: under 1 hour from code to production)
- Guarantee cross-platform parity between iOS and Android from a single backend
- Reduce iOS rendering logic by an estimated 50-90% for SDUI-powered screens
- Enable A/B testing and personalization without app releases
- Improve code quality by extracting a shared service layer that eliminates business logic duplication
- Support offline rendering for students training in gyms with poor connectivity

**Reference Documents:**
- ADR-001: Use JSON Schema-based SDUI with BFF Layer for Mobile Clients (`docs/sdui/ADR-001-sdui-architecture.md`)
- SDUI Research & Recommendations (`docs/sdui/SDUI_RESEARCH.md`)
- Component Library Specification (`docs/sdui/sdui-components.yaml`)
- Component JSON Schema (`docs/sdui/component-schema.json`)

---

## Project Overview

### Current State

FitToday's backend is a monolithic Next.js 14 application serving both the trainer CMS dashboard (React pages) and 34 REST API endpoints consumed by the iOS app. The architecture has six structural problems documented in ADR-001:

| Problem | Impact |
|---------|--------|
| No BFF separation | Same endpoints serve CMS tables and mobile cards with different data needs |
| No service layer | Business logic (Firestore queries, data transforms) is duplicated across route handlers |
| Manual serialization | Every endpoint converts Firestore Timestamps to ISO strings via `serializeFirestoreData()` |
| Client-driven UI | All layout, styling, and navigation decisions are hardcoded in the iOS app |
| No API versioning | Breaking response changes affect all mobile clients simultaneously |
| No caching | Every request hits Firestore directly (`export const dynamic = 'force-dynamic'` on all routes) |

### Desired State

After this project, the architecture separates concerns into four distinct layers:

```
iOS/Android  -->  /api/mobile/v1/* (BFF)  -->  SDUI Builders (lib/sdui/)  -->  Service Layer (lib/services/)  -->  Firestore/Firebase
```

- Mobile clients call screen-level BFF endpoints that return complete SDUI responses
- SDUI builder functions compose screen layouts from service-layer data
- The service layer provides shared, testable business logic consumed by both CMS and BFF routes
- Existing `/api/*` CMS endpoints remain untouched and continue serving the web dashboard
- Three-layer caching (CDN, BFF in-memory, client-side) replaces the current no-cache approach
- Schema versioning in response metadata enables additive evolution without breaking old clients

---

## User Personas

### 1. Student (Primary Mobile User)

**Profile:** A person enrolled in a trainer's workout program, using the iOS app daily to view workouts, track progress, and communicate with their trainer.

**Goals:**
- Open the app and immediately see today's workout, even when offline at the gym
- Track completed sets and reps during a training session without lag
- View progress metrics (streak, measurements, workout completion) at a glance
- Receive updated workout layouts and new features without manually updating the app

**Pain Points:**
- Poor cellular connectivity in underground gyms and basements causes blank screens
- Waiting days for a layout fix after a trainer reports a problem
- Having to update the app through the App Store to see a minor UI improvement

**SDUI Impact:** The student's entire app experience is rendered from server responses. Cached SDUI screens render offline. New sections, cards, and metrics appear the moment the server ships them.

### 2. Personal Trainer (CMS User, Indirect Mobile Beneficiary)

**Profile:** A fitness professional using the CMS web dashboard to manage students, create programs, and track progress. Their students use the mobile app.

**Goals:**
- See new features reflected in the student app quickly after requesting them
- Benefit from a faster feature iteration cycle without coordinating app releases
- Have confidence that the mobile app accurately reflects the programs they create in the CMS

**Pain Points:**
- Requested UI changes to the student app take weeks due to App Store review cycles
- Students on older app versions see stale or broken layouts
- Different students see different experiences depending on their app version

**SDUI Impact:** The trainer's CMS workflow is unaffected (SDUI is for mobile clients only). However, trainers benefit because UI changes to the student app deploy server-side, eliminating version fragmentation and accelerating feature delivery.

### 3. Platform Admin (Unaffected)

**Profile:** Manages trainers, monitors platform health, and views revenue metrics through the admin panel.

**SDUI Impact:** None. The admin panel is a web-only interface that does not consume SDUI endpoints. The admin benefits indirectly from the service layer extraction, which improves backend code quality and testability.

---

## Functional Requirements

### FR-001: Service Layer Extraction [MUST]

**Description:**
Extract Firestore query logic and business rules from existing route handlers into a shared service layer at `lib/services/`. Each service module encapsulates one domain (workouts, programs, students, trainers, exercises, connections). Both existing CMS routes and new BFF routes call the same service functions.

**Service modules to create:**

| Module | Key Functions | Source Routes |
|--------|--------------|---------------|
| `workout-service.ts` | `getWorkoutsForStudent()`, `getWorkoutDetail()`, `getWorkoutProgress()` | `/api/workouts`, `/api/students/workouts` |
| `program-service.ts` | `getPrograms()`, `getProgramDetail()`, `getProgramsByTrainer()` | `/api/programs` |
| `exercise-service.ts` | `searchExercises()`, `getExercise()`, `getExercisesByMuscleGroup()` | `/api/exercises` |
| `student-service.ts` | `getStudentProfile()`, `getStudentsByTrainer()`, `registerStudent()` | `/api/students` |
| `trainer-service.ts` | `getTrainerProfile()`, `getTrainerStats()` | `/api/trainers` |
| `connection-service.ts` | `getConnections()`, `createConnection()`, `validateConnectionCode()` | `/api/connections` |

**Acceptance Criteria:**
- Each service function accepts typed parameters and returns typed results (no raw Firestore documents leak out)
- Firestore Timestamp serialization is handled inside the service layer, not in route handlers
- Existing CMS route handlers are refactored to call service functions with zero behavior change
- All service functions have unit tests with mocked Firestore calls
- N+1 query patterns in existing handlers are consolidated into batch queries within services

---

### FR-002: Zod Schema Definitions for SDUI Components [MUST]

**Description:**
Define Zod schemas for all 36 SDUI component types, 11 action types, the design token system, and the response envelope. These schemas serve as the single source of truth for the SDUI type system. TypeScript types are inferred from Zod (`z.infer<typeof schema>`). JSON Schema is exported from Zod for documentation and Swift Codable type generation.

**Schema organization at `lib/sdui/`:**

| File | Contents |
|------|----------|
| `schema/tokens.ts` | `SpacingToken`, `ColorToken`, `RadiusToken`, `ShadowToken`, `TextStyle` enums |
| `schema/actions.ts` | 11 action schemas: `NavigateAction`, `ApiCallAction`, `ShowSheetAction`, etc. with `SDUIAction` discriminated union |
| `schema/components/layout.ts` | 7 layout components: `VStack`, `HStack`, `ScrollView`, `Section`, `Grid`, `Spacer`, `Divider` |
| `schema/components/content.ts` | 8 content components: `Text`, `Image`, `Avatar`, `Icon`, `Badge`, `ProgressBar`, `ProgressRing`, `StatRow` |
| `schema/components/interactive.ts` | 9 interactive components: `Button`, `Link`, `TextInput`, `Toggle`, `Slider`, `Picker`, `Checkbox`, `Form`, `SearchBar` |
| `schema/components/navigation.ts` | 4 navigation components: `TabBar`, `NavigationLink`, `ActionSheet`, `BottomSheet` |
| `schema/components/fitness.ts` | 8 domain-specific components: `WorkoutCard`, `ProgramCard`, `ExerciseItem`, `SetTracker`, `StreakCounter`, `TrainerCard`, `PdfViewer`, `MeasurementEntry` |
| `schema/envelope.ts` | `SDUIResponse` envelope with `sdui.screen` layout and `meta` fields |
| `schema/index.ts` | Barrel export + `SDUIComponent` discriminated union combining all 36 component schemas |

**Acceptance Criteria:**
- Every component schema matches the property definitions in `sdui-components.yaml`
- The `SDUIComponent` type is a Zod discriminated union on the `type` field
- The `SDUIAction` type is a Zod discriminated union on the `type` field
- `z.infer<typeof SDUIComponentSchema>` produces correct TypeScript types without manual type definitions
- A JSON Schema export function generates a schema file compatible with `docs/sdui/component-schema.json`
- Recursive component types (e.g., `children: SDUIComponent[]`) use `z.lazy()` correctly
- All schemas include `.describe()` annotations for documentation generation

---

### FR-003: SDUI Builder Functions [MUST]

**Description:**
Create builder functions at `lib/sdui/builders/` that take typed service-layer data and compose complete SDUI screen responses. Builders are pure functions: they receive data, return validated SDUI JSON. No side effects, no Firestore calls.

**Builder categories:**

| File | Functions | Purpose |
|------|-----------|---------|
| `builders/screen.ts` | `buildScreen()`, `buildSection()`, `buildEmptyState()`, `buildErrorState()` | Screen-level composition with cache/refresh policies |
| `builders/components.ts` | `buildWorkoutCard()`, `buildExerciseItem()`, `buildProgressBar()`, `buildTrainerCard()`, `buildStreakCounter()` | Domain component composition from service data |
| `builders/actions.ts` | `buildNavigateAction()`, `buildApiCallAction()`, `buildRefreshAction()` | Action object construction |
| `builders/envelope.ts` | `buildSDUIResponse()` | Wraps any screen in the standard response envelope with meta fields |

**Screen composers at `lib/sdui/screens/`:**

| File | Screen | Components Used |
|------|--------|----------------|
| `student-home.ts` | Student dashboard | `streak-counter`, `workout-card`, `stat-row`, `progress-ring`, `navigation-link` |
| `student-workouts.ts` | Workout list | `workout-card`, `section`, `badge`, `button`, `scroll-view` |
| `workout-detail.ts` | Single workout | `exercise-item`, `progress-bar`, `section`, `button`, `stat-row` |
| `trainer-profile.ts` | Trainer info | `trainer-card`, `program-card`, `stat-row`, `badge`, `grid` |
| `exercise-catalog.ts` | Exercise browser | `search-bar`, `exercise-item`, `section`, `grid`, `image` |
| `program-detail.ts` | Program info | `program-card`, `exercise-item`, `section`, `button`, `stat-row` |

**Acceptance Criteria:**
- Every builder function returns data that passes Zod schema validation
- Builders are pure functions with no side effects (testable without mocks)
- Screen composers handle empty data states (no workouts, no progress, etc.) by returning appropriate `emptyState` configurations
- Pre-formatted strings are used for all display values (e.g., "R$ 97,00/mes" not `{ price: 97, currency: "BRL" }`)
- All text content is in Portuguese (pt-BR) matching existing app language

---

### FR-004: BFF Endpoint Implementation [MUST]

**Description:**
Create REST API endpoints at `/api/mobile/v1/screens/*` within the Next.js app router. Each endpoint authenticates the request, calls service-layer functions, passes data through SDUI screen composers, and returns a validated SDUI response envelope.

**Endpoints:**

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/mobile/v1/screens/student-home` | GET | Required | Student dashboard with streak, active workouts, quick stats |
| `/api/mobile/v1/screens/student-workouts` | GET | Required | List of student's active and completed workouts |
| `/api/mobile/v1/screens/workout-detail/[id]` | GET | Required | Full workout detail with exercise list, progress, actions |
| `/api/mobile/v1/screens/trainer-profile/[id]` | GET | Required | Trainer profile with bio, programs, stats |
| `/api/mobile/v1/screens/exercise-catalog` | GET | Required | Searchable exercise library (query params for filtering) |
| `/api/mobile/v1/screens/program-detail/[id]` | GET | Required | Program overview with weeks, exercises, enrollment action |

**Auth middleware for `/api/mobile/v1/*`:**
- Validate Firebase Auth ID token from `Authorization: Bearer <token>` header
- Extract `uid` and inject into request context
- Return 401 with standardized error envelope for invalid/expired tokens
- Return 403 when the authenticated user lacks access to the requested resource

**Response envelope:**
Every response follows the standard SDUI envelope defined in FR-002, containing `sdui.screen` (layout tree) and `meta` (requestId, timestamp, schemaVersion, minClientVersion).

**Error responses:**
Standardized error format for all BFF endpoints:
```json
{
  "error": {
    "code": "WORKOUT_NOT_FOUND",
    "message": "O treino solicitado nao foi encontrado.",
    "details": {}
  },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2026-03-10T14:30:00Z"
  }
}
```

**Acceptance Criteria:**
- All 6 screen endpoints return valid SDUI responses that pass Zod validation
- Auth middleware rejects requests without a valid Firebase token
- Each endpoint returns appropriate HTTP status codes (200, 401, 403, 404, 500)
- Error responses use the standardized error envelope
- Each endpoint includes a `requestId` in the response for debugging
- Query parameters are validated (e.g., `workout-detail/[id]` rejects non-existent IDs with 404)
- Integration tests verify each endpoint end-to-end with mocked Firestore

---

### FR-005: Caching Strategy Implementation [MUST]

**Description:**
Implement a three-layer caching system to replace the current no-cache approach (`force-dynamic` on all routes).

**Layer 1 -- CDN/Edge (Vercel):**
- Shared, non-personalized screens (exercise catalog, public trainer profiles) use `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`
- Personalized screens (student home, student workouts) use `Cache-Control: private, no-cache` (not cacheable at CDN)

**Layer 2 -- BFF Response Cache (In-Memory):**
- Implement a lightweight in-memory cache (Map or LRU cache) for personalized screen responses
- Cache key: `screen:{screenId}:user:{userId}` with configurable TTL (default 60 seconds)
- Invalidation: clear user-specific cache entries on write operations (workout created, progress updated, connection established)
- Cache hit/miss tracking via structured logging for monitoring

**Layer 3 -- Client-Side (iOS Responsibility):**
- Each SDUI response includes a `cachePolicy` object: `{ maxAgeSeconds: number, staleWhileRevalidate: boolean }`
- The iOS client persists the last successful response per screen to local storage for offline rendering
- `refreshPolicy` instructs the client on when to re-fetch: `{ type: "time-based", intervalSeconds: 300 }` or `{ type: "event-based", events: ["app-foreground"] }`

**Acceptance Criteria:**
- Exercise catalog and public trainer profile endpoints return CDN-cacheable `Cache-Control` headers
- Personalized endpoints use the in-memory BFF cache with measurable hit rate
- All SDUI responses include `cachePolicy` and `refreshPolicy` fields
- Cache invalidation fires on write operations to affected data
- Cache bypass is possible via `Cache-Control: no-cache` request header for debugging

---

### FR-006: Schema Versioning and Client Compatibility [MUST]

**Description:**
Implement a versioning strategy that allows additive schema evolution without breaking existing mobile clients. The approach uses schema versioning in the response `meta` object rather than URL-based versioning.

**Versioning rules:**
1. **Additive changes (no version bump):** New component types, new optional properties on existing components, new action types. The iOS client must ignore unknown `type` values gracefully (render nothing or a fallback component).
2. **Minor version bump (1.0 -> 1.1):** New required properties on existing components. The `minClientVersion` field warns older clients.
3. **Major version bump (1.x -> 2.x):** Structural changes to the response envelope. Requires a new `/v2/` URL namespace.

**`meta` fields:**
- `schemaVersion`: Current schema version (semver string, e.g., "1.0.0")
- `minClientVersion`: Minimum iOS app version required to render this response (semver string)

**Client-side behavior:**
- If `minClientVersion` > installed app version, the iOS client shows a native "update required" screen instead of attempting to render the SDUI response
- Unknown component `type` values are silently skipped (render nothing) or replaced with a generic fallback placeholder

**Acceptance Criteria:**
- Every SDUI response includes `meta.schemaVersion` and `meta.minClientVersion`
- A version registry at `lib/sdui/version.ts` exports the current schema version and minimum client version
- Adding a new component type to the Zod schemas does not require changing the version number
- Adding a new required property on an existing component increments the minor version and updates `minClientVersion`
- The version registry is the single source of truth (not duplicated across endpoints)

---

### FR-007: Structured Logging and Observability [SHOULD]

**Description:**
Add structured logging to the BFF layer for debugging the three-layer architecture (service data, SDUI builder, endpoint response).

**Logging requirements:**
- Every BFF request logs: `requestId`, `userId`, `screenId`, `duration_ms`, `cache_hit`, `component_count`
- Service layer functions log query duration and document counts
- SDUI builders log component tree depth and total node count (debug level only)
- Errors include full stack traces with `requestId` correlation

**Acceptance Criteria:**
- All logs are structured JSON (not unstructured console.log)
- A single `requestId` traces a request through all three layers
- Cache hit/miss is logged for every BFF request
- Response time (`duration_ms`) is logged for every BFF request

---

### FR-008: Swift Codable Type Generation [SHOULD]

**Description:**
Generate Swift Codable type definitions from the Zod schemas to ensure type safety on the iOS client. The generated types use the same discriminated union pattern (`type` field) as the TypeScript types.

**Output:**
- A single `SDUITypes.swift` file containing all component, action, token, and envelope types
- The `SDUIComponent` enum uses `Codable` with a custom `init(from decoder:)` that switches on the `type` field
- Unknown `type` values decode to a `.unknown` case (graceful degradation)

**Generation approach:**
- A script at `scripts/generate-swift-types.ts` reads Zod schemas and outputs Swift code
- The script runs as part of CI to detect drift between server schemas and iOS types

**Acceptance Criteria:**
- Generated Swift types decode all example payloads from `sdui-components.yaml` without error
- Unknown component types decode to `.unknown` instead of throwing
- The generation script is idempotent (running twice produces identical output)
- CI fails if generated types are out of date with Zod schemas

---

## Non-Functional Requirements

### NFR-001: Performance [MUST]

**Targets:**
- BFF endpoint p95 response time: under 200ms (under 100ms for cached responses)
- SDUI JSON payload size: under 50KB per screen (before gzip), under 15KB after gzip
- Service layer query execution: under 100ms p95 for single-document fetches, under 200ms for list queries
- Cache hit rate for personalized screens: above 60% after warm-up
- Cold start time for BFF endpoints on Vercel serverless: under 500ms

**Measurement:**
- Response time measured via `X-Response-Time` header on all BFF responses
- Payload size monitored via structured logging
- Cache hit rate tracked via BFF cache metrics

**Acceptance Criteria:**
- All 6 screen endpoints meet the p95 response time target in load testing
- No screen endpoint returns a payload exceeding 50KB uncompressed
- Performance regression tests run in CI for critical endpoints

---

### NFR-002: Security [MUST]

**Requirements:**
- All BFF endpoints require Firebase Auth token authentication
- Tokens are validated server-side on every request (no client-side trust)
- Students can only access their own data; trainers can only access their students' data
- Resource-level authorization: `workout-detail/[id]` verifies the authenticated user has access to that specific workout
- Input validation on all path parameters and query strings (Zod validation, not just type checking)
- No sensitive data (email, phone, payment info) in SDUI responses unless the screen specifically requires it
- Rate limiting: 100 requests per minute per user for BFF endpoints

**Acceptance Criteria:**
- Requesting another user's workout returns 403, not 404 (no information leakage about resource existence)
- Invalid path parameters return 400 with descriptive error messages
- Rate limit exceeded returns 429 with `Retry-After` header
- Security tests verify authorization boundaries for all endpoints

---

### NFR-003: Offline Support [MUST]

**Requirements:**
- Every SDUI response is designed to be fully renderable without network access
- All image URLs in SDUI responses use Firebase Storage URLs that the iOS client can pre-cache
- The `cachePolicy` on each response declares how long the client should consider the cached version valid
- Empty states and error states are embedded in the SDUI response (not fetched separately)
- The iOS client persists the last successful SDUI response per screen to local storage

**Acceptance Criteria:**
- A student can open the app in airplane mode and see their workout list (from cached response)
- Cached SDUI responses render identically to live responses
- The app displays a subtle "offline" indicator when rendering from cache
- No screen shows a blank state due to network unavailability if it was previously loaded

---

### NFR-004: Scalability [MUST]

**Requirements:**
- The BFF layer runs on Vercel serverless functions (same as existing Next.js app) with no additional infrastructure
- The in-memory BFF cache operates per-instance (no shared state between serverless invocations, which is acceptable at current scale)
- The service layer design supports future migration to a shared Redis cache without interface changes
- The SDUI builder functions are stateless and horizontally scalable
- Adding a new screen endpoint requires no infrastructure changes

**Acceptance Criteria:**
- Load test with 100 concurrent users across all 6 screen endpoints shows no degradation beyond p95 targets
- Adding a 7th screen endpoint requires only: new service functions, new screen composer, new route handler (no infrastructure changes)
- The caching interface is abstract enough to swap in-memory for Redis without changing service or builder code

---

### NFR-005: Maintainability [MUST]

**Requirements:**
- Test coverage for the service layer: minimum 80%
- Test coverage for SDUI builders: minimum 90% (pure functions are easy to test)
- Test coverage for BFF endpoints: minimum 70% (integration tests)
- All Zod schemas self-document via `.describe()` annotations
- OpenAPI documentation generated for all BFF endpoints
- Component library changes follow a defined process: update `sdui-components.yaml` first, then Zod schemas, then builders, then Swift types

**Acceptance Criteria:**
- CI enforces minimum coverage thresholds
- `npm run test:coverage` reports per-module coverage for services, builders, and endpoints
- Adding a new SDUI component type is documented in a step-by-step guide
- No circular dependencies between lib/services/, lib/sdui/, and app/api/mobile/

---

### NFR-006: Compatibility [SHOULD]

**Requirements:**
- BFF endpoints work with the current iOS app version (the app can ignore SDUI and continue using existing endpoints during migration)
- Existing `/api/*` CMS endpoints are not modified in any way (zero regression risk for the web dashboard)
- The SDUI schema supports future Android client consumption without changes
- JSON responses use UTF-8 encoding for Portuguese characters

**Acceptance Criteria:**
- All existing CMS endpoint integration tests pass without modification after service layer extraction
- The SDUI response envelope is language/platform agnostic (no iOS-specific assumptions in the JSON)
- Portuguese characters (accents, tildes) render correctly in JSON responses

---

## Epics and User Stories

### Epic 1: BFF Foundation

**Description:** Establish the architectural foundation for the BFF layer by extracting a shared service layer from existing route handlers and creating the `/api/mobile/v1/` namespace with authentication middleware.

**User Stories:**

| ID | Story | Priority | Estimate |
|----|-------|----------|----------|
| US-1.1 | As a backend developer, I need a `workout-service.ts` that encapsulates all workout-related Firestore queries so that both CMS and BFF routes use the same business logic | P0 | 2 days |
| US-1.2 | As a backend developer, I need a `program-service.ts` that provides program queries and transforms so that program data is consistently shaped across consumers | P0 | 1 day |
| US-1.3 | As a backend developer, I need a `student-service.ts` and `trainer-service.ts` that handle user profile queries and Timestamp serialization internally | P0 | 1 day |
| US-1.4 | As a backend developer, I need an `exercise-service.ts` that supports search, filtering, and batch retrieval of exercises | P0 | 1 day |
| US-1.5 | As a backend developer, I need a `connection-service.ts` that handles trainer-student connection logic | P1 | 0.5 day |
| US-1.6 | As a backend developer, I need to refactor existing CMS route handlers to call the new service functions with zero behavior change, verified by passing existing tests | P0 | 3 days |
| US-1.7 | As a backend developer, I need an auth middleware for `/api/mobile/v1/*` that validates Firebase Auth tokens and injects user context into the request | P0 | 1 day |
| US-1.8 | As a backend developer, I need unit tests for all service layer functions with mocked Firestore to achieve minimum 80% coverage | P0 | 2 days |
| US-1.9 | As a backend developer, I need integration tests that verify existing CMS endpoints still return identical responses after the service layer refactor | P0 | 1 day |

**Acceptance Criteria for Epic:**
- All 6 service modules exist at `lib/services/` with typed interfaces
- All existing CMS route handlers call service functions (no direct Firestore queries in route files)
- Auth middleware at `lib/middleware/mobile-auth.ts` is functional and tested
- CI passes with all existing tests green

---

### Epic 2: SDUI Schema and Builders

**Description:** Define the complete SDUI type system in Zod and build the pure-function builder layer that composes service data into validated SDUI screen trees.

**User Stories:**

| ID | Story | Priority | Estimate |
|----|-------|----------|----------|
| US-2.1 | As a backend developer, I need Zod schemas for all design tokens (spacing, color, radius, shadow, text style) so that component properties reference a finite set of valid values | P0 | 0.5 day |
| US-2.2 | As a backend developer, I need Zod schemas for all 11 action types as a discriminated union on the `type` field so that user interactions are type-safe | P0 | 1 day |
| US-2.3 | As a backend developer, I need Zod schemas for all 7 layout components with recursive `children` support via `z.lazy()` | P0 | 1 day |
| US-2.4 | As a backend developer, I need Zod schemas for all 8 content components, 9 interactive components, and 4 navigation components | P0 | 2 days |
| US-2.5 | As a backend developer, I need Zod schemas for all 8 fitness-domain components (workout-card, exercise-item, set-tracker, etc.) matching the `sdui-components.yaml` specification | P0 | 1 day |
| US-2.6 | As a backend developer, I need a `SDUIComponent` discriminated union schema combining all 36 component types and an `SDUIResponse` envelope schema with `sdui` and `meta` sections | P0 | 0.5 day |
| US-2.7 | As a backend developer, I need builder functions (`buildScreen`, `buildSection`, `buildWorkoutCard`, etc.) that take service data and return Zod-validated component trees | P0 | 3 days |
| US-2.8 | As a backend developer, I need screen composer functions for 6 screens (student-home, student-workouts, workout-detail, trainer-profile, exercise-catalog, program-detail) | P0 | 3 days |
| US-2.9 | As a backend developer, I need a `buildSDUIResponse()` envelope function that wraps any screen in the standard response format with requestId, timestamp, schemaVersion, and minClientVersion | P0 | 0.5 day |
| US-2.10 | As a backend developer, I need schema validation tests that verify all example payloads from `sdui-components.yaml` pass Zod validation | P0 | 1 day |
| US-2.11 | As a backend developer, I need a JSON Schema export function that generates `component-schema.json` from the Zod schemas for documentation | P1 | 0.5 day |
| US-2.12 | As an iOS developer, I need generated Swift Codable types from the Zod schemas so that the iOS client has type-safe decoding with `.unknown` fallback for new component types | P1 | 2 days |

**Acceptance Criteria for Epic:**
- All 36 component Zod schemas exist at `lib/sdui/schema/`
- TypeScript types are inferred from Zod (no manual type definitions)
- All builder functions are pure and return Zod-validated output
- All 6 screen composers handle both populated and empty data states
- Schema validation tests pass for all example payloads
- Test coverage for builders exceeds 90%

---

### Epic 3: Screen Endpoints and Caching

**Description:** Implement the 6 BFF screen endpoints, the three-layer caching system, and the versioning mechanism, delivering the complete backend SDUI capability.

**User Stories:**

| ID | Story | Priority | Estimate |
|----|-------|----------|----------|
| US-3.1 | As a student, I can call `GET /api/mobile/v1/screens/student-workouts` and receive an SDUI response showing my active and completed workouts so that the app renders my workout list from server data | P0 | 2 days |
| US-3.2 | As a student, I can call `GET /api/mobile/v1/screens/workout-detail/:id` and receive an SDUI response with the full exercise list, progress, and action buttons so that the app renders a complete workout view | P0 | 2 days |
| US-3.3 | As a student, I can call `GET /api/mobile/v1/screens/student-home` and receive an SDUI response with my streak, quick stats, and active workout cards so that the app renders my dashboard | P1 | 2 days |
| US-3.4 | As a student, I can call `GET /api/mobile/v1/screens/trainer-profile/:id` and receive an SDUI response with the trainer's bio, stats, and program list so that the app renders the trainer's profile | P1 | 1 day |
| US-3.5 | As a student, I can call `GET /api/mobile/v1/screens/exercise-catalog` with optional query parameters and receive a paginated SDUI response of exercises | P2 | 1.5 days |
| US-3.6 | As a student, I can call `GET /api/mobile/v1/screens/program-detail/:id` and receive an SDUI response with the program overview, weekly structure, and enrollment action | P2 | 1.5 days |
| US-3.7 | As a backend developer, I need CDN-cacheable `Cache-Control` headers on shared screens (exercise catalog, trainer profiles) and private headers on personalized screens | P0 | 0.5 day |
| US-3.8 | As a backend developer, I need an in-memory BFF cache with user-specific keys and configurable TTL that invalidates on write operations | P1 | 1.5 days |
| US-3.9 | As a backend developer, I need every SDUI response to include `cachePolicy` and `refreshPolicy` fields so that the iOS client knows when to refresh | P0 | 0.5 day |
| US-3.10 | As a backend developer, I need a version registry at `lib/sdui/version.ts` that is the single source of truth for `schemaVersion` and `minClientVersion` in all responses | P0 | 0.5 day |
| US-3.11 | As a backend developer, I need integration tests for all 6 screen endpoints verifying auth, happy path, error cases, and response schema validation | P0 | 3 days |
| US-3.12 | As a backend developer, I need structured JSON logging on all BFF requests with requestId, userId, screenId, duration_ms, cache_hit, and component_count | P1 | 1 day |

**Acceptance Criteria for Epic:**
- All 6 screen endpoints are functional and return valid SDUI responses
- Auth middleware protects all endpoints (401 for missing token, 403 for unauthorized access)
- CDN caching headers are set correctly on shared vs. personalized endpoints
- In-memory BFF cache is operational with measurable hit rate
- All responses include versioning metadata
- Integration test suite covers auth, happy path, 404, and 500 scenarios for each endpoint
- p95 response time under 200ms for all endpoints in load testing

---

## Release Planning

### Phase 1: BFF Layer Foundation (Weeks 1-3)

**Goal:** Extract the shared service layer and establish the BFF namespace with authentication.

**Scope:** Epic 1 (all user stories)

**Deliverables:**
- 6 service modules at `lib/services/` with full test coverage
- Existing CMS route handlers refactored to use services (zero behavior change)
- Auth middleware for `/api/mobile/v1/*` namespace
- Unit and integration test suites

**Entry Criteria:**
- ADR-001 approved
- Current CMS endpoint tests pass as baseline

**Exit Criteria:**
- All service layer unit tests pass with 80%+ coverage
- All existing CMS integration tests pass unchanged
- Auth middleware tested with valid and invalid Firebase tokens
- Code review approved

**Risk:** Refactoring existing route handlers could introduce regressions. Mitigate by writing integration tests for existing endpoints before starting the refactor.

---

### Phase 2: Schema Definition (Weeks 3-5)

**Goal:** Define the complete SDUI type system and builder layer.

**Scope:** Epic 2 (US-2.1 through US-2.11)

**Deliverables:**
- Zod schemas for all 36 components, 11 actions, design tokens, and response envelope at `lib/sdui/schema/`
- Builder functions at `lib/sdui/builders/`
- Screen composer functions for 6 screens at `lib/sdui/screens/`
- Schema validation test suite
- JSON Schema export

**Entry Criteria:**
- Phase 1 service layer is complete and merged

**Exit Criteria:**
- All Zod schemas compile and infer correct TypeScript types
- All example payloads from `sdui-components.yaml` pass schema validation
- Builder test coverage exceeds 90%
- Screen composers handle empty and populated data states
- Code review approved

**Risk:** Recursive Zod schemas (`z.lazy()` for nested children) can cause TypeScript inference issues. Mitigate by testing recursive schemas early in isolation.

---

### Phase 3: SDUI Endpoints (Weeks 5-9)

**Goal:** Deliver the first 6 SDUI-powered screen endpoints with caching and versioning.

**Scope:** Epic 3 (all user stories) + US-2.12 (Swift Codable types)

**Deliverables:**
- 6 screen endpoints at `/api/mobile/v1/screens/*`
- Three-layer caching system (CDN headers, BFF in-memory cache, response-level policies)
- Version registry and metadata in all responses
- Structured logging for all BFF requests
- Integration test suite for all endpoints
- Generated Swift Codable types for iOS team

**Entry Criteria:**
- Phase 2 schemas and builders are complete and merged
- iOS team has reviewed component schemas and confirmed Codable compatibility

**Exit Criteria:**
- All 6 endpoints return valid SDUI responses verified by integration tests
- p95 response time under 200ms in load testing with 50 concurrent users
- Payload size under 50KB for all screens
- Cache hit rate above 60% for personalized screens in repeated-access testing
- Security tests verify auth boundaries
- Swift Codable types decode all endpoint responses without error
- Code review approved

**Risk:** Performance may not meet targets under load on Vercel serverless cold starts. Mitigate by implementing aggressive caching and measuring cold start overhead early.

---

### Phase 4: iOS Renderer (Weeks 9-15)

**Goal:** Build the SwiftUI rendering engine that decodes and displays SDUI responses.

**Scope:** iOS-only implementation (outside this backend PRD but included for planning completeness)

**Deliverables:**
- `SDUIKit` Swift package with:
  - `SDUIComponent` enum with Codable decoding (using generated types from Phase 3)
  - Layout renderers: `VStack`, `HStack`, `ScrollView`, `Section`, `Grid`
  - Content renderers: `Text`, `Image`, `Avatar`, `Badge`, `ProgressBar`, `ProgressRing`
  - Interactive renderers: `Button`, `TextInput`, `Toggle`, `Form`
  - Domain renderers: `WorkoutCard`, `ExerciseItem`, `SetTracker`, `StreakCounter`
  - Action handler and navigation manager
  - Networking layer with caching and offline support
- Integration of SDUIKit into the main FitToday iOS app for 3-6 screens

**Entry Criteria:**
- Phase 3 backend endpoints are complete, deployed, and returning stable SDUI responses
- Swift Codable types are generated and reviewed by iOS team

**Exit Criteria:**
- All 36 component types have SwiftUI renderers
- Unknown component types render a fallback or are silently skipped
- Offline rendering works for all cached screens
- Navigation, API calls, sheets, and alerts work through the action handler
- iOS integration tests verify rendering of all 6 screen endpoints

**Validation Metrics (from ADR-001):**
- Time to ship a screen change: under 1 hour (vs. current 1-7 days)
- Code reduction on iOS: 50%+ less rendering logic for SDUI screens
- Response payload size: under 50KB per screen
- Offline rendering reliability: 100% of cached screens render offline

---

## Risks and Mitigations

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|-----------|--------|------------|
| R-01 | **Over-engineering for current scale.** Building 36 components and a full rendering engine may be excessive for the current user base of thousands. | High | Medium | Start with only 3 screen endpoints in Phase 3 (student-workouts, workout-detail, trainer-profile). Expand only after validating the pattern. The remaining 3 screens are P1/P2 priority. |
| R-02 | **iOS renderer development bottleneck.** Phase 4 is the longest phase (4-6 weeks) and requires specialized SwiftUI expertise. A single blocker here delays the entire project's value realization. | High | High | Invest upfront in SDUIKit architecture. Build the renderer as a reusable Swift package with isolated component renderers. Prioritize the 12 most-used components first. |
| R-03 | **Schema drift between server and iOS.** Zod schemas evolve on the backend; Swift Codable types on iOS. Manual synchronization will inevitably fall out of date. | Medium | High | Automate Swift type generation from Zod schemas (US-2.12). Run the generation script in CI. Fail the build if generated types are stale. |
| R-04 | **Existing CMS regression during service layer refactor.** Extracting logic from route handlers into services could change subtle behaviors (query ordering, error handling, null coercion). | Medium | High | Write integration tests for existing CMS endpoints BEFORE starting the refactor. Run them after each service extraction to verify identical behavior. |
| R-05 | **Performance regression from abstraction layers.** Adding service layer, builder, and envelope wrapping adds overhead to every request compared to current direct-Firestore handlers. | Low | Medium | The BFF cache compensates for any added overhead. Profile endpoints before and after. Cache hit latency (under 5ms) dominates uncached latency (under 200ms). |
| R-06 | **Offline UX degradation.** If the iOS client's local persistence fails or corrupts, students see blank screens in the gym. | Medium | Medium | Implement robust persistence with error handling. Show the cached response with a "last updated X minutes ago" timestamp. Never show a blank screen if any cached data exists. |
| R-07 | **Component explosion.** The initial 36 components may grow rapidly as new screen designs demand new types, increasing maintenance burden. | Medium | Low | Enforce a strict review process: every new component must be justified by at least 2 screens that need it. Prefer composing existing components over creating new ones. |
| R-08 | **Team learning curve.** The SDUI pattern is new to the team. Debugging issues across three layers (service, builder, renderer) is more complex than the current single-layer approach. | Medium | Medium | Document patterns thoroughly. Create a "how to add a new screen" step-by-step guide. Invest in structured logging (FR-007) so that request tracing across layers is straightforward. |

---

## Traceability Matrix

This matrix maps functional requirements to epics, user stories, and non-functional requirements to ensure full coverage.

### Functional Requirements to Epics

| Requirement | Epic 1: BFF Foundation | Epic 2: Schema + Builders | Epic 3: Screen Endpoints |
|-------------|:---------------------:|:-------------------------:|:------------------------:|
| FR-001: Service Layer Extraction | US-1.1 to US-1.9 | -- | -- |
| FR-002: Zod Schema Definitions | -- | US-2.1 to US-2.6, US-2.10, US-2.11 | -- |
| FR-003: SDUI Builder Functions | -- | US-2.7 to US-2.9 | -- |
| FR-004: BFF Endpoint Implementation | US-1.7 (auth middleware) | -- | US-3.1 to US-3.6, US-3.11 |
| FR-005: Caching Strategy | -- | -- | US-3.7 to US-3.9 |
| FR-006: Schema Versioning | -- | -- | US-3.9, US-3.10 |
| FR-007: Structured Logging | -- | -- | US-3.12 |
| FR-008: Swift Codable Types | -- | US-2.12 | -- |

### Non-Functional Requirements to Implementation

| NFR | Implementation Location | Verification Method |
|-----|------------------------|---------------------|
| NFR-001: Performance | BFF cache (US-3.8), CDN headers (US-3.7), service layer query optimization (US-1.1-1.5) | Load testing with 50-100 concurrent users; p95 latency measurement |
| NFR-002: Security | Auth middleware (US-1.7), resource-level authorization (US-3.1-3.6), input validation (FR-004) | Security test suite; penetration testing of auth boundaries |
| NFR-003: Offline Support | Cache policies in responses (US-3.9), empty/error states in builders (US-2.8), iOS persistence (Phase 4) | Airplane mode testing; cache corruption recovery testing |
| NFR-004: Scalability | Stateless builders (US-2.7-2.9), abstract cache interface (US-3.8), no shared state | Load testing; adding 7th endpoint without infrastructure changes |
| NFR-005: Maintainability | Zod `.describe()` (US-2.1-2.6), test coverage (US-1.8, US-2.10, US-3.11), no circular deps | CI coverage gates; dependency graph analysis |
| NFR-006: Compatibility | Existing tests preserved (US-1.9), platform-agnostic JSON (FR-004), UTF-8 encoding | Existing CMS test suite passes unchanged; Android team reviews schema |

### Risks to Mitigations

| Risk | Primary Mitigation Story | Secondary Mitigation |
|------|-------------------------|---------------------|
| R-01: Over-engineering | US-3.1, US-3.2 (start with 2 screens) | Phase 3 validation metrics |
| R-02: iOS bottleneck | US-2.12 (generated types accelerate iOS work) | Phase 4 SDUIKit architecture |
| R-03: Schema drift | US-2.12 (automated generation) | CI validation of generated types |
| R-04: CMS regression | US-1.9 (integration tests before refactor) | US-1.6 (zero behavior change constraint) |
| R-05: Performance regression | US-3.8 (BFF cache) | NFR-001 load testing |
| R-06: Offline degradation | US-3.9 (cache/refresh policies) | NFR-003 airplane mode testing |
| R-07: Component explosion | US-2.5 (finite initial set) | Review process documented |
| R-08: Learning curve | US-3.12 (structured logging) | Step-by-step guide |

---

## Out of Scope

The following items are explicitly excluded from this project:

1. **CMS dashboard changes.** The web dashboard continues using existing `/api/*` endpoints. No SDUI for web.
2. **Android renderer.** Phase 4 covers iOS only. Android will consume the same BFF endpoints when development begins.
3. **Real-time features.** WebSocket-based live updates (e.g., live set tracking during workouts) are not part of SDUI. They remain native features.
4. **Complex animations and gestures.** SDUI handles layout and data. Custom animations, drag-and-drop, and platform-specific gestures remain native iOS code.
5. **Stripe/payment integration in BFF.** Payment flows continue through existing endpoints. The BFF may link to payment screens via `navigate` actions but does not process payments.
6. **Push notification content.** Notification payloads are separate from SDUI screen responses.
7. **Admin panel endpoints.** The admin panel is web-only and does not consume the BFF layer.
8. **Migration of existing 34 REST endpoints.** Existing endpoints remain as-is. They are not deprecated or modified (except for internal refactoring to use the service layer).

---

## Success Metrics

| Metric | Target | Measurement Point |
|--------|--------|-------------------|
| Time to ship a screen change | Under 1 hour (code to production) | After Phase 3, measure actual deployment time for a layout change |
| BFF p95 response time | Under 200ms | Load testing after Phase 3 |
| SDUI payload size | Under 50KB per screen (uncompressed) | Structured logging after Phase 3 |
| iOS rendering logic reduction | 50%+ fewer lines for SDUI screens vs. native equivalent | After Phase 4, compare SDUI-rendered screens to existing native screens |
| Offline rendering reliability | 100% of cached screens render offline | After Phase 4, airplane mode testing |
| Service layer test coverage | 80%+ | CI coverage report after Phase 1 |
| SDUI builder test coverage | 90%+ | CI coverage report after Phase 2 |
| BFF endpoint test coverage | 70%+ | CI coverage report after Phase 3 |
| Cache hit rate (personalized screens) | 60%+ after warm-up | BFF cache metrics after Phase 3 |

---

## Dependencies

| Dependency | Owner | Status | Impact if Blocked |
|------------|-------|--------|-------------------|
| Firebase project `fittoday-2aaff` | Platform | Active | Cannot implement service layer or auth middleware |
| ADR-001 approval | Engineering | Proposed | Cannot begin implementation |
| Existing CMS endpoint test suite | Engineering | Partial | Risk of undetected regressions during service extraction (R-04) |
| iOS developer availability for Phase 4 | Engineering | TBD | Phase 4 cannot start; backend value is still realized through Phases 1-3 |
| Vercel deployment configuration | DevOps | Active | Cannot test CDN caching behavior |
| `sdui-components.yaml` finalized | Engineering | Complete | Zod schemas depend on stable component definitions |

---

## Glossary

| Term | Definition |
|------|-----------|
| **SDUI** | Server-Driven UI. The server describes the entire screen layout as a JSON tree; the client renders it without hardcoded layouts. |
| **BFF** | Backend for Frontend. A dedicated API layer that serves data shaped specifically for a particular client (in this case, mobile apps). |
| **Screen composer** | A pure function that takes service-layer data and returns a complete SDUI screen tree. Lives at `lib/sdui/screens/`. |
| **Builder function** | A pure function that constructs a single SDUI component or action from typed input. Lives at `lib/sdui/builders/`. |
| **Response envelope** | The standard JSON wrapper around every SDUI response, containing `sdui` (the screen tree) and `meta` (requestId, timestamp, versioning). |
| **Discriminated union** | A TypeScript/Zod pattern where a shared `type` field determines which variant of a union is present. Used for both components and actions. |
| **Design token** | A named constant (e.g., `spacing.md`, `color.primary`) that maps to platform-specific values. Ensures consistent styling without hardcoded pixel values. |
| **Schema version** | A semver string in the response `meta` that tracks the SDUI schema format. Enables additive evolution. |
| **Stale-while-revalidate** | A caching strategy where cached content is served immediately while a background re-fetch updates the cache for the next request. |
