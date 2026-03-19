# Tasks - Fix Mobile-CMS-Firebase Communication Errors

## Task Overview

| Task                                             | Size | Priority | Dependencies |
| ------------------------------------------------ | ---- | -------- | ------------ |
| 1.0 Fix workout startDate serialization          | S    | P0       | None         |
| 2.0 Create notification mark-as-read API         | M    | P0       | None         |
| 3.0 Create notifications page                    | L    | P0       | Task 2.0     |
| 4.0 Refactor Header with real-time notifications | M    | P0       | None         |
| 5.0 Add notifications to Sidebar                 | S    | P1       | None         |

---

# Task 1.0: Fix Workout startDate Serialization (S)

<critical>Read the prd.md and techspec.md files in this folder. If you do not read these files, your task will be invalidated.</critical>

## Overview

Fix the "The string did not match the expected pattern" error when sending workouts with a startDate. The issue is that `new Date(startDate) as any` is not a valid Firestore value - it needs to be a Firestore Timestamp.

## Subtasks

- [ ] 1.1 Import `Timestamp` from `firebase-admin/firestore` in `web-cms/app/api/workouts/route.ts`
- [ ] 1.2 Add startDate validation before conversion (return 400 for invalid dates)
- [ ] 1.3 Replace `new Date(startDate) as any` with `Timestamp.fromDate(new Date(startDate))`
- [ ] 1.4 Also fix the same pattern in `web-cms/app/api/workouts/[id]/route.ts` PATCH handler

## Success Criteria

- Workout upload with startDate="2026-03-15" succeeds
- Workout upload without startDate succeeds
- Invalid startDate returns 400 error
- No "pattern" errors in Firebase

## Relevant Files

- `web-cms/app/api/workouts/route.ts` (line 137)
- `web-cms/app/api/workouts/[id]/route.ts` (line 137)

## status: pending

---

# Task 2.0: Create Notification Mark-as-Read API (M)

<critical>Read the prd.md and techspec.md files in this folder. If you do not read these files, your task will be invalidated.</critical>

## Overview

Create API endpoints to mark notifications as read (single and bulk). These use Firebase Admin SDK to update the `users/{uid}/notifications` subcollection.

## Subtasks

- [ ] 2.1 Create `web-cms/app/api/notifications/[id]/route.ts` with PATCH handler
  - Verify trainer auth
  - Update `isRead: true` on `users/{uid}/notifications/{id}`
- [ ] 2.2 Create `web-cms/app/api/notifications/route.ts` with PATCH handler
  - Verify trainer auth
  - Query all `isRead: false` notifications for user
  - Batch update all to `isRead: true`
  - Return count of updated
- [ ] 2.3 Create `web-cms/app/api/notifications/route.ts` GET handler
  - Verify trainer auth
  - Return paginated notifications from `users/{uid}/notifications`
  - Support `?limit=20&unreadOnly=true` query params

## Success Criteria

- `PATCH /api/notifications/abc123` marks that notification as read
- `PATCH /api/notifications` with `{ action: "markAllRead" }` marks all unread as read
- `GET /api/notifications` returns notifications list
- All endpoints require valid trainer auth token

## Relevant Files

- `web-cms/app/api/notifications/route.ts` (new)
- `web-cms/app/api/notifications/[id]/route.ts` (new)
- `web-cms/lib/firebase-admin.ts` (reference for auth patterns)

## status: pending

---

# Task 3.0: Create Notifications Page (L)

<critical>Read the prd.md and techspec.md files in this folder. If you do not read these files, your task will be invalidated.</critical>

## Overview

Create the `/cms/notifications` page that displays all in-app notifications for the trainer. Uses real-time Firestore listener for live updates. Follow the same UI patterns as the connections page.

## Subtasks

- [ ] 3.1 Create `web-cms/app/(dashboard)/cms/notifications/page.tsx`
- [ ] 3.2 Implement real-time listener on `users/{uid}/notifications` subcollection
- [ ] 3.3 Display notifications grouped by date (today, yesterday, older)
- [ ] 3.4 Implement click-to-navigate: clicking a notification marks it read and navigates to `action.destination`
- [ ] 3.5 Add "Mark all as read" button using the bulk API from Task 2.0
- [ ] 3.6 Empty state when no notifications exist
- [ ] 3.7 Visual distinction between read and unread notifications (bold/background)

## Success Criteria

- `/cms/notifications` loads without 404
- Notifications display with title, body, time, read status
- Clicking navigates to the correct destination
- Mark all as read works
- Matches the design language of the rest of the CMS

## Dependencies

- Task 2.0 (notification APIs for mark-as-read)

## Relevant Files

- `web-cms/app/(dashboard)/cms/notifications/page.tsx` (new)
- `web-cms/app/(dashboard)/cms/connections/page.tsx` (reference for UI patterns)
- `web-cms/lib/api-client.ts` (for apiRequest)

## status: pending

---

# Task 4.0: Refactor Header with Real-Time Notifications (M)

<critical>Read the prd.md and techspec.md files in this folder. If you do not read these files, your task will be invalidated.</critical>

## Overview

Replace the hardcoded notification data in the Header component with real-time Firestore data. The bell icon should show actual unread count, and the dropdown should show real notifications.

## Subtasks

- [ ] 4.1 Add Firebase imports and `onSnapshot` listener for `users/{uid}/notifications`
- [ ] 4.2 Replace hardcoded "3 Novas" badge with actual unread count
- [ ] 4.3 Replace hardcoded notification items with real notification data (last 5)
- [ ] 4.4 Add click handler to mark notification as read and navigate
- [ ] 4.5 Hide notification dot when unread count is 0
- [ ] 4.6 Cleanup: unsubscribe from listener on unmount

## Success Criteria

- Bell icon shows real unread count
- Dropdown shows last 5 real notifications
- Count updates in real-time when new notifications arrive
- No memory leaks from listener

## Relevant Files

- `web-cms/components/dashboard/Header.tsx`
- `web-cms/providers/AuthProvider.tsx` (for user context)

## status: pending

---

# Task 5.0: Add Notifications to Sidebar (S)

<critical>Read the prd.md and techspec.md files in this folder. If you do not read these files, your task will be invalidated.</critical>

## Overview

Add a "Notificacoes" navigation item to the sidebar with a badge showing unread notification count, similar to how "Solicitacoes" shows pending connection count.

## Subtasks

- [ ] 5.1 Import `Bell` from lucide-react in Sidebar.tsx
- [ ] 5.2 Add notifications item to `navigation` array after "Solicitacoes"
- [ ] 5.3 Add second `onSnapshot` listener for `users/{uid}/notifications` where `isRead == false`
- [ ] 5.4 Display unread count badge on the notifications nav item

## Success Criteria

- Sidebar shows "Notificacoes" with Bell icon
- Badge shows real unread count
- Badge updates in real-time
- Clicking navigates to `/cms/notifications`

## Relevant Files

- `web-cms/components/dashboard/Sidebar.tsx`

## status: pending
