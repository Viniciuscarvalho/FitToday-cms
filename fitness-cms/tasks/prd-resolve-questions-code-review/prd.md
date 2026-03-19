# Product Requirements Document (PRD)

**Project Name:** FitToday CMS - Code Review Resolution
**Document Version:** 1.0
**Date:** 2026-03-18
**Author:** Claude Code (Tech Lead Review)
**Status:** Draft - Awaiting Question Answers

---

## Executive Summary

**Problem Statement:**
A comprehensive code review of the FitToday CMS codebase identified 80 issues across 10 categories. The most critical findings are: unauthenticated Stripe endpoints exposing financial data, N+1 query patterns that will break at scale, zero test coverage, and no webhook idempotency for payment processing.

**Proposed Solution:**
Resolve all identified issues in 3 risk-prioritized phases: Security first, then Performance + Data Integrity, then Code Quality + UX + Infrastructure.

**Business Value:**

- Prevent financial data exposure and unauthorized payment operations
- Ensure platform stability as trainer/student base grows
- Reduce risk of data corruption in payment flows
- Establish code quality baseline for sustainable development

**Target Launch:** Phase 1 (Security) should be deployed ASAP. Phase 2 within 2 weeks. Phase 3 within 1 month.

---

## Source Document

All issues originate from `QUESTIONS.md` in the project root. Each question (Q1-Q80) is referenced by ID throughout this PRD. **The owner must answer each question in QUESTIONS.md before implementation begins.**

---

## Phase 1: Security (CRITICAL - Deploy ASAP)

### Epic 1: Stripe Endpoint Authentication (Q1)

**Questions:** Q1
**Risk:** CRITICAL - Financial data exposed to public internet
**Files:** `web-cms/app/api/stripe/account/route.ts`, `web-cms/app/api/stripe/connect/route.ts`, `web-cms/app/api/stripe/checkout/route.ts`, `web-cms/app/api/stripe/products/route.ts`, `web-cms/app/api/stripe/prices/route.ts`

**Scope:**

- Add `verifyAuthRequest()` or `verifyTrainerRequest()` to all Stripe endpoints except webhook
- Add ownership verification (trainer can only access their own Stripe account)
- Validate that `trainerId`, `studentId`, and `trainerStripeAccountId` exist in Firestore before creating checkout sessions

**Acceptance Criteria:**

- All Stripe endpoints (except webhook) return 401 without valid Bearer token
- Trainer can only access their own Stripe account data
- Checkout sessions can only be created with valid, existing entity IDs

---

### Epic 2: Auth Cookie Security (Q2, Q3, Q11)

**Questions:** Q2, Q3, Q11
**Risk:** HIGH - XSS could steal auth tokens; middleware can be bypassed
**Files:** `web-cms/providers/AuthProvider.tsx`, `web-cms/middleware.ts`, `web-cms/lib/auth-utils.ts`

**Scope:**

- Evaluate moving auth token to HttpOnly cookie set by API route
- Assess SameSite=Strict vs Lax tradeoffs with OAuth flows
- Document that middleware is UX-only routing (not security boundary)

**Acceptance Criteria:**

- Auth tokens not accessible via `document.cookie` in browser console
- OR documented decision that current approach is acceptable with rationale

---

### Epic 3: Webhook Security & Idempotency (Q4, Q36)

**Questions:** Q4, Q36
**Risk:** CRITICAL - Duplicate payment records on Stripe retries
**Files:** `web-cms/app/api/stripe/webhook/route.ts`

**Scope:**

- Add explicit validation for `STRIPE_WEBHOOK_SECRET` env var
- Implement idempotency checks (check if subscription/transaction already exists before creating)
- Use Stripe event ID as dedup key

**Acceptance Criteria:**

- Webhook returns clear error if secret is misconfigured
- Duplicate webhook events do not create duplicate records
- Idempotency verified with test scenarios

---

### Epic 4: Error Message Sanitization (Q5, Q58)

**Questions:** Q5, Q58
**Risk:** MEDIUM - Internal details leaked to clients
**Files:** All API route files

**Scope:**

- Replace `error.message` with generic messages in production responses
- Standardize error format: `{ error: string, code?: string }`
- Keep detailed logging server-side via `console.error`

**Acceptance Criteria:**

- No Stripe account IDs, Firestore paths, or stack traces in API responses
- Consistent error response schema across all endpoints

---

### Epic 5: Input Validation & Rate Limiting (Q6, Q7, Q10)

**Questions:** Q6, Q7, Q10
**Risk:** MEDIUM - Abuse potential on auth and payment endpoints
**Files:** All API routes, `middleware.ts`

**Scope:**

- Evaluate rate limiting options (Next.js middleware, Vercel Edge, or Firestore-based)
- Add file magic byte validation for uploads
- Assess CSRF protection needs

**Acceptance Criteria:**

- Rate limiting active on `/api/stripe/*` and auth-related endpoints
- File uploads validated by content, not just content-type header

---

### Epic 6: OAuth & Registration Security (Q8, Q9)

**Questions:** Q8, Q9
**Risk:** MEDIUM - OAuth auto-creates trainer accounts; initialization duplicated
**Files:** `web-cms/providers/AuthProvider.tsx`

**Scope:**

- Decide: should OAuth create student or trainer by default?
- Extract trainer initialization to `createTrainerDefaults()` utility
- Eliminate 3x code duplication

**Acceptance Criteria:**

- OAuth registration behavior matches product intent
- Single source of truth for trainer default data

---

## Phase 2: Performance + Data Integrity

### Epic 7: N+1 Query Resolution (Q12, Q13, Q19)

**Questions:** Q12, Q13, Q19
**Risk:** HIGH - Endpoints become unusable at scale
**Files:** `web-cms/app/api/connections/route.ts`, `web-cms/app/api/workouts/route.ts`, `web-cms/app/api/students/workouts/route.ts`, `web-cms/app/api/trainers/route.ts`

**Scope:**

- Connections: batch student lookups with `getAll()` or denormalize student name/photo
- Workouts: denormalize progress/feedback counts into workout document
- Trainers: add composite Firestore index for city filter instead of in-memory filtering

**Acceptance Criteria:**

- Connections endpoint: max 2 Firestore queries regardless of result count
- Workouts endpoint: max 2 Firestore queries regardless of result count
- Trainer city filter uses Firestore query, not in-memory

---

### Epic 8: Unbounded Query Protection (Q14, Q15, Q16, Q17)

**Questions:** Q14, Q15, Q16, Q17
**Risk:** HIGH - Memory exhaustion, high costs
**Files:** `web-cms/app/api/students/[id]/analytics/route.ts`, `web-cms/app/api/admin/metrics/route.ts`, `web-cms/app/api/admin/trainers/route.ts`, `web-cms/app/api/exercises/route.ts`

**Scope:**

- Add pagination/date range to student analytics
- Admin metrics: use pre-aggregated daily snapshots
- Admin trainers: add composite indexes, use Firestore queries
- Exercises: evaluate search solution or cap fetch limit

**Acceptance Criteria:**

- No endpoint fetches more than 100 documents without explicit pagination
- Admin metrics response time < 2s at 1000 trainers

---

### Epic 9: Data Integrity Fixes (Q37, Q38, Q39, Q40, Q41, Q42)

**Questions:** Q37, Q38, Q39, Q40, Q41, Q42
**Risk:** MEDIUM - Financial inconsistencies, negative counters, duplicate chats
**Files:** `web-cms/app/api/stripe/webhook/route.ts`, `web-cms/app/api/connections/[id]/route.ts`, `web-cms/lib/stripe.ts`

**Scope:**

- Use transactions for financial balance updates
- Guard against negative counters (totalStudents, activeStudents)
- Derive platform fee from trainer's subscription plan, not global constant
- Standardize `canceled` vs `cancelled` spelling
- Use deterministic chat room IDs to prevent duplicates
- Plan Storage cleanup for orphaned files

**Acceptance Criteria:**

- Financial balance never goes negative
- No duplicate chat rooms for same trainer-student pair
- Platform fee matches trainer's current plan

---

### Epic 10: Review Rating Optimization (Q18)

**Questions:** Q18
**Risk:** MEDIUM - Expensive recalculation on every review
**Files:** `web-cms/app/api/trainers/[id]/reviews/route.ts`

**Scope:**

- Replace full-scan rating recalculation with incremental approach
- Store `ratingSum` + `reviewCount` on trainer, compute average from those

**Acceptance Criteria:**

- Review submission does not fetch all reviews
- Rating accuracy maintained

---

### Epic 11: Caching Strategy (Q20)

**Questions:** Q20
**Risk:** LOW - Unnecessary database costs
**Files:** All public GET endpoints

**Scope:**

- Add `Cache-Control` headers for public endpoints (trainers, exercises, trainer count)
- Evaluate `stale-while-revalidate` for semi-static data

**Acceptance Criteria:**

- Public endpoints return appropriate cache headers
- Trainer profiles cached for 5+ minutes

---

## Phase 3: Code Quality + UX + Infrastructure

### Epic 12: Architecture Consolidation (Q26, Q27, Q28, Q29, Q30, Q31)

**Questions:** Q26, Q27, Q28, Q29, Q30, Q31
**Risk:** MEDIUM - Maintenance burden, confusion
**Files:** Various

**Scope:**

- Decide which Stripe integration to keep (Cloud Functions vs API routes)
- Extract `createChatRoom` to shared utility
- Consolidate notification creation to single service
- Standardize frontend data fetching (API routes + React Query)
- Document single-collection user design decision
- Document 100-year subscription rationale

**Acceptance Criteria:**

- Single Stripe integration layer
- No duplicated business logic
- Consistent data fetching pattern across all pages

---

### Epic 13: Bug Fixes (Q44, Q45, Q46, Q47, Q48)

**Questions:** Q44, Q45, Q46, Q47, Q48
**Risk:** MEDIUM - Incorrect behavior
**Files:** Various API routes

**Scope:**

- Fix trainer city filter + pagination interaction
- Reject updates to inactive exercises
- Consider PATCH instead of DELETE for program archival
- Fix trainerId resolution in health-data
- Preserve connection history on re-request

**Acceptance Criteria:**

- Pagination works correctly with all filter combinations
- Soft-deleted entities cannot be modified
- Connection history preserved

---

### Epic 14: Frontend Resilience (Q49, Q50, Q51, Q59, Q60, Q61, Q62, Q63, Q64, Q65, Q66)

**Questions:** Q49, Q50, Q51, Q59, Q60, Q61, Q62, Q63, Q64, Q65, Q66
**Risk:** MEDIUM - Poor user experience
**Files:** All frontend components and pages

**Scope:**

- Add Error Boundary component
- Implement global toast system (Sonner)
- Replace `window.confirm()` with custom modal
- Fix dashboard null state flash
- Mutual exclusion for dropdown menus
- Add keyboard navigation and ARIA attributes
- Loading states for inline actions
- Error states for failed data fetches
- Fallback images for broken URLs
- Finances page onboarding flow

**Acceptance Criteria:**

- No unhandled crashes in UI
- User feedback for all async operations
- Basic WCAG 2.1 AA compliance for interactive elements

---

### Epic 15: Code Quality Improvements (Q52, Q53, Q54, Q55, Q56, Q57)

**Questions:** Q52, Q53, Q54, Q55, Q56, Q57
**Risk:** LOW - Tech debt
**Files:** Various

**Scope:**

- Refactor AuthProvider (extract trainer defaults)
- Consolidate verify\*Request functions
- Evaluate query builder abstraction
- Type API responses
- Evaluate structured logging
- Add request logging for audit trail

**Acceptance Criteria:**

- No duplicated auth verification logic
- API responses have TypeScript types

---

### Epic 16: Testing Foundation (Q67)

**Questions:** Q67
**Risk:** HIGH - No safety net for changes
**Files:** New test files

**Scope:**

- Set up Jest/Vitest test infrastructure
- Priority test targets:
  1. Stripe webhook handlers (payment correctness)
  2. Auth utilities (security correctness)
  3. Critical API endpoints (exercises, connections, workouts)

**Acceptance Criteria:**

- Test framework configured and running
- Webhook handlers have unit tests
- Auth utilities have unit tests
- At least 3 critical API endpoints have integration tests

---

### Epic 17: Infrastructure & DevOps (Q68, Q69, Q70, Q71, Q72, Q73)

**Questions:** Q68, Q69, Q70, Q71, Q72, Q73
**Risk:** MEDIUM - No CI/CD, no monitoring, no backups
**Files:** New config files

**Scope:**

- Upgrade backend firebase-admin to match web-cms version
- Set up GitHub Actions CI (lint, type-check, build, test)
- Evaluate error tracking (Sentry)
- Audit Firestore security rules
- Configure Firestore scheduled exports
- Add env var validation at startup

**Acceptance Criteria:**

- CI pipeline runs on every PR
- Build fails on type errors
- Firestore backups configured

---

### Epic 18: Mobile & Scalability (Q33, Q34, Q74, Q75, Q76, Q77, Q78, Q79, Q80)

**Questions:** Q33, Q34, Q74, Q75, Q76, Q77, Q78, Q79, Q80
**Risk:** LOW (future-facing)
**Files:** Various

**Scope:**

- Evaluate API versioning strategy
- Evaluate longer-lived PDF URLs or proxy endpoint
- Plan mobile-optimized endpoints (BFF pattern)
- Enhance Swagger documentation
- Plan for proper search engine at scale
- Evaluate dashboard data pre-aggregation
- Evaluate webhook background queue (Cloud Tasks)

**Acceptance Criteria:**

- API versioning decision documented
- Swagger enhanced with examples and error codes
- Scalability plan documented

---

## Constraints

- All changes must be backward-compatible with existing mobile apps
- Stripe webhook URL cannot change (already configured in Stripe dashboard)
- Firebase security rules changes require careful testing
- No downtime allowed for payment processing

## Out of Scope

- UI redesign
- New features
- Database migration to different provider
- Mobile app changes

---

## Next Steps

1. **Owner answers all questions in QUESTIONS.md** with: fix / ignore / defer / intended behavior
2. PRD is updated based on answers (some epics may be removed or modified)
3. TechSpec is finalized
4. Implementation begins phase by phase
