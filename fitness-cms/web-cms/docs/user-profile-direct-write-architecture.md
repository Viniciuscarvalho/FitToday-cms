# User Profile: Direct Firestore Write Architecture

## Decision

User profile updates (displayName, bio, specialties, experience, social media, location, avatar) are written **directly from the client to Firestore** using the Firebase Client SDK, bypassing the API layer. This is an intentional architecture decision acceptable for the current stage, with a planned migration path to API-mediated writes.

## Status: Acceptable (temporary)

This pattern is valid while:

- Profile fields are simple, self-contained data (no cross-document side effects)
- The only actor is the authenticated user editing their own profile
- No server-side validation beyond Firestore rules is required
- No downstream systems need to react to profile changes (e.g., search index, cache invalidation)

## Current Implementation

### Write Path

1. **CMS Profile Page** (`app/(dashboard)/cms/profile/page.tsx`)
   - Updates Firebase Auth profile via `updateProfile(auth.currentUser, { displayName, photoURL })`
   - Updates Firestore user document via `updateDoc(doc(db, 'users', user.uid), { ... })`
   - Uploads avatar to Firebase Storage at `users/{userId}/profile/avatar.{ext}`
   - Calls `refreshUser()` to sync local state after save

2. **Mobile App** (iOS/Android)
   - Same pattern: direct Firestore writes for profile fields
   - Direct Storage uploads for avatar

### Fields Updated Directly

| Field                           | Source             | Validation                             |
| ------------------------------- | ------------------ | -------------------------------------- |
| `displayName`                   | User input         | Firestore rules (isOwner)              |
| `photoURL`                      | Storage upload URL | Storage rules (isOwner + isValidImage) |
| `profile.bio`                   | User input         | Firestore rules (isOwner)              |
| `profile.specialties`           | Multi-select       | Firestore rules (isOwner)              |
| `profile.experience`            | Number input       | Firestore rules (isOwner)              |
| `profile.socialMedia.instagram` | User input         | Firestore rules (isOwner)              |
| `profile.socialMedia.youtube`   | User input         | Firestore rules (isOwner)              |
| `profile.location.city`         | User input         | Firestore rules (isOwner)              |
| `profile.location.state`        | User input         | Firestore rules (isOwner)              |
| `updatedAt`                     | Client timestamp   | Firestore rules (isOwner)              |

## Security Rules Validation

### Firestore (`backend/firestore.rules`)

```
match /users/{userId} {
  allow read: if isAuthenticated();
  allow create: if isOwner(userId);
  allow update: if isOwner(userId);    // ← Only the user can update their own doc
  allow delete: if false;              // ← No deletion allowed
}
```

The `isOwner(userId)` function enforces:

```
function isOwner(userId) {
  return isAuthenticated() && request.auth.uid == userId;
}
```

This guarantees that `request.auth.uid` must match the document's `userId` path segment. No user can write to another user's profile document.

### Firebase Storage (`backend/storage.rules`)

```
match /users/{userId}/profile/{fileName} {
  allow read: if isAuthenticated();
  allow write: if isOwner(userId) && isValidImage();
}
```

Storage rules enforce:

- Only the owner can upload to their profile path
- File must be an image (`image/*` content type)
- File must be under 10MB

### Client-Side Validation (defense in depth)

The CMS profile page adds additional client-side checks:

- Avatar file type restricted to `image/jpeg`, `image/png`, `image/gif`
- Avatar size capped at 2MB (stricter than the 10MB storage rule)
- Experience field constrained to 0-50 range via `min`/`max` attributes

## Why This Is Acceptable Now

1. **No cross-document writes**: Profile updates only touch the user's own document. No subscriptions, connections, or other users are affected.
2. **Strong security rules**: Firestore rules ensure ownership. The `isOwner` pattern is the same used across the entire app.
3. **Dual-write to Firebase Auth**: `displayName` and `photoURL` are synced to Firebase Auth, which is fine from the client since `updateProfile` only works on `auth.currentUser`.
4. **Low abuse surface**: The worst case is a user writing bad data to their own profile — they only hurt themselves.

## Why This Should Migrate to API

1. **Server-side validation**: Field-level validation (e.g., max bio length, valid URLs for social media, profanity filter) should happen server-side.
2. **Audit trail**: API writes can log profile changes for compliance.
3. **Side effects**: Future features (e.g., profile completeness score, search index updates, notifications to connected students) require server orchestration.
4. **Consistency**: All other write operations (connections, workouts, notifications) already go through the API layer.

## Migration Plan: Future `PATCH /api/profile` Endpoint

### Phase 1: Create API endpoint

- `PATCH /api/profile` — accepts partial profile updates
- Server-side validation for all fields (length limits, URL format, allowed specialties)
- Returns updated profile data
- Handles avatar upload via multipart form or presigned URL

### Phase 2: Migrate clients

- Update CMS profile page to use `apiRequest('/api/profile', { method: 'PATCH', body })` instead of direct `updateDoc`
- Update mobile app to call the API endpoint
- Keep Firebase Auth sync on the server side via Admin SDK

### Phase 3: Tighten Firestore rules

- Change `allow update: if isOwner(userId)` to restrict which fields can be updated directly
- Or remove client write access entirely: `allow update: if false` (all writes via Admin SDK)
- Keep read access for real-time listeners

### Trigger for migration

Migrate when any of these conditions are met:

- A feature requires reacting to profile changes (search index, notifications)
- Content moderation or profanity filtering is needed
- Profile fields gain business logic (e.g., trainer verification status)
- Audit requirements emerge

## Trade-offs

| Aspect          | Direct Write (current)        | API Write (future)              |
| --------------- | ----------------------------- | ------------------------------- |
| Latency         | Lower (no server hop)         | Higher (server round-trip)      |
| Validation      | Client + Firestore rules only | Full server-side validation     |
| Side effects    | Not possible                  | Orchestrated server-side        |
| Offline support | Firebase SDK handles offline  | Requires custom offline queue   |
| Complexity      | Minimal                       | Additional endpoint + migration |
| Security        | isOwner rules (sufficient)    | isOwner rules + server checks   |
