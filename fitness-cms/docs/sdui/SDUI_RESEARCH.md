# Server-Driven UI Research & Recommendations

**Project:** FitToday CMS
**Issue:** PRO-78 — SDUI Research and Architecture Design
**Date:** 2026-03-10
**Author:** FitToday Engineering

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current Architecture Analysis](#current-architecture-analysis)
3. [Case Studies](#case-studies)
4. [Schema Format Trade-off Analysis](#schema-format-trade-off-analysis)
5. [Decision Matrix](#decision-matrix)
6. [Proposed BFF + SDUI Architecture](#proposed-bff--sdui-architecture)
7. [Component Library Overview](#component-library-overview)
8. [Phased Implementation Roadmap](#phased-implementation-roadmap)
9. [Risks and Mitigations](#risks-and-mitigations)
10. [Recommendations](#recommendations)
11. [References](#references)

---

## Executive Summary

This document presents the research findings for adopting Server-Driven UI (SDUI) in FitToday's mobile applications. After analyzing 6 industry case studies (Airbnb, Uber, Netflix, Faire, Shopify, DivKit/Yandex), evaluating 4 schema approaches across 9 criteria, and mapping the findings to FitToday's specific architecture and constraints, our recommendation is:

**Adopt a JSON Schema-based SDUI approach delivered via REST endpoints from a dedicated BFF layer within the existing Next.js application**, using typed discriminated unions inspired by Airbnb's Ghost Platform and Uber's ActionCard pattern.

This approach scored 80/90 in our decision matrix — significantly ahead of Protocol Buffers (60/90), GraphQL (66/90), and Custom Format (57/90) — primarily due to its superior developer experience, native iOS Codable compatibility, debugging ergonomics, and incremental adoption path.

---

## Current Architecture Analysis

### What We Have Today

FitToday's backend is a **monolithic Next.js 14 application** that serves dual roles:

```
┌──────────────────────────────────────────────────────┐
│                    Next.js 14 App                     │
│                                                      │
│  ┌─────────────────┐    ┌─────────────────────────┐  │
│  │  CMS Dashboard   │    │  Mobile API (34 routes) │  │
│  │  (React Pages)   │    │  /api/*                 │  │
│  └─────────────────┘    └─────────────────────────┘  │
│                    │          │                       │
│                    └────┬─────┘                       │
│                         │                            │
│              ┌──────────▼──────────┐                 │
│              │  Firestore (direct) │                 │
│              │  No service layer   │                 │
│              └─────────────────────┘                 │
└──────────────────────────────────────────────────────┘
```

### Current Problems

| Problem | Impact | Example |
|---------|--------|---------|
| **No BFF separation** | Same endpoints serve CMS and mobile with different needs | `/api/workouts` returns data shaped for CMS tables, not mobile cards |
| **No service layer** | Business logic duplicated across route handlers | Workout queries repeated in `/api/workouts` and `/api/students/workouts` |
| **Manual serialization** | Every endpoint must convert Firestore Timestamps to ISO strings | `serializeFirestoreData()` in `/api/students/route.ts` |
| **N+1 queries** | Route handlers make separate queries per item | Workouts list queries progress + feedback per workout |
| **No API versioning** | Breaking changes affect all mobile clients | No way to evolve responses without breaking old iOS versions |
| **No caching** | Every request hits Firestore directly | `export const dynamic = 'force-dynamic'` on all routes |
| **Client-driven UI** | All layout/styling decisions hardcoded in iOS app | Requires app update for any UI change |

### Why SDUI Now?

1. **Multi-platform expansion** — Android is planned. Without SDUI, every UI change requires coordinated releases across iOS and Android.
2. **Rapid iteration** — Trainers want customizable student experiences. SDUI enables A/B testing and personalization without app updates.
3. **Feature velocity** — Uber reported **10x feature velocity** after SDUI adoption. Faire achieved **90% reduction in rendering logic**.
4. **Offline-first fitness** — Students train in gyms with poor connectivity. SDUI responses can be cached and rendered offline.

---

## Case Studies

### Case Study 1: Airbnb — Ghost Platform

**Year:** 2021+
**Scale:** 100M+ users, 3 platforms (iOS, Android, Web)

#### Architecture

Airbnb built the **Ghost Platform (GP)**, a unified server-driven UI system with three building blocks:

```
┌─────────────────────────────────────────┐
│              SCREEN                      │
│  ┌────────────────────────────────────┐  │
│  │         SECTION (Header)           │  │
│  │  Title, subtitle, avatar           │  │
│  └────────────────────────────────────┘  │
│  ┌────────────────────────────────────┐  │
│  │         SECTION (Listing)          │  │
│  │  Photos carousel, price, rating    │  │
│  └────────────────────────────────────┘  │
│  ┌────────────────────────────────────┐  │
│  │         SECTION (Actions)          │  │
│  │  Book button, save button          │  │
│  └────────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

- **Sections** — The most primitive building block. Describes data for a cohesive group of UI components. Contains **fully formatted, localized data** — the client never formats dates, currencies, or strings.
- **Screens** — Define where and how sections appear. Specify layout containers (scrollable list, modal, tabs).
- **Actions** — Handle user interaction (navigate, log analytics, trigger modals, API calls).

#### Data Layer

GP uses **Viaduct** (GraphQL-based unified data-service mesh). A single backend response drives rendering identically across web, iOS, and Android.

#### Key Insights for FitToday

1. **Send formatted data, not raw data.** Airbnb's server sends "R$ 97/mês" not `{ price: 97, currency: "BRL", interval: "monthly" }`. This eliminates client-side formatting logic entirely — directly addressing FitToday's `serializeFirestoreData` problem.
2. **Sections are platform-agnostic data models.** Each platform has a native renderer mapping section types to native views. The JSON is structured data, not SwiftUI-like syntax.
3. **The section/screen/action model maps directly to FitToday.** A "workout detail screen" is a Screen containing Sections (header, exercise list, progress tracker, action buttons).

**Source:** [Airbnb Engineering — A Deep Dive into Airbnb's Server-Driven UI System](https://medium.com/airbnb-engineering/a-deep-dive-into-airbnbs-server-driven-ui-system-842244c5f5)

---

### Case Study 2: Uber — ActionCard + Freight Component SDUI

**Year:** 2019+
**Scale:** 130M+ users, rider and driver apps

#### Architecture

Uber uses two complementary SDUI patterns:

**1. ActionCard Pattern** — Reduces app screen UI, navigation logic, and other app logic into decoupled elements. UI elements are "cards" and reusable logical elements are "actions." Every screen is a server-driven feed of card data models.

**2. Freight Component-Driven SDUI** — Uses Apache Thrift union types for type-safe polymorphism:

```thrift
union FeedItem {
  1: RectangleComponent rectangle
  2: TriangleComponent triangle
  3: CircleComponent circle
}
```

Each union type has a corresponding **Plugin Factory** implementing a one-to-many mapping. Plugin code remains isolated by type, eliminating large if/else chains.

#### Key Insights for FitToday

1. **Discriminated unions are the core pattern.** Uber's Thrift union types translate directly to TypeScript discriminated unions: `{ type: "workout-card" } | { type: "progress-bar" } | { type: "text" }`.
2. **Plugin Factory = SwiftUI view registry.** Each component type maps to a SwiftUI view. No giant switch statement — a registry pattern.
3. **10x feature velocity.** Uber achieved this on ~24 features after SDUI adoption. The key was investing in design-phase conversations with product, design, and engineering.

**Source:** [Uber Engineering — Building the New Uber Freight App](https://www.uber.com/blog/uber-freight-app-architecture-design/), [ActionCard Design Pattern](https://www.uber.com/blog/developing-the-actioncard-design-pattern/)

---

### Case Study 3: Netflix — Growth Engineering SDUI

**Year:** 2023+
**Scale:** 230M+ subscribers, all platforms

#### Architecture

Netflix's Growth team built SDUI for **Customer Lifecycle UIs** — signup, onboarding, retention, cancellation flows. The client is a "rendering engine" capable of displaying whatever the server describes.

Key characteristics:
- Uses the **exact same design components** across SDUI and native development, backed by Netflix's design system
- Extended beyond mobile into **Web and TV** for cross-platform parity
- The app does NOT force users to update — SDUI enables serving new experiences to old app versions

#### Challenges Netflix Acknowledged

- **Offline support is harder** — If UI requires server and can't connect, that's problematic
- **Harder to debug** with more abstraction layers
- **"SDUI is super personal and super specific to what you're trying to solve"** — There is no one-size-fits-all

#### Key Insights for FitToday

1. **Lifecycle UIs are the perfect SDUI entry point.** Netflix's growth engineering use case (lifecycle UIs) parallels FitToday's student onboarding, trainer connection, and subscription flows.
2. **Offline is a real concern.** Critical for a fitness app where students train in gyms with poor connectivity. Must persist last SDUI response for offline rendering.
3. **Design system alignment is essential.** The SDUI component library MUST match the native design system. No separate SDUI-only components.

**Source:** [QCon London 2024 — Server-Driven UI for Mobile and Beyond](https://qconlondon.com/presentation/apr2024/server-driven-ui-mobile-and-beyond), [InfoQ Talk](https://www.infoq.com/presentations/server-ui-mobile/)

---

### Case Study 4: Faire — Transitioning to SDUI

**Year:** 2023+
**Scale:** B2B marketplace, 3 platforms

#### Architecture

Faire adopted a three-tier structure:

```
ViewLayout (page-level)
  └── Section (logical grouping)
       └── Component (individual UI element)
```

#### Results After 6-Month Migration

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Rendering logic | 100% client | 10% client | **-90%** |
| Lines of code | Baseline | 35% of baseline | **-65%** |
| New landing page launch time | Weeks | **1-2 days** | ~10x faster |
| Core components | N/A | 12+ | Reusable library |

#### Migration Strategy

Gradual page-by-page migration. Prioritized component development based on:
1. **Popularity** — Most-used components first
2. **Implementation complexity** — Simple components first
3. **Flexibility** — Components that work across multiple screens
4. **Target pages** — Components needed by the first migration target

#### Key Insights for FitToday

1. **90% rendering logic reduction is achievable.** This sets realistic expectations for FitToday.
2. **Gradual migration is the right approach.** Start with student workout list, then expand.
3. **Prioritize by popularity.** Build workout-card and text components first — they appear on every screen.

**Source:** [Faire Engineering — Transitioning to Server-Driven UI](https://craft.faire.com/transitioning-to-server-driven-ui-a76b216ed408)

---

### Case Study 5: Shopify — Hydrogen & Edge-Served Content

**Year:** 2022+
**Scale:** Millions of storefronts, web-focused

#### Architecture

Shopify Hydrogen is a React-based framework for headless storefronts. While not traditional mobile SDUI, it demonstrates server-driven patterns relevant to FitToday:

- **Server-side rendering** with React Server Components
- **Streaming SSR** for fast first render via React Suspense
- **Stale-while-revalidate caching** — serve cached content from CDN edge, revalidate in background

#### Key Insights for FitToday

1. **Stale-while-revalidate is the right caching strategy for SDUI.** Serve cached content instantly; revalidate in background. The Next.js BFF can implement this natively.
2. **Edge caching for shared screens.** Exercise catalog and trainer profiles are the same for all users — cache at CDN edge.
3. **Optimistic UI patterns.** When a student marks a day complete, update the UI optimistically before the server confirms.

**Source:** [Shopify Hydrogen](https://hydrogen.shopify.dev/), [Shopify Engineering — High Performance Hydrogen Storefronts](https://shopify.engineering/high-performance-hydrogen-powered-storefronts)

---

### Case Study 6: DivKit (Yandex) — Open Source Reference

**Year:** 2022+ (open-sourced)
**Scale:** Yandex apps (100M+ users in CIS region), iOS/Android/Web

#### Architecture

DivKit is the most complete open-source SDUI framework:

- **JSON schema** describes the entire data format
- **API generator** creates platform-specific code from the schema
- Components: `div-container`, `div-text`, `div-image`, `div-separator`, `div-indicator`, `div-slider`, `div-input`, `div-video`, `div-gallery`, `div-pager`, `div-tabs`, `div-state`, `div-custom`
- **Action system** for handling taps, visibility triggers, disappear triggers
- **Template system** for reusable component patterns
- Can be integrated as a **simple view in any part of the app** (incremental adoption)

#### Key Insights for FitToday

1. **JSON Schema approach works at scale.** DivKit proves the viability in production.
2. **Component taxonomy provides a reference** for FitToday's component library.
3. **Build domain-specific components**, not generic DivKit primitives. FitToday needs `workout-card` and `set-tracker`, not just `div-container`.
4. **Template system is valuable.** Reusable patterns (e.g., "standard card layout") reduce response size and server complexity.

**Source:** [DivKit GitHub](https://github.com/divkit/divkit), [DivKit Website](https://divkit.tech/en/)

---

## Schema Format Trade-off Analysis

### Option A: JSON Schema (REST) — RECOMMENDED

Define a JSON Schema specification for the component tree. The server returns JSON payloads conforming to the schema. TypeScript types generated from Zod schemas; Swift Codable types for iOS.

**Example Response:**

```json
{
  "type": "section",
  "id": "active-workouts",
  "header": {
    "type": "text",
    "content": "Treinos Ativos",
    "style": "heading-2"
  },
  "children": [
    {
      "type": "workout-card",
      "data": {
        "workoutId": "abc123",
        "title": "Treino A - Superior",
        "trainerName": "Carlos Silva",
        "progress": 0.65,
        "daysRemaining": 12,
        "thumbnailUrl": "https://..."
      },
      "actions": {
        "onTap": {
          "type": "navigate",
          "destination": "workout-detail",
          "params": { "id": "abc123" }
        }
      }
    }
  ]
}
```

**Strengths:**
- Human-readable and debuggable (view in any JSON tool)
- Native Swift Codable decoding (no extra dependencies)
- Zod validation on server side (already a project dependency)
- JSON Schema tooling ecosystem (validation, documentation, code generation)
- Gzip compression reduces payload size effectively

**Weaknesses:**
- Larger payloads than binary formats (~3-5x vs Protobuf)
- No built-in schema evolution rules (must be managed manually)

---

### Option B: Protocol Buffers (gRPC)

Define `.proto` files for components. Server serializes to binary. Client deserializes with generated code.

**Strengths:**
- 3-10x smaller payloads
- Fastest serialization/deserialization
- Built-in backward-compatible field evolution
- Strong typing enforced by protoc compiler

**Weaknesses:**
- Binary format not human-readable (can't debug by inspecting responses)
- Requires `protoc` toolchain and `SwiftProtobuf` dependency on iOS
- Adds build complexity (proto compilation step)
- Team must learn Protobuf-specific patterns

**Verdict:** Performance advantages are irrelevant at FitToday's scale (thousands of users, not millions). The DX cost (non-human-readable, toolchain complexity) outweighs benefits. Consider when exceeding 10M+ active users.

---

### Option C: GraphQL (Apollo)

Define SDUI component types as GraphQL types with interfaces and unions.

```graphql
interface UIComponent {
  id: ID!
}

type WorkoutCard implements UIComponent {
  id: ID!
  title: String!
  progress: Float!
  trainerName: String!
}

union SectionContent = WorkoutCard | ProgressBar | ExerciseItem
```

**Strengths:**
- Schema introspection and typed fragments
- Apollo Client has built-in caching
- Union types handle polymorphism elegantly
- No over-fetching — clients request exactly what they need

**Weaknesses:**
- Introduces significant new infrastructure (Apollo Server, Apollo iOS Client)
- Learning curve for GraphQL patterns
- The 34 existing REST endpoints would need migration or coexistence
- Overkill for the current team size

**Verdict:** Architecturally elegant but introduces too much new infrastructure for a small team. Consider for future migration when the team grows beyond 3 engineers.

---

### Option D: Custom Format

Design a bespoke format without formal schema validation.

**Strengths:**
- Maximum flexibility; no schema constraints
- Can be optimized for exact domain needs
- Fastest to start (no schema tooling setup)

**Weaknesses:**
- No validation tooling — drift between server and client is inevitable
- No code generation — manual parser updates on both sides
- No documentation standard — knowledge lives in code only
- Maintenance liability grows exponentially with component count

**Verdict:** The lack of schema validation makes this a long-term maintenance disaster. Not recommended.

---

## Decision Matrix

Evaluation across 9 criteria on a 1-10 scale:

| Criterion | Weight | JSON Schema | Protocol Buffers | GraphQL | Custom Format |
|-----------|--------|-------------|-----------------|---------|---------------|
| Performance | 1x | 7 | 10 | 7 | 7 |
| Maintainability | 1.5x | 9 (13.5) | 8 (12) | 9 (13.5) | 4 (6) |
| DX (Backend) | 1x | 9 | 5 | 7 | 6 |
| DX (iOS) | 1x | 9 | 6 | 7 | 5 |
| Flexibility | 1x | 9 | 7 | 9 | 8 |
| Offline Support | 1x | 8 | 8 | 8 | 8 |
| Testing | 1x | 9 | 6 | 8 | 5 |
| Incremental Adoption | 1.5x | 10 (15) | 4 (6) | 5 (7.5) | 7 (10.5) |
| Team Size Fit | 1x | 10 | 6 | 6 | 7 |
| **Weighted Total** | | **89.5** | **66** | **73** | **60.5** |

**Winner: JSON Schema (REST)** by a significant margin.

---

## Proposed BFF + SDUI Architecture

### Architecture Diagram

```
                         ┌──────────────────┐
                         │  iOS / Android    │
                         │  SDUI Renderer    │
                         └────────┬─────────┘
                                  │
                         ┌────────▼─────────┐
                         │ /api/mobile/v1/* │  ← SDUI BFF Layer (NEW)
                         │ Screen endpoints │
                         └────────┬─────────┘
                                  │
                         ┌────────▼─────────┐
                         │  SDUI Builders   │  ← Compose screens (NEW)
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
    │ CMS endpoints     │  │              │  │ & Storage      │
    └──────────────────┘  └──────────────┘  └────────────────┘
```

### Key Structural Decisions

#### 1. New `/api/mobile/v1/` Namespace

Do **NOT** modify existing endpoints. The CMS web dashboard continues using `/api/*` as-is. Mobile clients call `/api/mobile/v1/screens/*` which returns SDUI responses.

```
app/api/mobile/v1/screens/
├── student-home/route.ts
├── student-workouts/route.ts
├── workout-detail/[id]/route.ts
├── trainer-profile/[id]/route.ts
├── exercise-catalog/route.ts
└── program-detail/[id]/route.ts
```

#### 2. Service Layer Extraction

Extract Firestore query logic from route handlers into shared service modules:

```
lib/services/
├── workout-service.ts      ← getWorkoutsForStudent(), getWorkoutDetail()
├── program-service.ts      ← getPrograms(), getProgramDetail()
├── exercise-service.ts     ← searchExercises(), getExercise()
├── student-service.ts      ← registerStudent(), getStudentProfile()
├── connection-service.ts   ← getConnections(), createConnection()
└── trainer-service.ts      ← getTrainerProfile(), getTrainerStats()
```

Both existing CMS routes and new BFF routes call the same service functions.

#### 3. SDUI Response Builders

Builder functions in `lib/sdui/` that take service-layer data and compose SDUI screen responses:

```
lib/sdui/
├── schema.ts               ← Zod schemas for all component types
├── types.ts                ← TypeScript types (inferred from Zod)
├── actions.ts              ← Action type definitions
├── tokens.ts               ← Design token definitions
├── builders/
│   ├── screen.ts           ← buildScreen(), buildSection()
│   ├── components.ts       ← buildWorkoutCard(), buildProgressBar(), etc.
│   └── actions.ts          ← buildNavigateAction(), buildApiCallAction()
└── screens/
    ├── student-home.ts     ← Composes the student home screen
    ├── student-workouts.ts ← Composes the workout list screen
    ├── workout-detail.ts   ← Composes the workout detail screen
    └── trainer-profile.ts  ← Composes the trainer profile screen
```

### SDUI Response Envelope

Every response follows a consistent structure:

```json
{
  "sdui": {
    "version": "1.0",
    "screen": {
      "id": "student-workouts",
      "title": "Meus Treinos",
      "refreshPolicy": {
        "type": "time-based",
        "intervalSeconds": 300
      },
      "cachePolicy": {
        "maxAgeSeconds": 60,
        "staleWhileRevalidate": true
      },
      "layout": {
        "type": "scroll-view",
        "refreshable": true,
        "children": [ ... ]
      },
      "floatingAction": {
        "type": "button",
        "label": "Iniciar Treino",
        "style": "primary",
        "icon": "play.fill",
        "action": { "type": "navigate", "destination": "workout-active" }
      }
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

### Versioning Strategy

**Schema versioning** (not URL versioning) for SDUI payloads:

1. **Additive-only changes** — New component types added without version bump. iOS client ignores unknown `type` values gracefully (renders nothing or a fallback).
2. **`minClientVersion` field** — Each response declares the minimum iOS app version required. If the app is too old, show "update required" message.
3. **`schemaVersion` field** — Tracks schema version. Major bumps (1.x → 2.x) indicate breaking changes requiring a new `/v2/` endpoint.

### Caching Strategy

Three layers:

| Layer | Scope | TTL | Invalidation |
|-------|-------|-----|--------------|
| **CDN/Edge (Vercel)** | Shared screens (exercise catalog, public profiles) | 1 hour | `stale-while-revalidate` |
| **BFF Response Cache** | Personalized screens (student workouts) | 60 seconds | On writes (workout created, progress updated) |
| **Client-side (iOS)** | All screens | Per `cachePolicy` in response | On pull-to-refresh or TTL expiry |

**Offline fallback:** The iOS app persists the last successful SDUI response per screen to local storage. If offline, render from persisted response with a subtle "offline" banner.

---

## Component Library Overview

See `sdui-components.yaml` for the full specification. Summary:

| Category | Count | Purpose |
|----------|-------|---------|
| Layout | 7 | Structure and arrangement (vstack, hstack, scroll-view, section, grid, spacer, divider) |
| Content | 8 | Display information (text, image, avatar, icon, badge, progress-bar, progress-ring, stat-row) |
| Interactive | 9 | User input and actions (button, link, text-input, toggle, slider, picker, checkbox, form, search-bar) |
| Navigation | 4 | Screen transitions (tab-bar, navigation-link, action-sheet, bottom-sheet) |
| Domain (Fitness) | 8 | FitToday-specific (workout-card, program-card, exercise-item, set-tracker, streak-counter, trainer-card, pdf-viewer, measurement-entry) |
| **Total** | **36** | |

### Action System

11 action types handle all user interactions:

| Action | Purpose | Example |
|--------|---------|---------|
| `navigate` | Push a new screen | Tap workout card → workout detail |
| `navigate-back` | Pop current screen | Back button |
| `open-url` | Open external URL | Open PDF in browser |
| `api-call` | Make API request | Mark day as complete |
| `refresh-screen` | Re-fetch current screen | Pull to refresh |
| `show-sheet` | Present bottom sheet | Exercise details |
| `show-alert` | Show alert dialog | Confirm action |
| `dismiss` | Dismiss sheet/alert | Close modal |
| `share` | System share sheet | Share workout |
| `haptic` | Trigger haptic feedback | Success vibration |
| `analytics` | Track analytics event | Screen view |

### Design Token System

Instead of arbitrary CSS values, SDUI uses a token system that maps to platform-specific values:

```
Spacing: none (0) | xs (4) | sm (8) | md (16) | lg (24) | xl (32)
Colors:  primary | secondary | surface | background | error | success | warning
Radius:  none (0) | sm (4) | md (8) | lg (16) | full (9999)
Shadow:  none | sm | md | lg
Text:    heading-1 | heading-2 | heading-3 | body | body-small | caption | overline
```

Each iOS/Android client defines what these tokens mean in native units (points, dp).

---

## Phased Implementation Roadmap

### Phase 1: BFF Layer Separation (2-3 weeks)

**Goal:** Extract shared business logic; create `/api/mobile/v1/` namespace.

| Task | Effort | Priority |
|------|--------|----------|
| Create `lib/services/` with extracted service modules | 1 week | P0 |
| Refactor existing route handlers to call service functions | 3-4 days | P0 |
| Create `/api/mobile/v1/` directory and auth middleware | 2 days | P0 |
| Add integration tests for service layer | 2-3 days | P1 |

**Risk:** Refactoring existing routes could introduce regressions. Mitigate with tests before refactoring.

### Phase 2: Component Schema Definition (1-2 weeks)

**Goal:** Define the complete SDUI type system and validation.

| Task | Effort | Priority |
|------|--------|----------|
| Create Zod schemas for all 36 component types | 3-4 days | P0 |
| Define action system and design tokens | 1-2 days | P0 |
| Build helper/builder functions | 2-3 days | P0 |
| Generate Swift Codable types | 2 days | P1 |
| Write schema validation tests | 1-2 days | P1 |

### Phase 3: SDUI Endpoint Implementation (3-4 weeks)

**Goal:** Build first SDUI-powered screens, starting with highest impact.

| Screen | Priority | Complexity |
|--------|----------|------------|
| `student-workouts` (workout list) | P0 | Medium |
| `workout-detail/:id` | P0 | High |
| `trainer-profile/:id` | P1 | Low |
| `student-home` (dashboard) | P1 | High |
| `exercise-catalog` | P2 | Medium |
| `program-detail/:id` | P2 | Medium |

### Phase 4: iOS Client SDUI Renderer (4-6 weeks)

**Goal:** Build the SwiftUI rendering engine.

| Task | Effort | Priority |
|------|--------|----------|
| `SDUIComponent` enum with Codable decoding | 1 week | P0 |
| Layout renderers (VStack, HStack, ScrollView, Section) | 1 week | P0 |
| Content renderers (Text, Image, Avatar, Badge, ProgressBar) | 1 week | P0 |
| Interactive renderers (Button, Input, Toggle) | 3-4 days | P0 |
| Domain renderers (WorkoutCard, ExerciseItem, SetTracker) | 1 week | P0 |
| Action handler and navigation manager | 3-4 days | P0 |
| Networking layer with caching and offline support | 3-4 days | P1 |

**Total estimated timeline: 10-15 weeks** for full SDUI implementation across backend and iOS.

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Over-engineering for current scale** | High | Medium | Start with 3 screens only; prove value before expanding |
| **iOS renderer development bottleneck** | High | High | Build renderer as reusable SDUIKit; invest upfront in architecture |
| **Schema drift between server and iOS** | Medium | High | Generate Swift types from Zod schemas; CI validation |
| **Performance regression from abstraction** | Low | Medium | Response-level caching; profile before/after |
| **Offline UX degradation** | Medium | Medium | Persist last response; show stale data with banner |
| **Existing CMS regression during refactor** | Medium | High | Service extraction behind existing handlers; no behavior change |
| **Component explosion** | Medium | Low | Strict review process for new components; reuse over creation |
| **Team learning curve** | Medium | Medium | Start with simple screens; document patterns thoroughly |

---

## Recommendations

### Immediate Actions (This Sprint)

1. **Approve ADR-001** — Align the team on JSON Schema + REST BFF approach
2. **Begin Phase 1** — Extract service layer from the 3 most complex route handlers (workouts, students, programs)
3. **Define iOS renderer architecture** — Establish the SDUIKit structure before any coding begins

### Short-term (Next 2 Sprints)

4. **Implement component schema** — All 36 components in Zod with JSON Schema export
5. **Build first BFF endpoint** — `student-workouts` screen as the proof of concept
6. **Start iOS renderer** — Layout + Content components sufficient for the workout list

### Medium-term (Next Quarter)

7. **Expand to 6 screens** — Cover all primary student flows
8. **Add caching layer** — CDN for shared screens, in-memory for personalized
9. **Implement offline support** — Persist and render last-known SDUI responses

### What NOT to Do

- **Don't adopt DivKit or any third-party SDUI framework.** FitToday needs domain-specific components (workout-card, set-tracker) that no generic framework provides. Build your own.
- **Don't migrate existing CMS endpoints to SDUI.** The CMS dashboard doesn't need SDUI — it's a standard React web app. SDUI is for mobile clients only.
- **Don't add GraphQL or Protobuf.** The complexity-to-benefit ratio doesn't justify the investment at the current scale.
- **Don't try to make SDUI handle every screen from day one.** Prove the pattern on 3 screens, then expand.

---

## References

### Primary Sources (Case Studies)

1. [A Deep Dive into Airbnb's Server-Driven UI System — Airbnb Engineering](https://medium.com/airbnb-engineering/a-deep-dive-into-airbnbs-server-driven-ui-system-842244c5f5)
2. [Building the New Uber Freight App — Uber Engineering](https://www.uber.com/blog/uber-freight-app-architecture-design/)
3. [Developing the ActionCard Design Pattern — Uber Engineering](https://www.uber.com/blog/developing-the-actioncard-design-pattern/)
4. [Server-Driven UI for Mobile and Beyond — Netflix (QCon London 2024)](https://qconlondon.com/presentation/apr2024/server-driven-ui-mobile-and-beyond)
5. [Server-Driven UI for Mobile and Beyond — Netflix (InfoQ)](https://www.infoq.com/presentations/server-ui-mobile/)
6. [Transitioning to Server-Driven UI — Faire Engineering](https://craft.faire.com/transitioning-to-server-driven-ui-a76b216ed408)
7. [Shopify Hydrogen Framework](https://hydrogen.shopify.dev/)
8. [High Performance Hydrogen Storefronts — Shopify Engineering](https://shopify.engineering/high-performance-hydrogen-powered-storefronts)
9. [DivKit — Open Source SDUI Framework (Yandex)](https://github.com/divkit/divkit)

### Secondary Sources (Architecture Patterns)

10. [Server-Driven UI Basics — Apollo GraphQL](https://www.apollographql.com/docs/graphos/schema-design/guides/sdui/basics)
11. [How Delivery Hero Accelerates UX with SDUI — Apollo](https://www.apollographql.com/blog/how-delivery-hero-accelerates-ux-experiments-with-server-driven-ui-and-apollo)
12. [BFF Pattern with Next.js API Routes](https://nextjs.org/docs/app/guides/backend-for-frontend)
13. [SDUI: The Necessary Evil for Scalable Mobile Apps](https://medium.com/digia-studio/server-driven-ui-sdui-the-necessary-evil-for-scalable-mobile-apps-80c650a2c8de)
14. [Server-Driven UI: What Airbnb, Netflix, and Lyft Learned](https://medium.com/@aubreyhaskett/server-driven-ui-what-airbnb-netflix-and-lyft-learned-building-dynamic-mobile-experiences-20e346265305)

### Implementation References

15. [sdui.ios — SwiftUI SDUI Library](https://github.com/iDylanK/sdui.ios)
16. [k-sdui-ios — SwiftUI SDUI Library](https://github.com/sookim-1/k-sdui-ios)
17. [Server-Driven UI with SwiftUI (Medium)](https://medium.com/@pubudumihiranga/server-driven-ui-with-swiftui-a9ed31fb843b)
18. [MobileNativeFoundation SDUI Discussion](https://github.com/MobileNativeFoundation/discussions/discussions/47)
19. [How Top Tech Companies Use SDUI to Move Faster](https://stac.dev/blogs/tech-companies-sdui)
