# Product Requirements Document (PRD)

**Project Name:** Fix Mobile-CMS-Firebase Communication Errors
**Document Version:** 1.0
**Date:** 2026-03-10
**Author:** Claude
**Status:** Draft

---

## Executive Summary

**Problem Statement:**
Three critical integration issues between the mobile app, Firebase, and CMS are breaking core user flows: (1) students are not being found and connection requests from the mobile app don't generate visible notifications in the CMS, (2) the notifications page at `/cms/notifications` returns 404 because it was never created, and (3) sending workout PDFs fails with "The string did not match the expected pattern" error, preventing trainers from delivering workouts.

**Proposed Solution:**
Fix the three integration points: ensure connection request notifications are surfaced in the CMS with a new notifications page, fix the workout PDF upload pipeline to handle startDate serialization correctly, and add real-time notification listener in the header/sidebar.

**Business Value:**
These are blocking issues for the core trainer-student workflow. Without connection requests visible, trainers can't onboard students. Without workout sending, trainers can't deliver their primary service. The chat/notifications gap breaks communication entirely.

**Success Metrics:**

- Connection requests from mobile arrive and are visible in the CMS within 5 seconds
- Notifications page loads successfully at `/cms/notifications`
- Workout PDF uploads complete without pattern match errors
- End-to-end flow: student connects -> trainer sees notification -> trainer sends workout -> student receives it

---

## Project Overview

### Background

FitToday CMS is a SaaS fitness platform connecting personal trainers (via web CMS) with students (via mobile app). The core flow is: student connects to trainer -> trainer accepts -> trainer sends workout PDFs -> student follows the program.

### Current State

1. **Connection requests**: The mobile app calls `POST /api/trainers/[id]/connect` which correctly creates a `trainerStudents` document and a notification in `users/{trainerId}/notifications`. However, the CMS Header component has hardcoded fake notifications and the "Ver todas as atividades" link points to `/cms/notifications` which doesn't exist.
2. **Notifications page**: No route exists at `web-cms/app/(dashboard)/cms/notifications/page.tsx`. The Header links to it, causing 404.
3. **Workout PDF upload**: The `startDate` field is passed as a form string (`"2026-03-15"`), and `new Date(startDate)` creates a JS Date object that's stored directly in Firestore. On some environments/browsers, this triggers Firebase's "The string did not match the expected pattern" validation error because Firestore expects a Timestamp, not a raw Date object cast with `as any`.

### Desired State

- Real-time notification counter in Header pulling from `users/{uid}/notifications`
- Full notifications page listing all in-app notifications with mark-as-read
- Correct Firestore Timestamp serialization for `startDate` in workout uploads
- Seamless end-to-end connection and workout delivery flow

---

## Functional Requirements

### FR-001: Real-Time Notification Counter in Header [MUST]

**Description:**
Replace the hardcoded notification dot in the Header with a real-time listener on `users/{trainerId}/notifications` subcollection, showing unread count.

**Acceptance Criteria:**

- Header bell icon shows count of unread notifications (where `isRead === false`)
- Count updates in real-time via Firestore `onSnapshot`
- Clicking bell opens dropdown with the 5 most recent notifications
- "Ver todas" link navigates to `/cms/notifications`

**Priority:** P0
**Related Epic:** EPIC-001

---

### FR-002: Notifications Page [MUST]

**Description:**
Create `/cms/notifications` page that lists all in-app notifications for the authenticated trainer from `users/{uid}/notifications` subcollection.

**Acceptance Criteria:**

- Page loads at `/cms/notifications` without 404
- Displays notifications in reverse chronological order
- Each notification shows: title, body, relative time, read status
- Click on notification marks it as read and navigates to `action.destination` if present
- "Mark all as read" button updates all unread notifications
- Empty state when no notifications exist

**Priority:** P0
**Related Epic:** EPIC-001

---

### FR-003: Fix Workout PDF Upload Pattern Error [MUST]

**Description:**
Fix the `startDate` serialization in `POST /api/workouts` to use Firestore `Timestamp.fromDate()` instead of raw `new Date()` cast with `as any`, and validate that the date string is in a valid ISO format before creating the Date object.

**Acceptance Criteria:**

- `startDate` is converted to a proper Firestore Timestamp before writing to Firestore
- Invalid date strings return a 400 error with a descriptive message
- Workout upload succeeds with valid startDate (e.g., "2026-03-15")
- Workout upload succeeds without startDate (optional field)
- PDF uploads work for both PDF and image file types

**Priority:** P0
**Related Epic:** EPIC-002

---

### FR-004: Add Notifications Link to Sidebar [SHOULD]

**Description:**
Add a "Notificacoes" entry in the sidebar navigation with a badge showing unread count, similar to how "Solicitacoes" works.

**Acceptance Criteria:**

- Sidebar shows "Notificacoes" item with Bell icon
- Badge shows unread notification count (real-time)
- Clicking navigates to `/cms/notifications`

**Priority:** P1
**Related Epic:** EPIC-001

---

## Out of Scope

1. Push notifications to the CMS web app (web push) - future enhancement
2. Notification preferences/settings - future enhancement
3. Mobile app changes - this PRD covers CMS-side fixes only
4. Chat system fixes beyond the 404 (chat is Elite-only and works for that plan)

---

## Risks and Mitigations

| Risk                                                  | Impact | Probability | Mitigation                                                                  |
| ----------------------------------------------------- | ------ | ----------- | --------------------------------------------------------------------------- |
| Firestore security rules may block notification reads | High   | Medium      | Test with actual trainer auth token; verify rules allow subcollection reads |
| Performance impact of real-time listeners             | Low    | Low         | Limit query to last 20 notifications; unsubscribe on unmount                |
| startDate format varies across mobile platforms       | Medium | Medium      | Add robust date parsing with fallback and validation                        |
