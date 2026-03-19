# Technical Specification

**Project Name:** FitToday CMS - Code Review Resolution
**Version:** 1.0
**Date:** 2026-03-18
**Author:** Claude Code (Tech Lead Review)
**Status:** Draft - Awaiting QUESTIONS.md Answers

---

## Overview

### Problem Statement

The FitToday CMS has 80 identified issues across security, performance, architecture, data integrity, bugs, code quality, UX, testing, and infrastructure. This spec defines the technical approach for resolving them in 3 phases.

### Goals

- Secure all financial endpoints within Phase 1
- Eliminate N+1 queries and unbounded fetches in Phase 2
- Establish testing, CI/CD, and code quality baseline in Phase 3

---

## Phase 1: Security - Technical Approach

### 1.1 Stripe Endpoint Authentication (Epic 1)

**Pattern:** Add auth middleware to all Stripe routes except webhook.

**Implementation:**

```typescript
// For trainer-only endpoints (account, connect, products, prices):
const authResult = await verifyTrainerRequest(
  request.headers.get("authorization"),
);
if (!authResult.isTrainer || !authResult.uid) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

// Ownership check - trainer can only access their own Stripe account:
const trainerDoc = await adminDb.collection("users").doc(authResult.uid).get();
const trainerData = trainerDoc.data();
if (trainerData?.financial?.stripeAccountId !== requestedAccountId) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

**For checkout endpoint:**

```typescript
// Verify student auth + validate entities exist
const authResult = await verifyAuthRequest(
  request.headers.get("authorization"),
);
// Verify programId exists
// Verify trainerId has active Stripe account
// Verify trainerStripeAccountId matches trainer's actual account
```

**Files to modify:**

- `app/api/stripe/account/route.ts` - Add verifyTrainerRequest + ownership check
- `app/api/stripe/connect/route.ts` - Add verifyTrainerRequest
- `app/api/stripe/checkout/route.ts` - Add verifyAuthRequest + entity validation
- `app/api/stripe/products/route.ts` - Add verifyTrainerRequest
- `app/api/stripe/prices/route.ts` - Add verifyTrainerRequest

---

### 1.2 Webhook Idempotency (Epic 3)

**Pattern:** Use Stripe event ID as dedup key. Check before creating records.

**Implementation:**

```typescript
// At the top of webhook handler:
const eventId = event.id;
const processedRef = adminDb.collection("processedWebhookEvents").doc(eventId);
const processed = await processedRef.get();
if (processed.exists) {
  return NextResponse.json({ received: true, duplicate: true });
}

// After successful processing:
await processedRef.set({
  type: event.type,
  processedAt: FieldValue.serverTimestamp(),
});
```

**Also in handleProgramCheckoutCompleted:**

```typescript
// Check if subscription already exists for this checkout session
const existingCheck = await adminDb
  .collection("subscriptions")
  .where("stripeCheckoutSessionId", "==", session.id)
  .limit(1)
  .get();
if (!existingCheck.empty) return; // Already processed
```

**TTL cleanup:** Add a scheduled function to delete processedWebhookEvents older than 7 days.

---

### 1.3 Error Sanitization (Epic 4)

**Pattern:** Create utility function for safe error responses.

```typescript
// lib/api-errors.ts
export function apiError(
  message: string,
  status: number,
  code?: string,
  internalError?: any,
): NextResponse {
  if (internalError) {
    console.error(`[${code || "ERROR"}] ${message}:`, internalError);
  }
  return NextResponse.json(
    { error: message, ...(code && { code }) },
    { status },
  );
}
```

**Usage:**

```typescript
// Before:
return NextResponse.json({ error: error.message || "Failed" }, { status: 500 });

// After:
return apiError("Failed to get account details", 500, "STRIPE_ERROR", error);
```

---

### 1.4 Auth Cookie Security (Epic 2)

**Option A (Recommended): API route sets HttpOnly cookie**

```typescript
// New: POST /api/auth/session
export async function POST(request: NextRequest) {
  const { token } = await request.json();
  // Verify token server-side
  const decoded = await adminAuth.verifyIdToken(token);

  const response = NextResponse.json({ success: true });
  response.cookies.set("auth-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
  return response;
}
```

**Option B: Document current approach as acceptable**

- Middleware is UX routing only, not security boundary
- All API endpoints verify tokens server-side
- XSS risk is mitigated by React's built-in escaping

**Decision needed from Q2/Q3 answers.**

---

### 1.5 OAuth Registration (Epic 6)

**Refactor: Extract trainer defaults**

```typescript
// lib/trainer-defaults.ts
export function createTrainerDefaults(
  uid: string,
  email: string,
  displayName: string,
  photoURL: string,
): Partial<PersonalTrainer> {
  return {
    uid,
    email,
    displayName,
    photoURL,
    createdAt: serverTimestamp() as any,
    updatedAt: serverTimestamp() as any,
    isActive: true,
    role: "trainer",
    status: "pending",
    profile: { bio: "", specialties: [], certifications: [], experience: 0 },
    store: {
      slug: "",
      isVerified: false,
      rating: 0,
      totalReviews: 0,
      totalSales: 0,
      totalStudents: 0,
    },
    financial: { totalEarnings: 0, pendingBalance: 0, availableBalance: 0 },
    subscription: {
      plan: "starter",
      status: "active",
      features: PLANS.starter.features,
    },
  };
}
```

---

## Phase 2: Performance + Data Integrity - Technical Approach

### 2.1 N+1 Query Resolution (Epic 7)

**Connections - Batch lookup:**

```typescript
// Instead of Promise.all with individual gets:
const studentIds = snap.docs.map((d) => d.data().studentId);
const studentRefs = studentIds.map((id) => adminDb.collection("users").doc(id));
const studentDocs = await adminDb.getAll(...studentRefs);
const studentMap = new Map(studentDocs.map((d) => [d.id, d.data()]));

// Then map connections using studentMap lookup (O(1) per connection)
```

**Workouts - Denormalization:**
Add `progressPercent`, `feedbackCount`, `completedDays` fields directly to workout document. Update them via Cloud Function triggers or at write time.

**Trainers - Composite index:**
Add to `firestore.indexes.json`:

```json
{
  "collectionGroup": "users",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "role", "order": "ASCENDING" },
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "profile.location.city", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

---

### 2.2 Unbounded Query Protection (Epic 8)

**Student analytics:** Add `startDate` and `endDate` required params. Default to last 30 days.

**Admin metrics:** Query pre-aggregated `analytics/{trainerId}/daily/{date}` collection instead of scanning all trainers.

**Admin trainers:** Add composite index for `(role, status, createdAt)`.

**Exercise search:** Cap at 200 documents. Add note about future Algolia/Typesense integration.

---

### 2.3 Data Integrity (Epic 9)

**Deterministic chat room IDs:**

```typescript
function chatRoomId(trainerId: string, studentId: string): string {
  return `chat_${trainerId}_${studentId}`;
}

// Usage: adminDb.collection('chats').doc(chatRoomId(trainerId, studentId))
// No more duplicate check needed - Firestore handles it
```

**Negative counter guard:**

```typescript
// Use runTransaction instead of FieldValue.increment for decrements:
await adminDb.runTransaction(async (tx) => {
  const trainerRef = adminDb.collection("users").doc(trainerId);
  const trainer = await tx.get(trainerRef);
  const current = trainer.data()?.store?.totalStudents || 0;
  tx.update(trainerRef, {
    "store.totalStudents": Math.max(0, current - 1),
  });
});
```

**Platform fee from plan:**

```typescript
// In webhook handler, look up trainer's plan:
const trainerDoc = await adminDb.collection("users").doc(trainerId).get();
const plan = trainerDoc.data()?.subscription?.plan || "starter";
const commissionRate = PLANS[plan]?.commissionRate || 10;
const platformFee = Math.round((amount * commissionRate) / 100);
```

---

### 2.4 Review Rating Optimization (Epic 10)

**Incremental approach:**

```typescript
// On review submit, instead of fetching all reviews:
const isUpdate = existingReview !== null;
const oldRating = existingReview?.rating || 0;
const newRating = body.rating;

await adminDb.runTransaction(async (tx) => {
  const trainerRef = adminDb.collection("users").doc(trainerId);
  const trainer = await tx.get(trainerRef);
  const store = trainer.data()?.store || {};

  let totalReviews = store.totalReviews || 0;
  let ratingSum = store.ratingSum || store.rating * totalReviews;

  if (isUpdate) {
    ratingSum = ratingSum - oldRating + newRating;
  } else {
    ratingSum += newRating;
    totalReviews += 1;
  }

  tx.update(trainerRef, {
    "store.rating": totalReviews > 0 ? ratingSum / totalReviews : 0,
    "store.ratingSum": ratingSum,
    "store.totalReviews": totalReviews,
  });

  // Set/update review doc
  tx.set(reviewRef, reviewData, { merge: true });
});
```

---

## Phase 3: Code Quality + UX + Infrastructure

### 3.1 Error Boundary (Epic 14)

```typescript
// components/ErrorBoundary.tsx
'use client';
import { Component, ReactNode } from 'react';

export class ErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('ErrorBoundary caught:', error);
    // Future: send to Sentry
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-8 text-center">
          <h2>Algo deu errado</h2>
          <button onClick={() => this.setState({ hasError: false })}>
            Tentar novamente
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

### 3.2 Toast System

Install `sonner` and add `<Toaster />` to root layout:

```bash
npm install sonner
```

### 3.3 Auth Verification Consolidation (Epic 15)

```typescript
// lib/firebase-admin.ts
interface VerifyOptions {
  requiredRole?: "trainer" | "admin" | "student";
}

export async function verifyRequest(
  authHeader: string | null,
  options?: VerifyOptions,
) {
  // Token verification (shared)
  // Role check (optional, based on options.requiredRole)
  // Returns: { isAuthenticated, uid, role, error }
}
```

### 3.4 Testing Infrastructure (Epic 16)

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

**vitest.config.ts:**

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
```

**Test priority:**

1. `__tests__/api/stripe/webhook.test.ts` - Mock Stripe events, verify Firestore writes
2. `__tests__/lib/firebase-admin.test.ts` - Auth verification functions
3. `__tests__/api/exercises/route.test.ts` - CRUD operations

### 3.5 CI/CD (Epic 17)

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
        working-directory: web-cms
      - run: npx tsc --noEmit
        working-directory: web-cms
      - run: npm run lint
        working-directory: web-cms
      - run: npx vitest run
        working-directory: web-cms
```

---

## Dependencies

| Dependency             | Version | Purpose             |
| ---------------------- | ------- | ------------------- |
| sonner                 | latest  | Toast notifications |
| vitest                 | latest  | Test framework      |
| @testing-library/react | latest  | Component testing   |

---

## Risks and Mitigations

| Risk                                              | Mitigation                                           |
| ------------------------------------------------- | ---------------------------------------------------- |
| Adding auth to Stripe endpoints breaks mobile app | Coordinate release with mobile team; test thoroughly |
| Firestore index changes require deployment        | Deploy indexes before code changes                   |
| Webhook idempotency table grows unbounded         | TTL cleanup job (delete events > 7 days)             |
| Denormalization creates data sync issues          | Use Firestore transactions for atomic updates        |
