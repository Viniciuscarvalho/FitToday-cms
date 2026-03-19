# Tasks - Code Review Resolution

**Feature:** prd-resolve-questions-code-review
**Status:** Awaiting QUESTIONS.md answers before implementation
**Total Tasks:** 30 (across 3 phases)

---

## Phase 1: Security (CRITICAL)

### Task 1.0: Create shared API error utility [MUST]

**Epic:** 4 (Error Sanitization)
**Questions:** Q5, Q58
**Dependencies:** None (foundation task)
**Status:** pending

**Subtasks:**

- 1.1: Create `lib/api-errors.ts` with `apiError()` function
- 1.2: Define standard error codes enum
- 1.3: Update 2-3 endpoints as proof of concept

**Files:** `web-cms/lib/api-errors.ts` (new)

---

### Task 2.0: Add auth to Stripe account endpoint [MUST]

**Epic:** 1 (Stripe Auth)
**Questions:** Q1
**Dependencies:** None
**Status:** pending

**Subtasks:**

- 2.1: Add `verifyTrainerRequest()` to GET handler
- 2.2: Add ownership check (trainer's stripeAccountId matches requested accountId)
- 2.3: Add `verifyTrainerRequest()` to POST handler (login link)
- 2.4: Use `apiError()` for error responses

**Files:** `web-cms/app/api/stripe/account/route.ts`

---

### Task 3.0: Add auth to Stripe connect endpoint [MUST]

**Epic:** 1 (Stripe Auth)
**Questions:** Q1
**Dependencies:** None
**Status:** pending

**Subtasks:**

- 3.1: Add `verifyTrainerRequest()` to POST handler
- 3.2: Verify trainerId matches authenticated user
- 3.3: Add `verifyTrainerRequest()` to GET handler
- 3.4: Verify ownership of accountId

**Files:** `web-cms/app/api/stripe/connect/route.ts`

---

### Task 4.0: Add auth to Stripe checkout endpoint [MUST]

**Epic:** 1 (Stripe Auth)
**Questions:** Q1
**Dependencies:** None
**Status:** pending

**Subtasks:**

- 4.1: Add `verifyAuthRequest()` to POST handler
- 4.2: Validate programId exists in Firestore
- 4.3: Validate trainerId exists and has active Stripe account
- 4.4: Validate trainerStripeAccountId matches trainer's actual account
- 4.5: Add auth to GET handler (session retrieval)

**Files:** `web-cms/app/api/stripe/checkout/route.ts`

---

### Task 5.0: Add auth to Stripe products/prices endpoints [MUST]

**Epic:** 1 (Stripe Auth)
**Questions:** Q1
**Dependencies:** None
**Status:** pending

**Subtasks:**

- 5.1: Add `verifyTrainerRequest()` to products POST/GET
- 5.2: Add `verifyTrainerRequest()` to prices POST/GET
- 5.3: Verify ownership of Stripe account

**Files:** `web-cms/app/api/stripe/products/route.ts`, `web-cms/app/api/stripe/prices/route.ts`

---

### Task 6.0: Implement webhook idempotency [MUST]

**Epic:** 3 (Webhook Security)
**Questions:** Q4, Q36
**Dependencies:** None
**Status:** pending

**Subtasks:**

- 6.1: Add env var validation for STRIPE_WEBHOOK_SECRET
- 6.2: Create `processedWebhookEvents` collection dedup check
- 6.3: Add dedup to `handleProgramCheckoutCompleted` (check stripeCheckoutSessionId)
- 6.4: Add dedup to `handlePlatformCheckoutCompleted`
- 6.5: Mark event as processed after successful handling

**Files:** `web-cms/app/api/stripe/webhook/route.ts`

---

### Task 7.0: Extract trainer defaults utility [SHOULD]

**Epic:** 6 (OAuth Security)
**Questions:** Q8, Q9
**Dependencies:** None
**Status:** pending

**Subtasks:**

- 7.1: Create `lib/trainer-defaults.ts` with `createTrainerDefaults()`
- 7.2: Refactor `signUpAsTrainer` to use utility
- 7.3: Refactor `signInWithGoogle` to use utility
- 7.4: Refactor `signInWithApple` to use utility

**Files:** `web-cms/lib/trainer-defaults.ts` (new), `web-cms/providers/AuthProvider.tsx`

---

### Task 8.0: Migrate all endpoints to apiError() [SHOULD]

**Epic:** 4 (Error Sanitization)
**Questions:** Q5, Q58
**Dependencies:** Task 1.0
**Status:** pending

**Subtasks:**

- 8.1: Update all Stripe endpoints
- 8.2: Update all admin endpoints
- 8.3: Update all trainer/student endpoints
- 8.4: Update exercises, workouts, connections endpoints

**Files:** All `route.ts` files

---

### Task 9.0: Auth cookie security decision [COULD]

**Epic:** 2 (Cookie Security)
**Questions:** Q2, Q3, Q11
**Dependencies:** Q2/Q3 answers
**Status:** pending

**Subtasks:**

- 9.1: Based on Q2/Q3 answers, implement HttpOnly cookies OR document current approach
- 9.2: If implementing: create `/api/auth/session` endpoint
- 9.3: If implementing: update AuthProvider to call session endpoint
- 9.4: Update middleware if needed

**Files:** Depends on decision

---

## Phase 2: Performance + Data Integrity

### Task 10.0: Fix N+1 in connections endpoint [MUST]

**Epic:** 7 (N+1 Resolution)
**Questions:** Q12
**Dependencies:** None
**Status:** pending

**Subtasks:**

- 10.1: Replace `Promise.all` individual gets with `adminDb.getAll()`
- 10.2: Build Map for O(1) student lookup
- 10.3: Verify response format unchanged

**Files:** `web-cms/app/api/connections/route.ts`

---

### Task 11.0: Fix N+1 in workouts endpoints [MUST]

**Epic:** 7 (N+1 Resolution)
**Questions:** Q13
**Dependencies:** None
**Status:** pending

**Subtasks:**

- 11.1: Add denormalized fields to workout doc (progressPercent, feedbackCount)
- 11.2: Update workout creation to initialize denormalized fields
- 11.3: Update progress/feedback writes to sync denormalized fields
- 11.4: Refactor GET endpoints to use denormalized data

**Files:** `web-cms/app/api/workouts/route.ts`, `web-cms/app/api/students/workouts/route.ts`

---

### Task 12.0: Add pagination to student analytics [MUST]

**Epic:** 8 (Unbounded Queries)
**Questions:** Q14
**Dependencies:** None
**Status:** pending

**Subtasks:**

- 12.1: Add `startDate` and `endDate` query params (default: last 30 days)
- 12.2: Add `.limit(100)` safeguard
- 12.3: Update Swagger documentation

**Files:** `web-cms/app/api/students/[id]/analytics/route.ts`

---

### Task 13.0: Optimize admin metrics with aggregation [SHOULD]

**Epic:** 8 (Unbounded Queries)
**Questions:** Q15
**Dependencies:** None
**Status:** pending

**Subtasks:**

- 13.1: Query from `analytics/{trainerId}/daily/{date}` instead of full scans
- 13.2: Add fallback for trainers without analytics data
- 13.3: Add date range parameter

**Files:** `web-cms/app/api/admin/metrics/route.ts`

---

### Task 14.0: Add composite indexes for admin trainers [SHOULD]

**Epic:** 8 (Unbounded Queries)
**Questions:** Q16
**Dependencies:** None (can run in parallel)
**Status:** pending

**Subtasks:**

- 14.1: Add composite index `(role, status, createdAt)` to `firestore.indexes.json`
- 14.2: Refactor admin trainers endpoint to use Firestore query filtering
- 14.3: Deploy indexes

**Files:** `backend/firestore.indexes.json`, `web-cms/app/api/admin/trainers/route.ts`

---

### Task 15.0: Implement deterministic chat room IDs [MUST]

**Epic:** 9 (Data Integrity)
**Questions:** Q42
**Dependencies:** None
**Status:** pending

**Subtasks:**

- 15.1: Create `chatRoomId(trainerId, studentId)` utility
- 15.2: Update `createChatRoom` in connections endpoint
- 15.3: Update `createChatRoom` in webhook handler
- 15.4: Verify existing chats still accessible

**Files:** `web-cms/app/api/connections/[id]/route.ts`, `web-cms/app/api/stripe/webhook/route.ts`

---

### Task 16.0: Guard against negative counters [MUST]

**Epic:** 9 (Data Integrity)
**Questions:** Q38
**Dependencies:** None
**Status:** pending

**Subtasks:**

- 16.1: Use `runTransaction` for totalStudents decrements
- 16.2: Use `runTransaction` for activeStudents decrements
- 16.3: Add `Math.max(0, ...)` guard

**Files:** `web-cms/app/api/connections/[id]/route.ts`, `web-cms/app/api/stripe/webhook/route.ts`

---

### Task 17.0: Derive platform fee from trainer plan [SHOULD]

**Epic:** 9 (Data Integrity)
**Questions:** Q39
**Dependencies:** None
**Status:** pending

**Subtasks:**

- 17.1: In webhook, look up trainer's subscription plan
- 17.2: Use plan's commissionRate for fee calculation
- 17.3: Align backend Cloud Functions fee with web-cms fee logic

**Files:** `web-cms/app/api/stripe/webhook/route.ts`, `web-cms/lib/stripe.ts`

---

### Task 18.0: Standardize canceled/cancelled spelling [SHOULD]

**Epic:** 9 (Data Integrity)
**Questions:** Q40
**Dependencies:** None
**Status:** pending

**Subtasks:**

- 18.1: Choose one spelling (recommend: `canceled` to match Stripe)
- 18.2: Update all API routes
- 18.3: Update types
- 18.4: Update frontend

**Files:** Multiple

---

### Task 19.0: Optimize review rating calculation [SHOULD]

**Epic:** 10 (Rating Optimization)
**Questions:** Q18
**Dependencies:** None
**Status:** pending

**Subtasks:**

- 19.1: Add `ratingSum` field to trainer store
- 19.2: Refactor review submission to use incremental calculation
- 19.3: Backfill `ratingSum` for existing trainers

**Files:** `web-cms/app/api/trainers/[id]/reviews/route.ts`

---

### Task 20.0: Add caching headers to public endpoints [COULD]

**Epic:** 11 (Caching)
**Questions:** Q20
**Dependencies:** None
**Status:** pending

**Subtasks:**

- 20.1: Add `Cache-Control: public, max-age=300, stale-while-revalidate=600` to GET /api/trainers
- 20.2: Add caching to GET /api/trainers/count
- 20.3: Add caching to GET /api/exercises (non-search)
- 20.4: Add caching to GET /api/exercises/prompt-list

**Files:** Various public GET endpoints

---

## Phase 3: Code Quality + UX + Infrastructure

### Task 21.0: Fix bug - trainer city filter pagination [MUST]

**Epic:** 13 (Bug Fixes)
**Questions:** Q44
**Dependencies:** None
**Status:** pending

**Subtasks:**

- 21.1: Apply offset/limit AFTER in-memory city filter
- 21.2: Return correct total count from filtered results

**Files:** `web-cms/app/api/trainers/route.ts`

---

### Task 22.0: Fix bug - exercise soft-delete consistency [SHOULD]

**Epic:** 13 (Bug Fixes)
**Questions:** Q45
**Dependencies:** None
**Status:** pending

**Subtasks:**

- 22.1: Add `isActive` check to PATCH handler
- 22.2: Return 404 or 410 for inactive exercises

**Files:** `web-cms/app/api/exercises/[id]/route.ts`

---

### Task 23.0: Add Error Boundary component [MUST]

**Epic:** 14 (Frontend Resilience)
**Questions:** Q49
**Dependencies:** None
**Status:** pending

**Subtasks:**

- 23.1: Create `components/ErrorBoundary.tsx`
- 23.2: Wrap dashboard layout with ErrorBoundary
- 23.3: Wrap admin layout with ErrorBoundary

**Files:** `web-cms/components/ErrorBoundary.tsx` (new), layout files

---

### Task 24.0: Install toast system [SHOULD]

**Epic:** 14 (Frontend Resilience)
**Questions:** Q50
**Dependencies:** None
**Status:** pending

**Subtasks:**

- 24.1: Install sonner
- 24.2: Add `<Toaster />` to root layout
- 24.3: Replace `window.alert()` calls with `toast()`
- 24.4: Replace `window.confirm()` with custom modal pattern

**Files:** `web-cms/app/layout.tsx`, various pages

---

### Task 25.0: Fix dashboard null state flash [SHOULD]

**Epic:** 14 (Frontend Resilience)
**Questions:** Q59
**Dependencies:** None
**Status:** pending

**Subtasks:**

- 25.1: Show loading spinner or "Redirecting..." instead of null

**Files:** `web-cms/app/(dashboard)/layout.tsx`

---

### Task 26.0: Consolidate auth verification functions [SHOULD]

**Epic:** 15 (Code Quality)
**Questions:** Q53
**Dependencies:** None
**Status:** pending

**Subtasks:**

- 26.1: Create unified `verifyRequest(authHeader, options?)` function
- 26.2: Deprecate old functions (keep as wrappers initially)
- 26.3: Migrate endpoints gradually

**Files:** `web-cms/lib/firebase-admin.ts`

---

### Task 27.0: Extract shared createChatRoom utility [SHOULD]

**Epic:** 12 (Architecture)
**Questions:** Q27
**Dependencies:** Task 15.0 (deterministic IDs)
**Status:** pending

**Subtasks:**

- 27.1: Create `lib/chat-utils.ts` with shared `createChatRoom()`
- 27.2: Update connections endpoint to use shared function
- 27.3: Update webhook handler to use shared function

**Files:** `web-cms/lib/chat-utils.ts` (new)

---

### Task 28.0: Set up Vitest testing infrastructure [SHOULD]

**Epic:** 16 (Testing)
**Questions:** Q67
**Dependencies:** None
**Status:** pending

**Subtasks:**

- 28.1: Install vitest and dependencies
- 28.2: Create vitest.config.ts
- 28.3: Write first test: webhook idempotency
- 28.4: Write auth utility tests
- 28.5: Add test script to package.json

**Files:** `web-cms/vitest.config.ts` (new), `web-cms/__tests__/` (new)

---

### Task 29.0: Set up GitHub Actions CI [SHOULD]

**Epic:** 17 (Infrastructure)
**Questions:** Q69
**Dependencies:** Task 28.0 (tests must exist)
**Status:** pending

**Subtasks:**

- 29.1: Create `.github/workflows/ci.yml`
- 29.2: Add TypeScript check, lint, build, test steps
- 29.3: Test on PR

**Files:** `.github/workflows/ci.yml` (new)

---

### Task 30.0: Add env var validation at startup [SHOULD]

**Epic:** 17 (Infrastructure)
**Questions:** Q73
**Dependencies:** None
**Status:** pending

**Subtasks:**

- 30.1: Create `lib/env-validation.ts`
- 30.2: Validate required env vars on server startup
- 30.3: Log clear error messages for missing vars

**Files:** `web-cms/lib/env-validation.ts` (new)

---

## Task Dependency Graph

```
Phase 1 (can run in parallel):
  Task 1.0 ─────────────────> Task 8.0 (needs apiError)
  Task 2.0 ─┐
  Task 3.0 ─┤ (all independent)
  Task 4.0 ─┤
  Task 5.0 ─┘
  Task 6.0 (independent)
  Task 7.0 (independent)
  Task 9.0 (depends on Q2/Q3 answers)

Phase 2 (can run in parallel):
  Task 10.0 ─┐
  Task 11.0 ─┤ (all independent)
  Task 12.0 ─┤
  Task 13.0 ─┤
  Task 14.0 ─┤
  Task 15.0 ─┤──> Task 27.0 (needs deterministic IDs first)
  Task 16.0 ─┤
  Task 17.0 ─┤
  Task 18.0 ─┤
  Task 19.0 ─┤
  Task 20.0 ─┘

Phase 3 (can run in parallel):
  Task 21.0 ─┐
  Task 22.0 ─┤
  Task 23.0 ─┤ (all independent)
  Task 24.0 ─┤
  Task 25.0 ─┤
  Task 26.0 ─┤
  Task 27.0 ─┤ (depends on Task 15.0)
  Task 28.0 ─┤──> Task 29.0 (needs tests to exist)
  Task 30.0 ─┘
```

---

## Summary

| Phase                | Tasks                | Priority | Parallel?                         |
| -------------------- | -------------------- | -------- | --------------------------------- |
| Phase 1: Security    | 9 tasks (1.0-9.0)    | CRITICAL | Yes (except 8.0 depends on 1.0)   |
| Phase 2: Performance | 11 tasks (10.0-20.0) | HIGH     | Yes (all independent)             |
| Phase 3: Quality     | 10 tasks (21.0-30.0) | MEDIUM   | Yes (except 27.0→15.0, 29.0→28.0) |

**Blocked:** All tasks are blocked until QUESTIONS.md is answered. Some tasks may be removed or modified based on answers.
