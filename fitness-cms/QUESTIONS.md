# QUESTIONS.md - FitToday CMS Code Review

Comprehensive technical review of the FitToday CMS codebase. Each question is independent and should be answered with what to do (fix, ignore, defer, etc.) and why.

---

## SECURITY - Critical

### Q1: Stripe endpoints have no authentication

`POST /api/stripe/connect` (`web-cms/app/api/stripe/connect/route.ts:5`) creates Stripe Express accounts with no auth check. Anyone who knows a trainer's email can create a Stripe account on their behalf.

Similarly, `GET /api/stripe/account` (`web-cms/app/api/stripe/account/route.ts:5`) exposes sensitive financial data (balance, payouts, charges, total earnings) to anyone who provides an `accountId`.

`POST /api/stripe/account` (`web-cms/app/api/stripe/account/route.ts:101`) generates Stripe dashboard login links without auth.

`POST /api/stripe/checkout` (`web-cms/app/api/stripe/checkout/route.ts:34`) allows anyone to create checkout sessions with arbitrary `trainerId`, `studentId`, and `trainerStripeAccountId` -- no verification that these entities exist or that the caller is authorized.

`POST /api/stripe/products` and `POST /api/stripe/prices` create Stripe products/prices on connected accounts without any auth.

**Should all Stripe endpoints (except webhook) require authentication and ownership verification?**

### Q2: Auth cookies are accessible via JavaScript (no HttpOnly)

In `AuthProvider.tsx:83`, the auth token cookie is set via `document.cookie` with `SameSite=Lax` but no `HttpOnly` flag. This means any XSS vulnerability would allow an attacker to steal the auth token.

**Is this intentional because the client needs to read the cookie, or should we move to `HttpOnly` cookies set by an API route?**

### Q3: Middleware relies on client-set cookies for authorization

`middleware.ts:44-46` reads `auth-token`, `user-role`, and `trainer-status` from cookies that are set by client-side JavaScript (`AuthProvider.tsx`). A malicious user could manually set `user-role=admin` in their browser cookies and bypass middleware route protection.

The actual API endpoints verify tokens server-side (which is correct), but the middleware routing is based on easily-spoofable cookies.

**Should the middleware verify the token server-side, or is the current "defense in depth" approach (middleware for UX routing + API for real auth) acceptable?**

### Q4: STRIPE_WEBHOOK_SECRET uses non-null assertion without validation

`web-cms/app/api/stripe/webhook/route.ts:524`: `process.env.STRIPE_WEBHOOK_SECRET!` uses a non-null assertion. If the env var is missing, the webhook would fail with a cryptic error instead of a clear "webhook secret not configured" message.

**Should we add an explicit check and return 500 with a clear error if the secret is missing?**

### Q5: Error messages leak internal implementation details

Multiple endpoints return `error.message` directly in JSON responses (e.g., `stripe/account/route.ts:94`, `stripe/connect/route.ts:53`). Stripe error messages can contain account IDs, configuration details, etc.

**Should we sanitize error messages in production to return generic errors while logging details server-side?**

### Q6: No rate limiting on any endpoint

There's no rate limiting on auth endpoints (`/login`, `/register`, `/forgot-password`), Stripe endpoints, or any API route. Firebase Auth has built-in rate limiting, but the API layer has none.

**Should we add rate limiting middleware, at least for auth and payment endpoints?**

### Q7: File upload endpoints don't validate file content (magic bytes)

`POST /api/programs` (`web-cms/app/api/programs/route.ts`) and `POST /api/workouts` validate content type headers but not actual file content. A user could upload a malicious file with a spoofed content type.

**Should we validate file magic bytes in addition to content-type headers?**

---

## SECURITY - High

### Q8: `signInWithGoogle` and `signInWithApple` auto-create trainer accounts

`AuthProvider.tsx:246-283` and `AuthProvider.tsx:297-334`: When a new user signs in via Google or Apple OAuth, the code automatically creates a trainer account with `role: 'trainer'` and `status: 'pending'`. There's no option to sign in as a student via OAuth.

**Is this intentional? Should OAuth users be able to choose their role, or should they default to student?**

### Q9: Trainer data initialization is duplicated in 3 places

The trainer initialization object (with `store`, `financial`, `subscription`, `profile` defaults) is duplicated in `AuthProvider.tsx` at lines 199-233 (signUpAsTrainer), 247-281 (signInWithGoogle), and 298-332 (signInWithApple).

**Should this be extracted to a shared `createTrainerDefaults()` function to prevent drift?**

### Q10: No CSRF protection on state-changing API routes

The API routes use Bearer token auth but no CSRF tokens. While Bearer tokens in headers provide some CSRF protection (browsers don't auto-send custom headers), the cookies used for middleware routing could be leveraged in CSRF attacks.

**Is additional CSRF protection needed, or is the Bearer token approach sufficient?**

### Q11: `SameSite=Lax` on auth cookies

`AuthProvider.tsx:83` sets `SameSite=Lax`. This allows the cookie to be sent on top-level navigation from external sites. For sensitive auth tokens, `SameSite=Strict` would be more secure but could break OAuth redirect flows.

**Should we use `SameSite=Strict` and handle OAuth redirects differently?**

---

## PERFORMANCE - Critical

### Q12: N+1 query pattern in connections endpoint

`GET /api/connections` (`web-cms/app/api/connections/route.ts:46-74`): For each connection, a separate Firestore query fetches the student document. With 50 connections, this means 51 queries per request.

**Should we denormalize student name/photo into the connection document, or batch the queries using `getAll()`?**

### Q13: N+1 query pattern in workouts list

`GET /api/workouts` (`web-cms/app/api/workouts/route.ts`) and `GET /api/students/workouts` (`web-cms/app/api/students/workouts/route.ts`): For each workout, two additional queries fetch progress and feedback count.

**Should progress/feedback counts be denormalized into the workout document?**

### Q14: Unbounded query in student analytics

`GET /api/students/[id]/analytics` (`web-cms/app/api/students/[id]/analytics/route.ts`): Fetches ALL workout_completions for a trainer-student pair with no `.limit()`. Could return thousands of documents.

**Should this have pagination or a date range filter?**

### Q15: Admin metrics endpoint fetches entire collections

`GET /api/admin/metrics` (`web-cms/app/api/admin/metrics/route.ts`): Fetches ALL trainers and ALL programs without filters. As the platform grows, this endpoint will become extremely slow and expensive.

**Should we use pre-aggregated metrics (daily snapshots) instead of real-time full-collection scans?**

### Q16: Admin trainers endpoint loads all trainers for in-memory filtering

`GET /api/admin/trainers` (`web-cms/app/api/admin/trainers/route.ts`): Fetches all trainers into memory, then filters and sorts in-memory to avoid composite Firestore indexes.

**Should we create the necessary composite indexes and use Firestore queries instead?**

### Q17: Exercise search fetches 500 documents for in-memory filtering

`GET /api/exercises` (`web-cms/app/api/exercises/route.ts:77`): When a search term is provided, fetches up to 500 documents and filters in memory because Firestore doesn't support full-text search.

**Should we implement a search solution (Algolia, Typesense, or Firestore full-text search extension)?**

### Q18: Review rating recalculation reads all reviews on every submission

`POST /api/trainers/[id]/reviews` recalculates the average rating by fetching ALL reviews in a transaction. With hundreds of reviews, this becomes expensive.

**Should we use incremental calculation (store `totalRating` + `reviewCount` and compute average from those)?**

### Q19: Trainer city filtering is done in-memory

`GET /api/trainers` (`web-cms/app/api/trainers/route.ts:34-39`): When filtering by city, fetches all matching trainers and filters in memory to "avoid composite index requirements."

**Is avoiding the composite index worth the performance cost? Should we add the index?**

### Q20: No caching on any endpoint

No API endpoint uses HTTP caching headers (`Cache-Control`, `ETag`). Public data like trainer profiles, exercise lists, and trainer counts are re-fetched on every request.

**Should we add caching headers for public/semi-static endpoints?**

---

## PERFORMANCE - Medium

### Q21: Frontend dashboard makes multiple independent Firestore queries

The dashboard page (`web-cms/app/(dashboard)/cms/page.tsx`) makes multiple parallel Firestore queries (programs, subscriptions, etc.) without React Query or caching.

**Should all dashboard data fetching go through API routes + React Query instead of direct Firestore client queries?**

### Q22: Programs page has no pagination

`GET /api/programs` (`web-cms/app/api/programs/route.ts`) supports `limit` but not `offset` or cursor-based pagination. The frontend loads all programs at once.

**Should we add proper pagination to the programs endpoint and page?**

### Q23: Students page renders all students with sparkline charts

The students page creates sparkline charts for every student row without virtualization or lazy loading. With 100+ students, this causes performance degradation.

**Should we implement virtual scrolling or paginated loading for the students table?**

### Q24: Notification listener runs for entire component lifecycle

`Header.tsx`: An `onSnapshot` listener for notifications runs continuously. If a user has thousands of notifications, the initial snapshot could be large.

**Should we limit the snapshot query and implement pagination in the dropdown?**

### Q25: No code splitting for admin pages

Admin pages (used only by a few users) are bundled with the main application. No dynamic imports visible.

**Should admin pages use `next/dynamic` for code splitting?**

---

## ARCHITECTURE

### Q26: Dual Stripe integration creates confusion

The project has Stripe integration in two places:

1. **Backend Cloud Functions** (`backend/functions/src/index.ts`): `becomeTrainer`, `createCheckoutSession`, `stripeWebhook`
2. **Web CMS API routes** (`web-cms/app/api/stripe/*`): Full checkout, connect, account, products, prices, webhook

Both handle checkout sessions and webhooks. Which is the source of truth?

**Should we consolidate to a single Stripe integration layer? Which one should be kept?**

### Q27: `createChatRoom` function is duplicated

`createChatRoom` exists in two places:

1. `web-cms/app/api/connections/[id]/route.ts:293-332`
2. `web-cms/app/api/stripe/webhook/route.ts:57-86`

They have slightly different welcome messages and dedup logic.

**Should this be extracted to a shared utility?**

### Q28: Notification creation logic is fragmented

Notifications are created in:

1. `lib/notifications.ts` - `createNotification()` with full schema
2. `stripe/webhook/route.ts` - `sendNotification()` with simplified schema
3. `backend/functions/src/index.ts` - inline notification creation

**Should we have a single notification service/utility?**

### Q29: Mixed data fetching patterns in frontend

The frontend uses three different data fetching patterns:

1. Direct Firestore client queries (dashboard page)
2. `apiRequest()` + React Query (exercises page)
3. Raw `fetch()` with manual token (students page)

**Should we standardize on one pattern (API routes + React Query)?**

### Q30: The `users` collection stores trainers, students, and admins

All user types share the `users` collection with role-specific fields. A trainer document has `store`, `financial`, `subscription`, and `profile` fields that students don't have, and vice versa.

**Is this a deliberate single-collection design, or should trainers/students have separate collections or subcollections?**

### Q31: Connection subscription has 100-year expiry

`connections/[id]/route.ts:224`: When a connection is accepted, a subscription is created with `currentPeriodEnd` set to ~100 years from now.

**Why create a subscription record for free connections? Is this for query uniformity with paid subscriptions?**

### Q32: Backend Cloud Functions and Web CMS have different Firebase Admin SDK versions

`web-cms/package.json`: `firebase-admin: 13.6.0`
`backend/functions/package.json`: `firebase-admin: 11.11.1`

**Should these be aligned to prevent API behavior differences?**

### Q33: No API versioning

All endpoints are at `/api/resource`. If the mobile apps depend on these endpoints, breaking changes would require simultaneous app updates.

**Should we introduce API versioning (`/api/v1/resource`) now, before the mobile apps scale?**

### Q34: Workout PDFs use 7-day signed URLs

`firebase-admin.ts`: `generateSignedUrl` creates URLs that expire in 7 days. The workout endpoint regenerates signed URLs on every request.

**What happens if a student saves/bookmarks a PDF URL? Should we use longer-lived URLs or a proxy endpoint?**

### Q35: No soft-delete consistency

Some entities use soft-delete (exercises: `isActive=false`, programs: `status=archived`), while workouts support both hard and soft delete. Connections use `status=cancelled`.

**Should we standardize the soft-delete pattern across all entities?**

---

## DATA INTEGRITY

### Q36: Webhook handlers don't check for duplicate processing

`stripe/webhook/route.ts`: The `handleProgramCheckoutCompleted` function creates subscription, progress, transaction, and student access records without checking if they already exist. If Stripe retries the webhook, all records would be duplicated.

**Should we implement idempotency keys or check for existing records before creation?**

### Q37: Financial balance updates are not atomic

`stripe/webhook/route.ts:622-625`: `transfer.created` updates `pendingBalance` and `availableBalance` with two separate `FieldValue.increment()` calls in a single `update()`. This is atomic per document, but the transfer amount assumption could drift if other webhook events modify the same fields concurrently.

**Should financial updates use transactions instead of increments?**

### Q38: `FieldValue.increment(-1)` on `totalStudents` can go negative

`connections/[id]/route.ts:106`: When a connection is cancelled, `store.totalStudents` is decremented. If the data is already 0 (due to a bug or race condition), it goes negative.

**Should we add a guard (`Math.max(0, newCount)`) or use a transaction to check the current value?**

### Q39: Platform fee percentage is hardcoded in multiple places

`PLATFORM_FEE_PERCENT = 10` is defined in `lib/stripe.ts`, but `backend/functions/src/index.ts` uses `15` as default commission. The checkout endpoints and webhook handlers calculate fees independently.

**Should the fee percentage come from the trainer's subscription plan (as the `PLANS` constants suggest) rather than a global constant?**

### Q40: Subscription status enum inconsistency

The codebase uses both `'canceled'` (American English) and `'cancelled'` (British English) in different places. Connection status uses `'cancelled'`, while Stripe/subscription status uses `'canceled'`.

**Should we standardize to one spelling?**

### Q41: No orphan cleanup for Storage files

When a program is soft-deleted (archived), its cover image, PDF, and video remain in Firebase Storage. When a workout is hard-deleted, the PDF is deleted, but errors during deletion are caught and logged without retry.

**Should we implement a cleanup job for orphaned Storage files?**

### Q42: Chat room dedup has a race condition

`connections/[id]/route.ts:295-300`: The `createChatRoom` function checks for existing chats, then creates a new one if none exists. Two concurrent connection acceptances for the same trainer-student pair could create duplicate chat rooms.

**Should we use a deterministic chat room ID (e.g., `{trainerId}_{studentId}`) to prevent duplicates?**

---

## BUGS

### Q43: Frontend exercises pagination mismatch (already fixed)

The frontend sends `page` but the backend expected `offset`. This was identified and fixed in the previous session. Documenting for completeness.

**Status: Fixed.**

### Q44: `GET /api/trainers` city filter doesn't apply offset/limit correctly

`web-cms/app/api/trainers/route.ts:34-39`: When the city filter is active, the code fetches all trainers, filters in memory, gets the total count from the filtered set, then does another query with offset/limit on the unfiltered query. The pagination applies to the unfiltered results, not the city-filtered results.

**The city filter and pagination don't work together correctly. Should the pagination apply after the in-memory filter?**

### Q45: `DELETE /api/exercises/[id]` uses soft delete but PATCH doesn't check `isActive`

Exercises are soft-deleted by setting `isActive: false`. But `PATCH /api/exercises/[id]` doesn't check if the exercise is active before allowing updates. A trainer could update a "deleted" exercise.

**Should PATCH reject updates to inactive exercises?**

### Q46: Programs `DELETE` endpoint does a soft-delete but the response says "archived"

`DELETE /api/programs/[id]` sets `status: 'archived'` and `visibility: 'private'`. The HTTP method implies deletion, but the action is archival. This is semantically confusing.

**Should this be a `PATCH` with `{ status: 'archived' }` instead of a `DELETE`?**

### Q47: `POST /api/students/[id]/health-data` resolves trainerId inconsistently

`web-cms/app/api/students/[id]/health-data/route.ts`: The trainerId is resolved from either the student document or the request body (`body.trainerId`). If both exist and differ, the body value overrides.

**Should the trainerId always come from the authenticated student's Firestore document?**

### Q48: Connection re-request deletes and recreates the document

`POST /api/trainers/[id]/connect`: When a previously rejected/cancelled connection is re-requested, the old document is deleted and a new one is created (to re-trigger the Cloud Function). This loses the history of the previous connection.

**Should we keep the old document and update its status, using a different mechanism to trigger notifications?**

---

## CODE QUALITY

### Q49: No Error Boundary component in the React app

There's no React Error Boundary anywhere in the component tree. A JavaScript error in any component crashes the entire page with no fallback UI.

**Should we add Error Boundary wrappers at the layout and page level?**

### Q50: No global toast/notification system for user feedback

Success and error feedback is handled inconsistently: some pages show inline messages, some use `window.alert()`, and some use `window.confirm()` for destructive actions.

**Should we implement a global toast system (e.g., Sonner or react-hot-toast)?**

### Q51: `window.confirm()` used for destructive actions

Programs page uses `window.confirm()` for delete confirmations. This is unstyled, can be spoofed, and doesn't match the app's design language.

**Should we replace with a custom confirmation modal component?**

### Q52: AuthProvider has large duplicated initialization blocks

`AuthProvider.tsx` has three near-identical blocks of code for creating trainer accounts (signUpAsTrainer, signInWithGoogle, signInWithApple), each ~35 lines. See Q9.

**Should this be refactored to a single function?**

### Q53: `verifyTrainerRequest` and `verifyAuthRequest` are separate functions with overlapping logic

`firebase-admin.ts` has `verifyAuthRequest()`, `verifyTrainerRequest()`, and `verifyAdminRequest()`. They share token verification but duplicate the role-checking logic.

**Should these be consolidated into a single `verifyRequest({ requiredRole? })` function?**

### Q54: Inline SQL-like query building in every endpoint

Every API route builds Firestore queries inline with repeated patterns (parse params, build query, apply filters, order, paginate). There's no query builder abstraction.

**Should we create a lightweight query builder utility for common patterns?**

### Q55: No TypeScript strict mode enforcement for API responses

API routes return untyped objects (`NextResponse.json({ ... })`). The response shape isn't validated against any interface.

**Should we define response types and validate them, or at least type the `NextResponse.json()` calls?**

### Q56: Console.log/error used throughout for logging

All API routes and Cloud Functions use `console.log` and `console.error` for logging. No structured logging, no log levels, no request correlation IDs.

**Should we implement structured logging (e.g., pino or winston)?**

### Q57: No request logging or audit trail

There's no middleware to log API requests (method, path, status, duration, user). Failed authentication attempts, financial operations, and admin actions are not audited.

**Should we add request logging middleware, especially for sensitive operations?**

### Q58: Inconsistent error response format

Some endpoints return `{ error: string }`, others return `{ error: string, code: string }`, and some include additional fields like `{ status: 'error', message: string }`.

**Should we standardize the error response format?**

---

## FRONTEND UX

### Q59: Dashboard layout returns null during loading/unauthenticated state

`web-cms/app/(dashboard)/layout.tsx`: Returns `null` when `loading === false && !user`, causing a blank screen flash before redirect.

**Should we show a "Redirecting..." state or loading spinner?**

### Q60: Header dropdowns (notifications and user menu) can open simultaneously

`Header.tsx`: The notification dropdown and user menu dropdown are independent states. Both can be open at the same time.

**Should we implement mutual exclusion (opening one closes the other)?**

### Q61: No keyboard navigation in dropdown menus

Dropdowns use `onClick` and `ref.current?.contains()` for click-outside but no keyboard handlers (Tab, Escape, Arrow keys) and no ARIA attributes (`role="menu"`, `aria-expanded`).

**Should we add accessible dropdown behavior?**

### Q62: Disabled search input without explanation

`Header.tsx`: The search input is disabled with tooltip "Em breve" (Coming soon). Keyboard users can't see why it's disabled.

**Should we add `aria-label` and/or hide the search input entirely until it's functional?**

### Q63: No loading indicators for inline actions

Actions like "Duplicate Program", "Archive Program", and "Delete Exercise" have no loading state. The user can click multiple times while the action is processing.

**Should we disable buttons during async operations and show loading spinners?**

### Q64: Students page health data fetch silently fails

The students page has a try/catch that silently swallows health data fetch errors. The UI shows empty charts with no indication that data failed to load.

**Should we show an error state or retry option for failed health data loads?**

### Q65: No image error handling

Avatar images and program cover images use `<img>` or Next.js `<Image>` without `onError` handlers. Broken image URLs show browser default broken-image icons.

**Should we add fallback images for broken URLs?**

### Q66: Finances page redirects without context on plan upgrade

`FinancesPage`: If the trainer doesn't have a Stripe account, the page shows upgrade prompts but doesn't explain why Stripe is needed or how the pricing works.

**Should we add an onboarding flow or explanation before redirecting to Stripe?**

---

## TESTING

### Q67: No tests anywhere in the codebase

There are zero test files in both `web-cms/` and `backend/functions/`. No unit tests, integration tests, or e2e tests.

**Should we prioritize adding tests? If so, what should be tested first? (Suggested priority: Stripe webhook handlers, auth utilities, critical API endpoints)**

---

## INFRASTRUCTURE

### Q68: Backend Cloud Functions use Node 20 but firebase-admin 11.x

`backend/functions/package.json`: Uses `firebase-admin: 11.11.1` (released 2023) with Node 20. The web-cms uses `firebase-admin: 13.6.0`.

**Should the backend be upgraded to firebase-admin 13.x for consistency and latest features?**

### Q69: No CI/CD pipeline visible

No GitHub Actions, CircleCI, or other CI/CD configuration files are present. Deployment appears to be manual.

**Should we set up CI/CD with at least: lint, type-check, build, and deploy steps?**

### Q70: No monitoring or alerting

No error tracking (Sentry, Bugsnag), no uptime monitoring, no performance monitoring (web vitals). Errors are only visible via `console.error` in server logs.

**Should we add error tracking and monitoring, especially for payment failures?**

### Q71: Firestore security rules may be stale

The security rules in `backend/firestore.rules` reference collections and fields. As the codebase evolves, rules may become out of sync with actual data access patterns.

**When were the rules last reviewed? Should we audit them against current API endpoints?**

### Q72: No backup strategy for Firestore

There's no scheduled Firestore backup configuration visible. Financial data (transactions, subscriptions) is critical.

**Should we configure Firestore scheduled exports?**

### Q73: Environment variables have no validation at startup

The app starts even if critical env vars (like `STRIPE_SECRET_KEY`, `FIREBASE_SERVICE_ACCOUNT_KEY`) are missing. Errors only surface when those services are first used.

**Should we validate required env vars at build/startup time?**

---

## MOBILE APP INTEGRATION

### Q74: API designed for web but consumed by mobile apps

The exercises, workouts, and programs endpoints return all fields including internal ones. Mobile apps may not need all this data, and responses could be large.

**Should we create mobile-optimized endpoints or use field selection (`?fields=id,name,thumbnail`)?**

### Q75: No API documentation for mobile developers

While the Swagger file exists, it doesn't document:

- Expected request/response examples
- Error codes and their meanings
- Rate limits
- Authentication flow for mobile apps (token refresh, etc.)

**Should we enhance the API documentation for mobile consumption?**

### Q76: Signed URLs expire in 7 days but mobile apps cache aggressively

PDF workout URLs are signed with 7-day expiry. Mobile apps typically cache resources and may try to use expired URLs.

**Should we implement a URL refresh mechanism or use longer-lived URLs for mobile?**

---

## SCALABILITY

### Q77: Single Firestore database for all data

All data (users, programs, workouts, exercises, transactions, chats, notifications, analytics) lives in one Firestore database. As data grows, hot collections (like `notifications`) could cause contention.

**Are there plans to shard or separate hot collections?**

### Q78: In-memory search will break at scale

Exercise and trainer search both fetch documents into memory and filter with JavaScript string matching. This works for hundreds of records but fails at thousands.

**At what scale should we introduce a proper search engine?**

### Q79: Dashboard page makes ~8 parallel Firestore queries on every load

The trainer dashboard queries programs, subscriptions, students, connections, analytics, notifications, and more on every page load, even if data hasn't changed.

**Should we implement stale-while-revalidate caching or pre-aggregate dashboard data?**

### Q80: Webhook handler does not queue heavy operations

The Stripe webhook handler (`POST /api/stripe/webhook`) performs up to 10+ Firestore operations synchronously (batch writes, notifications, chat creation). If any operation is slow, the webhook response is delayed, and Stripe may retry.

**Should heavy webhook operations be offloaded to a background queue (e.g., Cloud Tasks)?**
