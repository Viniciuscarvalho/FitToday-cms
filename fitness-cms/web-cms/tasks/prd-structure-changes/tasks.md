# Tasks — Public Trainers API & Review System

## Task 1: Add TrainerReview type (S)

### Objective
Add the `TrainerReview` interface to the types system.

### Subtasks
- [ ] 1.1 Add `TrainerReview` interface to `types/index.ts`
- [ ] 1.2 Add `PublicTrainerProfile` response type to `types/index.ts`
- [ ] 1.3 Add `TrainerReviewResponse` and `TrainerListResponse` API response types

### Success Criteria
- Types compile without errors
- Types match the techspec data model

### Dependencies
- None

### status: pending

---

## Task 2: Create GET /api/trainers endpoint (M)

### Objective
Public endpoint to list active trainers with filtering and pagination.

### Subtasks
- [ ] 2.1 Create `app/api/trainers/route.ts` with GET handler
- [ ] 2.2 Query Firestore for active trainers with role filter
- [ ] 2.3 Implement specialty filter (array-contains)
- [ ] 2.4 Implement pagination (limit/offset via startAfter cursor)
- [ ] 2.5 Strip sensitive fields from response (email, phone, financial, subscription)
- [ ] 2.6 Return total count alongside results

### Success Criteria
- Only active trainers returned
- No sensitive data exposed
- Pagination works correctly
- Specialty filter works

### Dependencies
- Task 1 (types)

### status: pending

---

## Task 3: Create GET /api/trainers/[id] endpoint (S)

### Objective
Public endpoint to get a single trainer's full profile.

### Subtasks
- [ ] 3.1 Create `app/api/trainers/[id]/route.ts` with GET handler
- [ ] 3.2 Verify trainer exists and has status === 'active'
- [ ] 3.3 Return full public profile (bio, certifications, social media, stats)
- [ ] 3.4 Return 404 for non-existent or inactive trainers

### Success Criteria
- Returns correct public profile
- No sensitive data exposed
- 404 for invalid trainers

### Dependencies
- Task 1 (types)

---

## Task 4: Create GET/POST /api/trainers/[id]/reviews endpoint (L)

### Objective
Reviews endpoint: public GET for listing, authenticated POST for submission.

### Subtasks
- [ ] 4.1 Create `app/api/trainers/[id]/reviews/route.ts`
- [ ] 4.2 Implement GET: list reviews by trainerId, sorted by createdAt desc, with pagination
- [ ] 4.3 Implement POST: verify student auth via verifyAuthRequest
- [ ] 4.4 POST: validate rating (1-5) and comment (max 500 chars)
- [ ] 4.5 POST: verify student has/had a workout relationship with trainer
- [ ] 4.6 POST: upsert review (one per student-trainer pair)
- [ ] 4.7 POST: recalculate trainer aggregate rating and totalReviews
- [ ] 4.8 Return average rating with review list

### Success Criteria
- GET returns reviews sorted by date
- POST requires auth and validates input
- Duplicate reviews from same student update existing
- Trainer aggregate rating updated correctly

### Dependencies
- Task 1 (types), Task 3 (trainer profile route exists)

---

## Task 5: Create GET /api/trainers/count endpoint (S)

### Objective
Lightweight endpoint returning total active trainer count.

### Subtasks
- [ ] 5.1 Create `app/api/trainers/count/route.ts`
- [ ] 5.2 Use Firestore count() aggregation
- [ ] 5.3 Return `{ total: number }`

### Success Criteria
- Returns correct count of active trainers
- Uses efficient aggregation (not full collection read)

### Dependencies
- None

---

## Task 6: Build validation and push (S)

### Objective
Verify everything builds, commit, and push.

### Subtasks
- [ ] 6.1 Run `npx next build` and verify zero errors
- [ ] 6.2 Commit all changes
- [ ] 6.3 Push to main

### Dependencies
- Tasks 1-5
