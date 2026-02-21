# Product Requirements Document (PRD)

**Project Name:** FitToday — Public Trainers API & Review System
**Document Version:** 1.0
**Date:** 2026-02-21
**Author:** Claude (Spec-Driven)
**Status:** Approved

---

## Executive Summary

**Problem Statement:**
The FitToday mobile app needs a way for students (potential clients) to discover available personal trainers on the platform. Currently, there is no public-facing API that exposes trainer profiles — the only trainer listing exists behind admin authentication at `/api/admin/trainers`. Students have no way to browse, compare, or evaluate trainers before enrolling.

**Proposed Solution:**
Create a set of public API routes that expose active trainer profiles (photo, name, bio, specialties, rating, reviews) to the mobile app. Add a review system where students can rate and review their trainers, which feeds into trainer rankings and discoverability.

**Business Value:**
- Enables the marketplace side of FitToday — students find trainers organically
- Reviews create social proof, increasing trainer sign-ups and student conversions
- Trainer ratings drive quality — trainers with better reviews get more visibility

**Success Metrics:**
- API responds in < 200ms for trainer listings
- Students can browse, filter, and view trainer profiles from the mobile app
- Review submission and display works end-to-end

---

## User Personas

### Primary Persona: Student (Mobile App User)
**Goals:**
- Find a qualified personal trainer in their area/specialty
- See ratings and reviews before committing
- View trainer bio, certifications, and specialties

**Pain Points:**
- No in-app discovery of trainers
- Must find trainers externally and then register

### Secondary Persona: Personal Trainer (CMS User)
**Goals:**
- Be discoverable by potential students
- Build reputation through reviews and ratings
- Showcase specialties and certifications

---

## Functional Requirements

### FR-001: List Active Trainers [MUST]
**Description:** Public API endpoint that returns a paginated list of active trainers with their public profile data.

**Acceptance Criteria:**
- GET `/api/trainers` returns only trainers with `status === 'active'`
- Response includes: photoURL, displayName, bio, specialties, rating, totalReviews, totalStudents, location
- Supports pagination via `limit` and `offset` query params
- Supports filtering by `specialty` and `city`
- No authentication required

### FR-002: Get Trainer Profile [MUST]
**Description:** Public API endpoint returning a single trainer's full public profile.

**Acceptance Criteria:**
- GET `/api/trainers/[id]` returns trainer profile if active
- Response includes full profile: photo, name, bio, specialties, certifications, experience, social media, rating, reviews count, total students
- Returns 404 if trainer not found or not active
- No authentication required

### FR-003: List Trainer Reviews [MUST]
**Description:** Public API endpoint returning paginated reviews for a specific trainer.

**Acceptance Criteria:**
- GET `/api/trainers/[id]/reviews` returns reviews sorted by `createdAt` desc
- Each review includes: studentName, rating (1-5), comment, createdAt
- Supports pagination via `limit` and `offset`
- No authentication required

### FR-004: Submit Trainer Review [MUST]
**Description:** Authenticated endpoint for students to submit a review for their trainer.

**Acceptance Criteria:**
- POST `/api/trainers/[id]/reviews` requires student authentication
- Only students who are/were enrolled with the trainer can leave a review
- One review per student per trainer (upsert)
- Review includes: rating (1-5), comment (optional)
- Updates trainer's aggregate `store.rating` and `store.totalReviews`

### FR-005: Trainer Count Endpoint [SHOULD]
**Description:** Lightweight endpoint returning the total count of active trainers.

**Acceptance Criteria:**
- GET `/api/trainers/count` returns `{ total: number }`
- Uses Firestore count() aggregation for efficiency

---

## Non-Functional Requirements

### NFR-001: Performance [MUST]
- Trainer list endpoint must respond in < 300ms for up to 50 results
- Use Firestore compound indexes for filtered queries

### NFR-002: Security [MUST]
- Public endpoints expose only public profile data (no email, phone, financial data)
- Review submission requires valid Firebase Auth token
- Prevent review spam: one review per student-trainer pair

---

## Out of Scope

- Search by name (full-text search requires Algolia/Typesense — future feature)
- Trainer profile editing via public API (done through CMS)
- Payment/enrollment flow (handled by Stripe Connect endpoints)
- NPS scoring (future Analytics feature)

---

## Data Model

### TrainerReview (new Firestore collection: `reviews`)
```typescript
interface TrainerReview {
  id: string;
  trainerId: string;
  studentId: string;
  studentName: string;
  studentPhotoURL?: string;
  rating: number;           // 1-5
  comment?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Public Trainer Response (API contract)
```typescript
interface PublicTrainerProfile {
  id: string;
  displayName: string;
  photoURL?: string;
  profile: {
    bio: string;
    specialties: string[];
    certifications: { name: string; institution: string; year: number }[];
    experience: number;
    socialMedia?: { instagram?: string; youtube?: string; tiktok?: string };
    coverPhotoURL?: string;
    location?: { city: string; state: string; country: string };
  };
  stats: {
    rating: number;
    totalReviews: number;
    totalStudents: number;
  };
}
```
