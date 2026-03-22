# Technical Specification

# FitToday SDUI + BFF Architecture

**Project Name:** FitToday SDUI + BFF Architecture
**Version:** 1.0
**Date:** 2026-03-10
**Author:** FitToday Engineering
**Status:** Draft

---

## Overview

### Problem Statement

FitToday's backend is a monolithic Next.js 14 application where 34 REST route handlers serve both the CMS dashboard and the iOS mobile app. Business logic is duplicated across handlers, there is no service layer, no caching, no API versioning, and all UI decisions are hardcoded in the iOS app — requiring App Store review for every visual change.

### Proposed Solution

Implement a JSON Schema-based Server-Driven UI system delivered via a dedicated BFF (Backend for Frontend) layer at `/api/mobile/v1/screens/*`. The server will control layout, components, and navigation of mobile screens through a typed component tree validated by Zod schemas.

### Goals

- Ship mobile UI changes without app updates (target: <1 hour from code to production)
- Reduce iOS rendering logic by 50%+ for SDUI-powered screens
- Enable cross-platform parity (iOS + future Android) from a single backend
- Extract a reusable service layer improving testability and code reuse
- Support offline rendering via cached SDUI responses

---

## Scope

### In Scope

- Service layer extraction from existing route handlers into `lib/services/`
- SDUI type system definition with Zod schemas for 36 components
- SDUI response builder functions in `lib/sdui/`
- 6 BFF screen endpoints under `/api/mobile/v1/screens/`
- 3-layer caching strategy (CDN, BFF, client)
- Schema versioning with `minClientVersion` support
- Mobile auth middleware for BFF endpoints
- Unit and integration tests for all new code

### Out of Scope

- iOS/Android SDUI renderer (SDUIKit) — separate feature
- Migration of existing CMS endpoints to SDUI
- GraphQL or Protocol Buffer alternatives
- Real-time Firestore listeners in BFF (future consideration)
- Admin dashboard changes

---

## Requirements

### Functional Requirements

#### FR-001: Service Layer Extraction [MUST]

Extract business logic from existing route handlers into shared service modules under `lib/services/`. Each service encapsulates Firestore queries, data transformation, and business rules for a domain entity.

**Acceptance Criteria:**

- 6 service modules created (workout, program, student, exercise, trainer, connection)
- Existing route handlers refactored to delegate to services with no behavior change
- All services accept typed parameters and return typed results
- Timestamp serialization handled at the service boundary (not per-endpoint)

#### FR-002: SDUI Schema Definition [MUST]

Define the complete SDUI type system using Zod schemas with discriminated unions (`type` field). Generate TypeScript types via `z.infer<>` and export JSON Schema via `zod-to-json-schema`.

**Acceptance Criteria:**

- 36 component types defined with Zod schemas
- 11 action types defined as discriminated union
- Design token system (spacing, colors, radius, shadow, text styles) codified
- Response envelope schema including screen metadata, cache policy, and error states
- JSON Schema exported and validated against Draft 2020-12

#### FR-003: SDUI Builder Functions [MUST]

Create builder functions that compose SDUI component trees from service-layer data. Builders enforce type safety and provide a clean API for screen composition.

**Acceptance Criteria:**

- `buildScreen()`, `buildSection()`, `buildAction()` helper functions
- Per-component builders (`buildWorkoutCard()`, `buildProgressBar()`, etc.)
- Screen composers for each endpoint (`buildStudentWorkoutsScreen()`, etc.)
- All builders validate output against Zod schemas

#### FR-004: BFF Screen Endpoints [MUST]

Implement 6 SDUI screen endpoints that compose complete screen responses from service data via builders.

**Acceptance Criteria:**

- `GET /api/mobile/v1/screens/student-workouts` returns SDUI screen
- `GET /api/mobile/v1/screens/workout-detail/:id` returns SDUI screen
- `GET /api/mobile/v1/screens/student-home` returns SDUI screen
- `GET /api/mobile/v1/screens/trainer-profile/:id` returns SDUI screen
- `GET /api/mobile/v1/screens/exercise-catalog` returns SDUI screen
- `GET /api/mobile/v1/screens/program-detail/:id` returns SDUI screen
- All endpoints authenticated via Firebase Bearer tokens
- All responses conform to the SDUI envelope schema

#### FR-005: Caching Strategy [SHOULD]

Implement 3-layer caching to minimize Firestore reads and improve response times.

**Acceptance Criteria:**

- CDN cache headers on shared screens (exercise catalog, public profiles)
- BFF-level in-memory cache for personalized screens with 60s TTL
- `cachePolicy` field in every SDUI response guiding client-side caching
- Cache invalidation on write operations (workout created, progress updated)

#### FR-006: Schema Versioning [MUST]

Implement schema versioning that supports additive evolution without breaking old clients.

**Acceptance Criteria:**

- `schemaVersion` field in response meta (semver format)
- `minClientVersion` field in response meta
- Unknown component types gracefully ignored by clients (documented contract)
- Version bump process documented

---

### Non-Functional Requirements

#### NFR-001: Performance [MUST]

SDUI endpoints must respond fast enough that users perceive no latency increase versus current REST API.

**Target:**

- p95 response time < 200ms for all SDUI endpoints
- SDUI JSON payload size < 50KB per screen (before gzip)
- Gzip compression enabled on all responses

#### NFR-002: Security [MUST]

BFF endpoints must enforce the same security model as existing endpoints.

**Requirements:**

- Firebase Auth Bearer token verification on all `/api/mobile/v1/*` routes
- Resource-level authorization (students can only access their own data)
- Rate limiting: 100 requests/minute per user
- No sensitive data in SDUI responses (no passwords, tokens, internal IDs)

#### NFR-003: Offline Support [SHOULD]

SDUI responses must be cacheable for offline rendering.

**Target:**

- JSON responses are deterministic (same input = same output for caching)
- No external URL dependencies that break offline (signed URLs with long TTL)
- `cachePolicy` in responses guides client persistence decisions

#### NFR-004: Maintainability [MUST]

Code must be well-tested and maintainable for a small team.

**Requirements:**

- 80%+ test coverage for service layer and SDUI builders
- Zod schemas serve as single source of truth (types derived, not duplicated)
- Clear separation: services (data) → builders (SDUI composition) → routes (HTTP)

---

## Technical Approach

### Architecture Overview

```
┌─────────────────┐
│  Mobile Client   │
│  (iOS/Android)   │
└────────┬────────┘
         │ GET /api/mobile/v1/screens/{screenId}
         │ Authorization: Bearer <firebase-token>
┌────────▼────────┐
│  BFF Route       │  app/api/mobile/v1/screens/{screenId}/route.ts
│  Handler         │  - Verifies auth
│                  │  - Calls service layer
│                  │  - Calls SDUI screen builder
│                  │  - Returns SDUI envelope
└────────┬────────┘
         │
┌────────▼────────┐
│  SDUI Screen     │  lib/sdui/screens/{screenId}.ts
│  Builder         │  - Receives service data
│                  │  - Composes component tree
│                  │  - Returns validated SDUIScreen
└────────┬────────┘
         │
┌────────▼────────┐
│  Service Layer   │  lib/services/{domain}-service.ts
│                  │  - Queries Firestore
│                  │  - Applies business rules
│                  │  - Returns typed domain objects
└────────┬────────┘
         │
┌────────▼────────┐
│  Firestore       │
│  Firebase Auth   │
│  Firebase Storage│
└─────────────────┘
```

### Key Technologies

- **Zod 3.22+**: Schema definition and runtime validation for all SDUI types
- **zod-to-json-schema**: Export JSON Schema from Zod for documentation and client codegen
- **firebase-admin 13.6+**: Firestore queries, Auth verification, Storage signed URLs
- **Next.js 14 Route Handlers**: BFF endpoints as API routes

### Components

#### Component 1: Service Layer (`lib/services/`)

**Purpose:** Encapsulate all Firestore queries and business logic in reusable, testable modules.

**Responsibilities:**

- Query Firestore collections with proper filtering and pagination
- Transform Firestore documents into typed domain objects
- Handle Timestamp serialization at the boundary
- Enforce business rules (plan limits, access control)

**Interfaces:**

```typescript
// lib/services/workout-service.ts
export interface WorkoutServiceResult {
  workouts: SerializedWorkout[];
  total: number;
  hasMore: boolean;
}

export async function getWorkoutsForStudent(
  studentId: string,
  options?: { status?: string; limit?: number; cursor?: string },
): Promise<WorkoutServiceResult>;

export async function getWorkoutDetail(
  workoutId: string,
  requesterId: string,
): Promise<SerializedWorkout | null>;
```

```typescript
// lib/services/program-service.ts
export async function getPrograms(options?: {
  trainerId?: string;
  category?: string;
  status?: string;
  limit?: number;
}): Promise<{ programs: SerializedProgram[]; total: number; hasMore: boolean }>;

export async function getProgramDetail(
  programId: string,
): Promise<SerializedProgram | null>;
```

#### Component 2: SDUI Schema (`lib/sdui/schema.ts`)

**Purpose:** Define all 36 component types as Zod schemas with discriminated unions.

**Responsibilities:**

- Define component schemas with full property typing
- Define action schemas (11 types)
- Define design token enums
- Define response envelope schema
- Export TypeScript types via `z.infer<>`

**Core Pattern:**

```typescript
// lib/sdui/schema.ts
import { z } from "zod";

// Design Tokens
export const SpacingToken = z.enum(["none", "xs", "sm", "md", "lg", "xl"]);
export const ColorToken = z.enum([
  "primary",
  "secondary",
  "surface",
  "background",
  "error",
  "success",
  "warning",
  "info",
  "muted",
  "accent",
  "on-primary",
  "on-secondary",
  "on-surface",
  "on-background",
]);
export const TextStyleToken = z.enum([
  "heading-1",
  "heading-2",
  "heading-3",
  "body",
  "body-bold",
  "body-small",
  "caption",
  "overline",
]);

// Action System (discriminated union)
export const SDUIAction = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("navigate"),
    destination: z.string(),
    params: z.record(z.string()).optional(),
  }),
  z.object({ type: z.literal("navigate-back") }),
  z.object({
    type: z.literal("open-url"),
    url: z.string().url(),
    inApp: z.boolean().default(true),
  }),
  z.object({
    type: z.literal("api-call"),
    method: z.enum(["GET", "POST", "PUT", "DELETE"]),
    endpoint: z.string(),
    body: z.record(z.unknown()).optional(),
  }),
  z.object({ type: z.literal("refresh-screen") }),
  z.object({ type: z.literal("dismiss") }),
  z.object({
    type: z.literal("share"),
    content: z.string(),
    url: z.string().url().optional(),
  }),
  z.object({
    type: z.literal("haptic"),
    style: z.enum(["light", "medium", "heavy", "success", "error"]),
  }),
  z.object({
    type: z.literal("analytics"),
    event: z.string(),
    params: z.record(z.string()).optional(),
  }),
  // show-sheet and show-alert use z.lazy() for recursive component references
]);

// Component base (recursive via z.lazy)
export const SDUIComponent: z.ZodType<SDUIComponentType> = z.lazy(() =>
  z.discriminatedUnion("type", [
    TextComponent,
    ImageComponent,
    VStackComponent,
    HStackComponent,
    // ... all 36 component schemas
    WorkoutCardComponent,
    ExerciseItemComponent,
  ]),
);

// Screen envelope
export const SDUIScreen = z.object({
  id: z.string(),
  title: z.string(),
  layout: SDUIComponent,
  refreshPolicy: z
    .object({
      type: z.enum(["time-based", "event-based", "manual"]),
      intervalSeconds: z.number().optional(),
    })
    .optional(),
  cachePolicy: z
    .object({
      maxAgeSeconds: z.number(),
      staleWhileRevalidate: z.boolean().default(false),
    })
    .optional(),
  emptyState: z
    .object({
      icon: z.string().optional(),
      title: z.string(),
      message: z.string().optional(),
    })
    .optional(),
  errorState: z
    .object({
      title: z.string(),
      message: z.string().optional(),
      retryAction: SDUIAction.optional(),
    })
    .optional(),
});

// Response envelope
export const SDUIResponse = z.object({
  sdui: z.object({
    version: z.string(),
    screen: SDUIScreen,
  }),
  meta: z.object({
    requestId: z.string(),
    timestamp: z.string().datetime(),
    schemaVersion: z.string(),
    minClientVersion: z.string().optional(),
  }),
});

// Inferred types
export type SDUIComponentType = z.infer<typeof SDUIComponent>;
export type SDUIScreenType = z.infer<typeof SDUIScreen>;
export type SDUIResponseType = z.infer<typeof SDUIResponse>;
```

#### Component 3: SDUI Builders (`lib/sdui/builders/`)

**Purpose:** Compose validated SDUI component trees from service-layer data.

```typescript
// lib/sdui/builders/components.ts
import { type SDUIComponentType } from "../schema";

export function buildText(
  content: string,
  style?: TextStyleToken,
  color?: ColorToken,
): SDUIComponentType {
  return { type: "text", content, textStyle: style ?? "body", color };
}

export function buildWorkoutCard(
  workout: SerializedWorkout,
): SDUIComponentType {
  return {
    type: "workout-card",
    data: {
      workoutId: workout.id,
      title: workout.title,
      trainerName: workout.trainerName,
      progress: workout.percentComplete ?? 0,
      totalDays: workout.totalDays,
      completedDays: workout.completedDaysCount,
      status: workout.status,
    },
    actions: {
      onTap: {
        type: "navigate",
        destination: "workout-detail",
        params: { id: workout.id },
      },
    },
  };
}
```

```typescript
// lib/sdui/screens/student-workouts.ts
import { type SDUIScreenType } from "../schema";
import { type WorkoutServiceResult } from "../../services/workout-service";
import {
  buildWorkoutCard,
  buildText,
  buildSection,
} from "../builders/components";

export function buildStudentWorkoutsScreen(
  data: WorkoutServiceResult,
  studentName: string,
): SDUIScreenType {
  const activeWorkouts = data.workouts.filter((w) => w.status === "active");
  const completedWorkouts = data.workouts.filter(
    (w) => w.status === "completed",
  );

  return {
    id: "student-workouts",
    title: "Meus Treinos",
    refreshPolicy: { type: "time-based", intervalSeconds: 300 },
    cachePolicy: { maxAgeSeconds: 60, staleWhileRevalidate: true },
    layout: {
      type: "scroll-view",
      refreshable: true,
      children: [
        {
          type: "section",
          id: "active-workouts",
          header: buildText(
            `Treinos Ativos (${activeWorkouts.length})`,
            "heading-2",
          ),
          children: activeWorkouts.map((w) => buildWorkoutCard(w)),
        },
        ...(completedWorkouts.length > 0
          ? [
              {
                type: "section" as const,
                id: "completed-workouts",
                header: buildText("Concluidos", "heading-2", "muted"),
                collapsible: true,
                children: completedWorkouts.map((w) => buildWorkoutCard(w)),
              },
            ]
          : []),
      ],
    },
    emptyState: {
      icon: "dumbbell",
      title: "Nenhum treino ainda",
      message: "Seu personal trainer enviara treinos por aqui.",
    },
    errorState: {
      title: "Erro ao carregar treinos",
      retryAction: { type: "refresh-screen" },
    },
  };
}
```

### API Design

#### Endpoint 1: GET /api/mobile/v1/screens/student-workouts

**Method:** GET
**Purpose:** Returns the student workout list screen

**Request:**

```
GET /api/mobile/v1/screens/student-workouts?status=active&limit=20
Authorization: Bearer <firebase-id-token>
```

**Response:**

```json
{
  "sdui": {
    "version": "1.0",
    "screen": {
      "id": "student-workouts",
      "title": "Meus Treinos",
      "refreshPolicy": { "type": "time-based", "intervalSeconds": 300 },
      "cachePolicy": { "maxAgeSeconds": 60, "staleWhileRevalidate": true },
      "layout": {
        "type": "scroll-view",
        "refreshable": true,
        "children": [
          {
            "type": "section",
            "id": "active-workouts",
            "header": {
              "type": "text",
              "content": "Treinos Ativos (2)",
              "textStyle": "heading-2"
            },
            "children": [
              {
                "type": "workout-card",
                "data": {
                  "workoutId": "w1",
                  "title": "Treino A - Superior",
                  "trainerName": "Carlos Silva",
                  "progress": 0.65,
                  "totalDays": 30,
                  "completedDays": 19,
                  "status": "active"
                },
                "actions": {
                  "onTap": {
                    "type": "navigate",
                    "destination": "workout-detail",
                    "params": { "id": "w1" }
                  }
                }
              }
            ]
          }
        ]
      },
      "emptyState": { "icon": "dumbbell", "title": "Nenhum treino ainda" }
    }
  },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2026-03-10T14:30:00Z",
    "schemaVersion": "1.0.0"
  }
}
```

#### Endpoint 2: GET /api/mobile/v1/screens/workout-detail/:id

**Method:** GET
**Purpose:** Returns workout detail with exercises, progress, and PDF viewer

**Request:**

```
GET /api/mobile/v1/screens/workout-detail/w1
Authorization: Bearer <firebase-id-token>
```

**Response:** SDUI screen containing sections for: header (title, trainer info), progress bar, exercise list (exercise-item components), PDF viewer component, and feedback button.

#### Endpoint 3: GET /api/mobile/v1/screens/student-home

**Method:** GET
**Purpose:** Returns the student dashboard/home screen

**Response:** SDUI screen with: greeting header, streak counter, today's workout card, recent progress stats, trainer card, and quick action buttons.

#### Endpoint 4: GET /api/mobile/v1/screens/trainer-profile/:id

**Method:** GET
**Purpose:** Returns a trainer's public profile

**Response:** SDUI screen with: cover photo, avatar, bio, specialties badges, stats (rating, students, reviews), program cards grid, review list.

#### Endpoint 5: GET /api/mobile/v1/screens/exercise-catalog

**Method:** GET
**Purpose:** Returns the browseable exercise library

**Request:**

```
GET /api/mobile/v1/screens/exercise-catalog?category=chest&search=supino
Authorization: Bearer <firebase-id-token>
```

**Response:** SDUI screen with: search bar, category picker, exercise-item grid/list. Cacheable at CDN edge (shared content).

#### Endpoint 6: GET /api/mobile/v1/screens/program-detail/:id

**Method:** GET
**Purpose:** Returns a program detail page

**Response:** SDUI screen with: cover image, title/description, trainer card, difficulty badge, duration stats, pricing, week-by-week exercise breakdown, reviews, purchase/subscribe button.

### BFF Route Handler Pattern

```typescript
// app/api/mobile/v1/screens/student-workouts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyMobileAuth } from "@/lib/sdui/auth";
import { getWorkoutsForStudent } from "@/lib/services/workout-service";
import { buildStudentWorkoutsScreen } from "@/lib/sdui/screens/student-workouts";
import { SDUIResponse } from "@/lib/sdui/schema";
import { randomUUID } from "crypto";

export async function GET(request: NextRequest) {
  // 1. Authenticate
  const auth = await verifyMobileAuth(request);
  if (!auth.isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse query params
  const status = request.nextUrl.searchParams.get("status") ?? undefined;
  const limit = parseInt(request.nextUrl.searchParams.get("limit") ?? "20");

  // 3. Fetch data via service layer
  const data = await getWorkoutsForStudent(auth.uid, { status, limit });
  const userDoc = await getStudentProfile(auth.uid);

  // 4. Build SDUI screen
  const screen = buildStudentWorkoutsScreen(data, userDoc?.displayName ?? "");

  // 5. Wrap in response envelope
  const response: SDUIResponseType = {
    sdui: { version: "1.0", screen },
    meta: {
      requestId: `req_${randomUUID().slice(0, 8)}`,
      timestamp: new Date().toISOString(),
      schemaVersion: "1.0.0",
    },
  };

  // 6. Validate against schema (development only)
  if (process.env.NODE_ENV === "development") {
    SDUIResponse.parse(response);
  }

  // 7. Return with cache headers
  return NextResponse.json(response, {
    headers: {
      "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
    },
  });
}
```

### Mobile Auth Middleware

```typescript
// lib/sdui/auth.ts
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export interface MobileAuthResult {
  isAuthenticated: boolean;
  uid: string;
  role: "student" | "trainer" | "admin";
  error?: string;
}

export async function verifyMobileAuth(
  request: NextRequest,
): Promise<MobileAuthResult> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return {
      isAuthenticated: false,
      uid: "",
      role: "student",
      error: "Missing token",
    };
  }

  try {
    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);
    const userDoc = await adminDb.collection("users").doc(decoded.uid).get();
    const role = userDoc.data()?.role ?? "student";

    return { isAuthenticated: true, uid: decoded.uid, role };
  } catch (error) {
    return {
      isAuthenticated: false,
      uid: "",
      role: "student",
      error: "Invalid token",
    };
  }
}
```

---

## Implementation Considerations

### Design Patterns

- **Discriminated Union (Component Tree):** Every component is identified by a `type` field. Zod's `z.discriminatedUnion()` validates at runtime. Swift's `Codable` with `CodingKeys` decodes the same pattern.
- **Builder Pattern (Screen Composition):** Builder functions compose component trees from service data. Builders are pure functions — given the same input, they produce the same output (enabling response caching).
- **Repository Pattern (Service Layer):** Services encapsulate Firestore access. Route handlers never import `firebase-admin` directly.

### Error Handling

**Service Layer:**

- Throws typed errors (`NotFoundError`, `UnauthorizedError`, `ValidationError`)
- Callers catch and map to HTTP status codes

**BFF Routes:**

- 401: Invalid/missing Firebase token
- 403: User lacks access to requested resource
- 404: Screen or resource not found
- 500: Unexpected error (logged, generic message returned)

**SDUI Error States:**

- Every screen includes an `errorState` field with a retry action
- Client renders the error state on any non-2xx response
- Offline: client renders last cached successful response

### Logging and Monitoring

Structured JSON logging at each layer:

```typescript
console.log(
  JSON.stringify({
    level: "info",
    layer: "bff",
    screenId: "student-workouts",
    userId: auth.uid,
    responseTime: Date.now() - startTime,
    componentCount: countComponents(screen.layout),
    cacheHit: false,
  }),
);
```

**Key Metrics to Track:**

- BFF endpoint response time (p50, p95, p99)
- SDUI payload size per screen (bytes)
- Cache hit ratio per screen
- Schema validation errors (should be 0 in production)

### Configuration Management

```typescript
// lib/sdui/config.ts
export const SDUI_CONFIG = {
  schemaVersion: "1.0.0",
  minClientVersion: "1.0.0",
  defaultCachePolicy: { maxAgeSeconds: 60, staleWhileRevalidate: true },
  defaultRefreshPolicy: { type: "time-based" as const, intervalSeconds: 300 },
  enableSchemaValidation: process.env.NODE_ENV === "development",
};
```

---

## Testing Strategy

### Unit Testing

**Coverage Target:** 80%+

**Focus Areas:**

- Service layer functions (Firestore query mocking)
- SDUI builder functions (snapshot testing of component trees)
- Zod schema validation (valid and invalid inputs)
- Action type construction

```typescript
// __tests__/lib/sdui/builders/components.test.ts
import { buildWorkoutCard } from '@/lib/sdui/builders/components';
import { SDUIComponent } from '@/lib/sdui/schema';

describe('buildWorkoutCard', () => {
  it('builds a valid workout card component', () => {
    const workout = { id: 'w1', title: 'Treino A', status: 'active', ... };
    const result = buildWorkoutCard(workout);

    expect(result.type).toBe('workout-card');
    expect(result.data.workoutId).toBe('w1');

    // Validate against Zod schema
    expect(() => SDUIComponent.parse(result)).not.toThrow();
  });
});
```

### Integration Testing

**Scenarios:**

1. Full BFF request flow: auth → service → builder → response → schema validation
2. Cache behavior: first request misses cache, second request hits
3. Error handling: invalid token returns 401, missing workout returns 404
4. Empty state: student with no workouts receives screen with emptyState

### Schema Validation Tests

```typescript
// __tests__/lib/sdui/schema.test.ts
import { SDUIResponse } from "@/lib/sdui/schema";
import studentWorkoutsFixture from "./__fixtures__/student-workouts.json";

describe("SDUIResponse schema", () => {
  it("validates a complete student-workouts response", () => {
    expect(() => SDUIResponse.parse(studentWorkoutsFixture)).not.toThrow();
  });

  it("rejects response missing required meta fields", () => {
    const invalid = { sdui: { version: "1.0", screen: {} }, meta: {} };
    expect(() => SDUIResponse.parse(invalid)).toThrow();
  });
});
```

### Performance Testing

**Load Profile:** 100 concurrent users requesting the same screen

**Success Criteria:**

- p95 response time < 200ms
- No Firestore timeout errors under load
- Cache hit ratio > 80% after warmup

---

## Deployment

### Deployment Strategy

Deploy via Vercel (same as existing Next.js app). No new infrastructure required. The BFF endpoints are standard Next.js route handlers deployed alongside existing routes.

### Environment Requirements

- **Development:** Local Next.js dev server with Firebase emulators
- **Staging:** Vercel preview deployments with staging Firebase project
- **Production:** Vercel production with production Firebase project

### Rollout Plan

1. Deploy BFF endpoints behind feature flag (query param `?sdui=true`)
2. Internal testing with development builds of iOS app
3. Enable for 10% of users via server-side flag
4. Monitor metrics (response time, errors, cache hits) for 1 week
5. Gradual rollout to 100%

### Rollback Procedure

BFF endpoints are additive — they don't modify existing routes. Rollback = point the iOS app back to the existing `/api/` endpoints. No server-side rollback needed.

---

## Dependencies

### External Dependencies

| Dependency         | Version | Purpose                          | Risk                     |
| ------------------ | ------- | -------------------------------- | ------------------------ |
| zod                | 3.22+   | Schema definition and validation | Low (already in project) |
| zod-to-json-schema | 3.x     | Export JSON Schema from Zod      | Low (dev dependency)     |
| firebase-admin     | 13.6+   | Firestore, Auth, Storage         | Low (already in project) |
| next               | 14.1+   | Route handlers, API routes       | Low (already in project) |

### Internal Dependencies

- Existing Firebase Admin setup (`lib/firebase-admin.ts`)
- Existing auth verification functions (`verifyAuthRequest`, `verifyTrainerRequest`)
- Domain types (`types/index.ts`, `types/workout.ts`)
- Firestore indexes (existing indexes sufficient for service queries)

---

## Assumptions and Constraints

### Assumptions

1. Firebase Auth token verification latency remains under 50ms
2. Firestore query patterns in existing route handlers are correct and optimized
3. The iOS app team will build the SDUIKit renderer as a separate feature
4. Zod schema validation in development mode does not significantly impact DX

### Constraints

1. Must deploy within existing Vercel plan (no separate BFF server)
2. Must not break existing CMS endpoints (zero regression)
3. Must use existing Firebase project (no new cloud infrastructure)

---

## Timeline

### Milestones

| Milestone        | Target  | Deliverables                                                         |
| ---------------- | ------- | -------------------------------------------------------------------- |
| Phase 1 Complete | Week 3  | 6 service modules, refactored route handlers, BFF namespace          |
| Phase 2 Complete | Week 5  | Zod schemas, TypeScript types, JSON Schema export, builder functions |
| Phase 3 Complete | Week 9  | 6 SDUI screen endpoints, caching, schema versioning                  |
| Phase 4 Complete | Week 11 | Full test suite, performance validation, documentation               |

### Tasks Breakdown

1. **Service layer extraction** — 6 services × M each = ~2 weeks
2. **SDUI schema definition** — L (complex recursive types with z.lazy)
3. **Builder functions** — M (per-component + per-screen)
4. **BFF endpoints** — 6 endpoints × M each = ~2 weeks
5. **Caching layer** — M
6. **Test suite** — L (unit + integration + schema + snapshot)

**Total Estimated Effort:** 9-11 weeks (backend only, excluding iOS renderer)

---

## Risks and Mitigations

| Risk                                         | Impact | Probability | Mitigation                                                     |
| -------------------------------------------- | ------ | ----------- | -------------------------------------------------------------- |
| Zod recursive types cause performance issues | Medium | Low         | Profile schema validation; disable in production               |
| Service extraction introduces regressions    | High   | Medium      | Write integration tests for existing routes BEFORE refactoring |
| SDUI payload sizes exceed 50KB target        | Medium | Low         | Profile per-screen; paginate large lists; compress with gzip   |
| Firebase cold start impacts BFF latency      | Medium | Medium      | Keep Firestore connection warm; use connection pooling         |
| Schema drift between Zod and Swift Codable   | High   | Medium      | Generate Swift types from JSON Schema; CI validation           |

---

## Success Criteria

- [ ] 6 service modules extracted and tested (80%+ coverage)
- [ ] 36 SDUI component schemas defined in Zod
- [ ] JSON Schema exported and validated against Draft 2020-12
- [ ] 6 BFF screen endpoints returning valid SDUI responses
- [ ] All responses pass SDUIResponse.parse() validation
- [ ] p95 response time < 200ms for all endpoints
- [ ] Existing CMS endpoints unaffected (zero regression)
- [ ] 3-layer caching implemented and verified
- [ ] Schema versioning with minClientVersion working

---

## Appendix

### Glossary

| Term                | Definition                                                                   |
| ------------------- | ---------------------------------------------------------------------------- |
| SDUI                | Server-Driven UI — the server controls layout, components, and navigation    |
| BFF                 | Backend for Frontend — a dedicated API layer optimized for a specific client |
| Discriminated Union | A TypeScript pattern where a `type` field determines the shape of an object  |
| Design Token        | Named values (spacing, colors) that map to platform-specific rendering       |

### References

1. [ADR-001: SDUI Architecture Decision](../docs/sdui/ADR-001-sdui-architecture.md)
2. [SDUI Research Document](../docs/sdui/SDUI_RESEARCH.md)
3. [Component Schema (JSON Schema)](../docs/sdui/component-schema.json)
4. [Component Library Spec](../docs/sdui/sdui-components.yaml)

---

**Document End**
