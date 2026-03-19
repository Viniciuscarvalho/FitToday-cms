# Technical Specification

**Project Name:** Fix Mobile-CMS-Firebase Communication Errors
**Version:** 1.0
**Date:** 2026-03-10
**Author:** Claude
**Status:** Draft

---

## Overview

### Problem Statement

Three integration bugs break the trainer-student communication flow: missing notifications page (404), hardcoded Header notifications instead of real Firestore data, and Firestore Timestamp serialization error when uploading workouts with a startDate.

### Proposed Solution

1. Create notifications page at `/cms/notifications`
2. Replace hardcoded Header notifications with real-time Firestore listener
3. Fix startDate serialization in workout API using `Timestamp.fromDate()`
4. Add notifications link with badge to sidebar

### Goals

- Zero 404 errors on notifications page
- Real-time notification delivery from mobile to CMS
- Successful workout PDF uploads with any valid date format

---

## Scope

### In Scope

- New notifications page component
- Header notification dropdown with real-time data
- Sidebar notifications link with badge
- Workout API startDate fix
- Notification mark-as-read API endpoint

### Out of Scope

- Mobile app changes
- Web push notifications
- Chat system modifications
- Notification preferences UI

---

## Technical Approach

### Architecture Overview

All changes are within the Next.js CMS (`web-cms/`). The notifications system reads from the existing `users/{uid}/notifications` Firestore subcollection that's already populated by the connection request API. The workout fix is a one-line Timestamp conversion in the API route.

### Key Technologies

- Next.js 14 App Router: Page creation and API routes
- Firebase Client SDK: Real-time listeners (`onSnapshot`) for notifications
- Firebase Admin SDK: Server-side notification management and workout fix

### Components

#### Component 1: Notifications Page

**Purpose:** Display all in-app notifications for the trainer

**File:** `web-cms/app/(dashboard)/cms/notifications/page.tsx`

**Responsibilities:**

- Fetch notifications from `users/{uid}/notifications` subcollection
- Display in reverse chronological order
- Mark individual or all notifications as read
- Navigate to `action.destination` on click

**Data Source:** Firestore `users/{trainerId}/notifications` (client-side real-time)

---

#### Component 2: Header Notification System (Refactor)

**Purpose:** Replace hardcoded notifications with real Firestore data

**File:** `web-cms/components/dashboard/Header.tsx`

**Changes:**

- Add `onSnapshot` listener on `users/{uid}/notifications` where `isRead == false`
- Replace hardcoded "3 Novas" with actual unread count
- Replace hardcoded notification items with real data
- Keep dropdown UI structure, just change data source

---

#### Component 3: Sidebar Notifications Link

**Purpose:** Add notifications nav item with real-time badge

**File:** `web-cms/components/dashboard/Sidebar.tsx`

**Changes:**

- Add `Bell` icon import from lucide-react
- Add notifications item to `navigation` array with `badge: true` and `badgeType: 'notifications'`
- Add second `onSnapshot` listener for notifications unread count (or share state)

---

#### Component 4: Workout API Fix

**Purpose:** Fix startDate Timestamp serialization

**File:** `web-cms/app/api/workouts/route.ts`

**Changes (line ~137):**

```typescript
// BEFORE (broken):
startDate: startDate ? new Date(startDate) as any : undefined,

// AFTER (fixed):
startDate: startDate ? Timestamp.fromDate(new Date(startDate)) : undefined,
```

Import `Timestamp` from `firebase-admin/firestore` (already imported as `FieldValue`).

---

#### Component 5: Notification Mark-as-Read API

**Purpose:** Server-side endpoint to mark notifications as read

**File:** `web-cms/app/api/notifications/route.ts` (new)
**File:** `web-cms/app/api/notifications/[id]/route.ts` (new)

**Endpoints:**

- `PATCH /api/notifications/[id]` - Mark single notification as read
- `PATCH /api/notifications` - Mark all notifications as read (body: `{ action: "markAllRead" }`)

---

### Data Model

#### Notification (existing subcollection: `users/{uid}/notifications`)

```typescript
interface InAppNotification {
  id: string;
  userId: string;
  userRole: "trainer" | "student";
  type:
    | "connection_request"
    | "connection_accepted"
    | "connection_rejected"
    | "new_workout";
  title: string;
  body: string;
  action?: {
    type: "navigate";
    destination: string;
  };
  relatedEntityType?: string;
  relatedEntityId?: string;
  isRead: boolean;
  createdAt: Timestamp;
}
```

### API Design

#### Endpoint: PATCH /api/notifications/[id]

**Purpose:** Mark a single notification as read

**Request:**

```json
{ "isRead": true }
```

**Response:**

```json
{ "success": true }
```

---

#### Endpoint: PATCH /api/notifications

**Purpose:** Mark all notifications as read

**Request:**

```json
{ "action": "markAllRead" }
```

**Response:**

```json
{ "success": true, "updated": 5 }
```

---

## Implementation Considerations

### Error Handling

- Invalid notification IDs return 404
- Auth failures return 401
- Firestore unavailable returns 500
- Invalid startDate format returns 400 with descriptive message

### Real-Time Listener Management

- Use `onSnapshot` with cleanup in `useEffect` return
- Limit notification queries to 50 most recent
- Unsubscribe on component unmount to prevent memory leaks

### Date Validation for startDate

```typescript
// Validate date string before conversion
if (startDate) {
  const parsed = new Date(startDate);
  if (isNaN(parsed.getTime())) {
    return NextResponse.json(
      { error: "Invalid startDate format. Use ISO date (YYYY-MM-DD)" },
      { status: 400 },
    );
  }
}
```

---

## Testing Strategy

### Manual Testing

1. **Connection flow**: Register student on mobile -> request connection -> verify notification appears in CMS Header and notifications page
2. **Notifications page**: Navigate to `/cms/notifications` -> verify no 404 -> verify notifications list
3. **Mark as read**: Click notification -> verify isRead updates -> verify count decreases
4. **Workout upload**: Upload PDF with startDate -> verify no pattern error -> verify workout created in Firestore
5. **Workout upload without date**: Upload PDF without startDate -> verify it works (optional field)

### Edge Cases

- Trainer with zero notifications (empty state)
- Rapid connection requests (multiple notifications arriving)
- Invalid startDate formats: empty string, "abc", timestamp number
- Large notification count (50+)

---

## Files Changed

| File                                                 | Action | Description                 |
| ---------------------------------------------------- | ------ | --------------------------- |
| `web-cms/app/(dashboard)/cms/notifications/page.tsx` | CREATE | New notifications page      |
| `web-cms/app/api/notifications/route.ts`             | CREATE | Mark-all-read API           |
| `web-cms/app/api/notifications/[id]/route.ts`        | CREATE | Mark-single-read API        |
| `web-cms/components/dashboard/Header.tsx`            | MODIFY | Real-time notifications     |
| `web-cms/components/dashboard/Sidebar.tsx`           | MODIFY | Add notifications nav item  |
| `web-cms/app/api/workouts/route.ts`                  | MODIFY | Fix startDate serialization |
