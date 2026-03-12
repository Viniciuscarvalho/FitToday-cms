# Notifications Architecture

## Dual-Path Read Strategy (Intentional Design)

The notification system uses two read paths by design, optimized for different use cases.
This is **intentional architecture** — do not attempt to consolidate into a single path.

### Path 1: Real-Time Reads (Firestore Listener)

**Used by:** Header bell icon, Sidebar badge, Notifications page

**How it works:**

- Client-side `onSnapshot()` on `users/{uid}/notifications` subcollection
- Sub-100ms latency for new notification delivery
- Automatic UI updates when notifications arrive or are marked as read

**Files:**

- `components/dashboard/Header.tsx` — listens for latest 5, shows unread count
- `components/dashboard/Sidebar.tsx` — listens for `isRead == false` count
- `app/(dashboard)/cms/notifications/page.tsx` — full list with live updates

**When to use:** Any UI that needs instant updates (badges, counters, live lists)

### Path 2: API Bulk Reads

**Used by:** Server-side operations, batch processing, historical queries

**Endpoints:**

- `GET /api/notifications?limit=20&unreadOnly=true` — paginated list
- `PATCH /api/notifications` — mark all as read (batch operation)
- `PATCH /api/notifications/[id]` — mark single as read

**When to use:** Batch operations, filtered queries, server-side processing

### Write Path: Always API

All notification creation goes through the server-side `createNotification()` utility
in `lib/notifications.ts`. This ensures:

- Consistent schema across all notification types
- Server timestamps for accurate ordering
- Audit trail via server-side logging

**Files that create notifications:**

- `app/api/trainers/[id]/connect/route.ts` — connection_request
- `app/api/connections/[id]/route.ts` — connection_accepted, connection_rejected, connection_cancelled

## Standard Notification Schema

All notifications follow this schema (enforced by `lib/notifications.ts`):

```typescript
{
  id: string;                    // Auto-generated document ID
  type: NotificationType;        // connection_request | connection_accepted | ...
  userId: string;                // Target user receiving the notification
  userRole: 'trainer' | 'student';
  title: string;
  body: string;
  isRead: boolean;               // Default: false
  createdAt: Timestamp;          // Server timestamp

  // Optional fields
  actor?: {                      // Who triggered the notification
    id: string;
    name: string;
    avatar?: string;
  };
  action?: {                     // Navigation on click
    type: 'navigate';
    destination: string;
  };
  relatedEntityType?: string;    // e.g., 'connection'
  relatedEntityId?: string;      // e.g., connection document ID
  groupId?: string;              // For group-targeted notifications
  groupType?: string;            // 'trainers' | 'followers'
  payload?: Record<string, unknown>;  // Extra data for specific types
}
```

## Notification Types

| Type                   | Trigger                     | Target      | Destination               |
| ---------------------- | --------------------------- | ----------- | ------------------------- |
| `connection_request`   | Student requests connection | Trainer     | `/cms/connections`        |
| `connection_accepted`  | Trainer accepts             | Student     | `/chat`                   |
| `connection_rejected`  | Trainer rejects             | Student     | `/`                       |
| `connection_cancelled` | Either party cancels        | Other party | `/cms/connections` or `/` |
| `new_workout`          | Trainer sends workout       | Student     | Deep link                 |
| `workout_completed`    | Student completes           | Trainer     | Student page              |
| `payment`              | Payment processed           | Trainer     | `/cms/finances`           |

## Why Dual-Path?

| Concern     | Real-Time Path              | API Path                   |
| ----------- | --------------------------- | -------------------------- |
| Latency     | Sub-100ms                   | 200-500ms                  |
| Cost        | Per-listener billing        | Per-read billing           |
| Filtering   | Limited (Firestore queries) | Full server-side filtering |
| Batching    | Not supported               | Batch writes via API       |
| Audit trail | Client-side only            | Server-side logging        |

The dual-path approach gives us the best of both worlds: instant UI updates for the
user experience, and robust server-side operations for batch processing and auditing.

**Acceptable until:** Server-side validation is required on reads (e.g., permission
checks beyond Firestore rules). At that point, consider adding a WebSocket layer
to maintain real-time while routing through the API.
