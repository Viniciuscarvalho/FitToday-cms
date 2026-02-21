# Technical Specification

**Project Name:** FitToday — Public Trainers API & Review System
**Version:** 1.0
**Date:** 2026-02-21
**Author:** Claude (Spec-Driven)
**Status:** Approved

---

## Overview

### Problem Statement
The FitToday mobile app has no way to discover trainers. The existing admin trainer API (`/api/admin/trainers`) requires admin authentication and exposes internal data. We need public endpoints for the mobile app marketplace.

### Proposed Solution
Four new API routes under `/api/trainers/` that expose public trainer profiles and a review system. Plus a new `reviews` Firestore collection.

### Goals
- Public trainer discovery for mobile app users
- Review system for social proof and trainer quality ranking
- Consistent with existing API patterns (Next.js App Router + Firebase Admin SDK)

---

## Scope

### In Scope
- `GET /api/trainers` — list active trainers with filters
- `GET /api/trainers/[id]` — single trainer profile
- `GET /api/trainers/[id]/reviews` — trainer reviews
- `POST /api/trainers/[id]/reviews` — submit review (authenticated)
- `GET /api/trainers/count` — active trainer count
- `TrainerReview` TypeScript type
- Aggregate rating update on review submission

### Out of Scope
- Full-text search (requires third-party service)
- Review moderation UI in CMS
- NPS scoring
- Trainer profile editing API

---

## Technical Approach

### Architecture Overview
Standard Next.js App Router API routes using Firebase Admin SDK, following existing patterns in `/api/programs/` and `/api/workouts/`. Public endpoints skip auth verification. Review submission uses `verifyAuthRequest` for generic auth (students).

### Key Technologies
- Next.js App Router: API route handlers
- Firebase Admin Firestore: Data queries
- Firebase Admin Auth: Token verification for review submission

### Components

#### Component 1: Public Trainers List (`/api/trainers/route.ts`)
**Purpose:** Return paginated list of active trainers for mobile app marketplace.

**Query Parameters:**
- `limit` (default: 20, max: 50)
- `offset` (default: 0) — implemented via Firestore cursor pagination
- `specialty` — filter by specialties array-contains
- `city` — filter by profile.location.city

**Response:**
```json
{
  "trainers": [
    {
      "id": "uid",
      "displayName": "João Silva",
      "photoURL": "https://...",
      "profile": {
        "bio": "Personal trainer...",
        "specialties": ["hypertrophy", "weight_loss"],
        "experience": 5,
        "location": { "city": "São Paulo", "state": "SP" }
      },
      "stats": {
        "rating": 4.8,
        "totalReviews": 12,
        "totalStudents": 25
      }
    }
  ],
  "total": 45,
  "hasMore": true
}
```

**Firestore Query:**
```typescript
let query = adminDb.collection('users')
  .where('role', '==', 'trainer')
  .where('status', '==', 'active');

if (specialty) {
  query = query.where('profile.specialties', 'array-contains', specialty);
}

// Firestore doesn't support nested field filters well for location.city,
// so we filter city in-memory after fetch (or use a denormalized 'city' field)
```

**Data Projection:** Strip sensitive fields (email, phone, financial, subscription details) before returning.

#### Component 2: Single Trainer Profile (`/api/trainers/[id]/route.ts`)
**Purpose:** Return full public profile for a single active trainer.

**Response:** Same as list item but with full certifications, social media, coverPhotoURL.

#### Component 3: Trainer Reviews (`/api/trainers/[id]/reviews/route.ts`)

**GET — List Reviews:**
```json
{
  "reviews": [
    {
      "id": "reviewId",
      "studentName": "Maria Souza",
      "studentPhotoURL": "https://...",
      "rating": 5,
      "comment": "Excelente profissional!",
      "createdAt": "2026-02-15T10:00:00Z"
    }
  ],
  "total": 12,
  "averageRating": 4.8
}
```

**POST — Submit Review:**
```json
// Request
{
  "rating": 5,
  "comment": "Excelente profissional!"
}

// Response (201)
{
  "id": "reviewId",
  "createdAt": "2026-02-21T10:00:00Z"
}
```

**On review submission:**
1. Verify student auth via `verifyAuthRequest`
2. Check student has/had a workout with this trainer (via `workouts` collection)
3. Upsert review (one per student-trainer pair)
4. Recalculate trainer's aggregate rating:
   ```typescript
   const snapshot = await adminDb.collection('reviews')
     .where('trainerId', '==', trainerId)
     .get();
   const ratings = snapshot.docs.map(d => d.data().rating);
   const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
   await adminDb.collection('users').doc(trainerId).update({
     'store.rating': Math.round(avg * 10) / 10,
     'store.totalReviews': ratings.length,
   });
   ```

#### Component 4: Trainer Count (`/api/trainers/count/route.ts`)

**GET Response:**
```json
{ "total": 45 }
```

Uses Firestore `count()` aggregation for efficiency.

---

## Data Model

### New Collection: `reviews`
```typescript
interface TrainerReview {
  id: string;
  trainerId: string;
  studentId: string;
  studentName: string;
  studentPhotoURL?: string;
  rating: number;           // 1-5, validated server-side
  comment?: string;         // max 500 chars
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Firestore indexes needed:**
- `reviews` — composite index: `trainerId` ASC + `createdAt` DESC

### Denormalized Fields on Trainer Document
Already exist in `PersonalTrainer.store`:
- `store.rating: number` — updated on review submission
- `store.totalReviews: number` — updated on review submission
- `store.totalStudents: number` — updated elsewhere

---

## API File Structure

```
app/api/trainers/
├── route.ts                    # GET /api/trainers (list)
├── count/
│   └── route.ts                # GET /api/trainers/count
└── [id]/
    ├── route.ts                # GET /api/trainers/[id] (profile)
    └── reviews/
        └── route.ts            # GET + POST /api/trainers/[id]/reviews
```

---

## Error Handling

| Scenario | HTTP Status | Error Code |
|----------|-------------|------------|
| Trainer not found or inactive | 404 | TRAINER_NOT_FOUND |
| Invalid rating (not 1-5) | 400 | INVALID_RATING |
| Comment too long (>500 chars) | 400 | COMMENT_TOO_LONG |
| Student not authenticated | 401 | UNAUTHORIZED |
| Student has no relationship with trainer | 403 | NOT_ENROLLED |
| Firestore unavailable | 500 | DATABASE_ERROR |

---

## Testing Strategy

### Integration Testing
1. List trainers returns only active trainers with correct fields
2. Single trainer returns 404 for non-existent/inactive trainers
3. Review submission requires auth, validates rating, updates aggregates
4. Duplicate review from same student updates existing (upsert)
5. Count endpoint returns correct number
