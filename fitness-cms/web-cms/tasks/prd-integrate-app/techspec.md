# Technical Specification
# FitToday - Integração CMS ↔ App iOS

## Executive Summary

Esta especificação técnica detalha a implementação da integração entre o CMS web (Next.js) e o aplicativo iOS (Swift/SwiftUI) para envio de treinos em PDF via Firebase. A arquitetura utiliza Firebase Firestore como database, Firebase Storage para PDFs e Firebase Cloud Messaging para push notifications.

A implementação é dividida em duas partes: endpoints API no CMS para upload/gerenciamento de treinos, e componentes no app iOS para recebimento, visualização e tracking de progresso. A comunicação é feita exclusivamente via Firebase, garantindo sincronização em tempo real.

## System Architecture

### Component Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FIREBASE CLOUD                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Firestore   │  │   Storage    │  │  Cloud Messaging     │  │
│  │  (Database)  │  │   (PDFs)     │  │  (Push Notifications)│  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
└─────────┼─────────────────┼─────────────────────┼──────────────┘
          │                 │                     │
    ┌─────┴─────────────────┴─────────────────────┴─────┐
    │                                                    │
┌───┴────────────────┐                    ┌─────────────┴────────┐
│    WEB CMS         │                    │      APP iOS         │
│   (Next.js)        │                    │   (Swift/SwiftUI)    │
│                    │                    │                      │
│ • Upload PDF       │                    │ • Receive Push       │
│ • Send to student  │                    │ • View PDF           │
│ • View progress    │                    │ • Track progress     │
│ • Receive feedback │                    │ • Send feedback      │
└────────────────────┘                    └──────────────────────┘
```

**Componentes Principais:**

1. **CMS API Routes** (`/api/workouts/*`)
   - Upload de PDF para Storage
   - CRUD de workouts no Firestore
   - Trigger de push notifications

2. **CMS UI Components**
   - Modal de upload de treino
   - Lista de treinos enviados
   - Dashboard de progresso do aluno

3. **iOS Workout Module**
   - WorkoutListView (lista de treinos)
   - WorkoutDetailView (viewer de PDF)
   - ProgressTracker (tracking de conclusão)
   - FeedbackView (envio de feedback)

4. **Firebase Services**
   - Firestore: Collections `workouts`, `workout_progress`, `workout_feedback`
   - Storage: Bucket `workout-pdfs/`
   - FCM: Topic-based notifications

## Implementation Design

### Core Interfaces

#### CMS API Types (TypeScript)

```typescript
// types/workout.ts
interface Workout {
  id: string;
  trainerId: string;
  studentId: string;
  title: string;
  description?: string;
  pdfUrl: string;
  pdfPath: string; // Storage path
  durationWeeks?: number;
  startDate?: Timestamp;
  status: 'active' | 'completed' | 'archived';
  viewedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface WorkoutProgress {
  id: string;
  workoutId: string;
  studentId: string;
  completedDays: number[];
  totalDays: number;
  percentComplete: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityAt: Timestamp;
  updatedAt: Timestamp;
}

interface WorkoutFeedback {
  id: string;
  workoutId: string;
  studentId: string;
  trainerId: string;
  message: string;
  difficulty: 'too_easy' | 'adequate' | 'too_hard';
  trainerResponse?: string;
  respondedAt?: Timestamp;
  createdAt: Timestamp;
}
```

#### iOS Models (Swift)

```swift
// Models/Workout.swift
struct Workout: Identifiable, Codable {
    let id: String
    let trainerId: String
    let studentId: String
    let title: String
    let description: String?
    let pdfUrl: String
    let durationWeeks: Int?
    let startDate: Date?
    let status: WorkoutStatus
    let viewedAt: Date?
    let createdAt: Date

    enum WorkoutStatus: String, Codable {
        case active, completed, archived
    }
}

struct WorkoutProgress: Codable {
    let workoutId: String
    var completedDays: [Int]
    var totalDays: Int
    var percentComplete: Double
    var currentStreak: Int
    var longestStreak: Int
}
```

### Data Models

#### Firestore Collections

```
firestore/
├── workouts/
│   └── {workoutId}/
│       ├── trainerId: string
│       ├── studentId: string
│       ├── title: string
│       ├── description: string?
│       ├── pdfUrl: string
│       ├── pdfPath: string
│       ├── durationWeeks: number?
│       ├── startDate: timestamp?
│       ├── status: string
│       ├── viewedAt: timestamp?
│       ├── createdAt: timestamp
│       └── updatedAt: timestamp
│
├── workout_progress/
│   └── {progressId}/
│       ├── workoutId: string
│       ├── studentId: string
│       ├── completedDays: number[]
│       ├── totalDays: number
│       ├── percentComplete: number
│       ├── currentStreak: number
│       ├── longestStreak: number
│       ├── lastActivityAt: timestamp
│       └── updatedAt: timestamp
│
└── workout_feedback/
    └── {feedbackId}/
        ├── workoutId: string
        ├── studentId: string
        ├── trainerId: string
        ├── message: string
        ├── difficulty: string
        ├── trainerResponse: string?
        ├── respondedAt: timestamp?
        └── createdAt: timestamp
```

#### Firebase Storage Structure

```
storage/
└── workout-pdfs/
    └── {trainerId}/
        └── {workoutId}/
            └── workout.pdf
```

### API Endpoints

#### CMS API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/workouts` | Upload e criar novo treino |
| GET | `/api/workouts?trainerId={id}` | Listar treinos do trainer |
| GET | `/api/workouts/{id}` | Detalhes de um treino |
| PATCH | `/api/workouts/{id}` | Atualizar treino |
| DELETE | `/api/workouts/{id}` | Arquivar/deletar treino |
| GET | `/api/workouts/{id}/progress` | Ver progresso do aluno |
| GET | `/api/workouts/{id}/feedback` | Ver feedbacks |
| POST | `/api/workouts/{id}/feedback/reply` | Responder feedback |

#### Request/Response Examples

**POST /api/workouts**
```typescript
// Request (multipart/form-data)
{
  file: File,          // PDF file
  studentId: string,
  title: string,
  description?: string,
  durationWeeks?: number,
  startDate?: string   // ISO date
}

// Response
{
  id: string,
  pdfUrl: string,
  createdAt: string
}
```

**GET /api/workouts/{id}/progress**
```typescript
// Response
{
  workoutId: string,
  completedDays: number[],
  totalDays: number,
  percentComplete: number,
  currentStreak: number,
  longestStreak: number,
  lastActivityAt: string
}
```

## Integration Points

### Firebase Cloud Messaging (Push Notifications)

**Trigger:** Quando um workout é criado via POST /api/workouts

**Implementation:**
```typescript
// lib/notifications.ts
import { getMessaging } from 'firebase-admin/messaging';

export async function sendWorkoutNotification(
  studentFcmToken: string,
  workout: Workout
) {
  const messaging = getMessaging();

  await messaging.send({
    token: studentFcmToken,
    notification: {
      title: 'Novo treino recebido!',
      body: `${workout.title} - Toque para visualizar`,
    },
    data: {
      type: 'new_workout',
      workoutId: workout.id,
    },
    apns: {
      payload: {
        aps: {
          badge: 1,
          sound: 'default',
        },
      },
    },
  });
}
```

**iOS Handling:**
```swift
// AppDelegate.swift
func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    didReceive response: UNNotificationResponse
) async {
    let userInfo = response.notification.request.content.userInfo
    if let workoutId = userInfo["workoutId"] as? String {
        // Navigate to workout detail
        NotificationCenter.default.post(
            name: .openWorkout,
            object: nil,
            userInfo: ["workoutId": workoutId]
        )
    }
}
```

### Firebase Storage (PDF Upload)

**Upload Flow:**
```typescript
// app/api/workouts/route.ts
import { getStorage } from 'firebase-admin/storage';

const bucket = getStorage().bucket();
const filePath = `workout-pdfs/${trainerId}/${workoutId}/workout.pdf`;
const file = bucket.file(filePath);

await file.save(buffer, {
  metadata: {
    contentType: 'application/pdf',
  },
});

// Generate signed URL (valid for 7 days)
const [url] = await file.getSignedUrl({
  action: 'read',
  expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
});
```

## Testing Strategy

### Unit Tests

**CMS (Jest/Vitest):**
- `workouts.test.ts`: CRUD operations, validation
- `notifications.test.ts`: FCM trigger logic
- `storage.test.ts`: PDF upload/URL generation

**iOS (XCTest):**
- `WorkoutServiceTests.swift`: Firestore operations
- `ProgressTrackerTests.swift`: Streak calculation
- `PDFCacheTests.swift`: Download/cache logic

### Integration Tests

- Upload PDF → Verify Storage → Verify Firestore
- Create workout → Verify push notification sent
- Mark progress → Verify real-time sync

### Critical Test Scenarios

1. PDF upload with invalid file type → Error
2. Upload PDF > 10MB → Error with message
3. Student marks day complete → Progress updates
4. Offline progress sync → Queues and syncs

## Development Sequencing

### Build Order

#### Phase 1: CMS Backend (Week 1)
1. **Firebase Admin Setup**
   - Configure Storage bucket
   - Add FCM credentials
   - Create Firestore indexes

2. **API Routes**
   - POST /api/workouts (upload)
   - GET /api/workouts (list)
   - Notification trigger

#### Phase 2: CMS Frontend (Week 1-2)
3. **Upload Modal Component**
   - Drag & drop PDF
   - Student selector
   - Form validation

4. **Workouts Dashboard**
   - List sent workouts
   - View progress per student

#### Phase 3: iOS Core (Week 2-3)
5. **Workout List Screen**
   - Fetch workouts from Firestore
   - Badge for unread
   - Pull to refresh

6. **PDF Viewer**
   - Download and cache PDF
   - Native PDF rendering
   - Mark as viewed

#### Phase 4: iOS Progress (Week 3)
7. **Progress Tracking**
   - Day completion UI
   - Streak counter
   - Progress bar

8. **Feedback System**
   - Feedback form
   - Difficulty selector
   - Submit to Firestore

#### Phase 5: Polish & Test (Week 4)
9. **Push Notifications**
   - FCM setup in iOS
   - Deep linking

10. **Testing & QA**
    - End-to-end tests
    - Performance optimization

### Technical Dependencies

| Dependency | Required For | Status |
|------------|--------------|--------|
| Firebase Admin SDK | CMS backend | ✅ Installed |
| Firebase Storage | PDF storage | ✅ Configured |
| Firebase Cloud Messaging | Push notifications | ⚠️ Need FCM key |
| iOS Firebase SDK | App integration | ⚠️ Check version |

## Technical Considerations

### Key Decisions

**1. PDF Storage via Firebase Storage vs Firestore**
- **Chosen:** Firebase Storage
- **Reason:** Firestore has 1MB document limit; PDFs can be up to 10MB
- **Trade-off:** Need to manage signed URLs expiration

**2. Real-time sync vs Polling for progress**
- **Chosen:** Real-time listeners (Firestore snapshots)
- **Reason:** Better UX, instant updates for trainer dashboard
- **Trade-off:** Higher read costs, need to manage listeners

**3. Push notification via FCM vs APNs direct**
- **Chosen:** FCM (Firebase Cloud Messaging)
- **Reason:** Already using Firebase, unified interface
- **Trade-off:** Additional abstraction layer

### Known Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| PDF URL expiration | User can't view old workout | Regenerate URL on access |
| Large PDF download on cellular | Bad UX, data usage | Show warning, cache aggressively |
| FCM token refresh | Missed notifications | Implement token refresh handler |
| Offline progress loss | User frustration | Local persistence + sync queue |

### Performance Requirements

- PDF upload: < 30 seconds for 10MB
- Push delivery: < 5 seconds after upload
- PDF viewer load: < 3 seconds (cached)
- Progress sync: Real-time (< 500ms)

### Security Considerations

1. **Storage Rules:** Only trainer can write, only student can read their PDFs
2. **Firestore Rules:** Validate ownership on all operations
3. **Signed URLs:** 7-day expiration, regenerate on demand
4. **Input validation:** PDF type check, size limit enforcement

### Relevant Files

**CMS (Existing):**
- `lib/firebase-admin.ts` - Firebase Admin config
- `types/index.ts` - Shared types
- `providers/AuthProvider.tsx` - Auth context

**CMS (To Create):**
- `app/api/workouts/route.ts` - Workouts API
- `app/api/workouts/[id]/route.ts` - Single workout API
- `app/api/workouts/[id]/progress/route.ts` - Progress API
- `app/api/workouts/[id]/feedback/route.ts` - Feedback API
- `components/workouts/UploadWorkoutModal.tsx` - Upload UI
- `components/workouts/WorkoutsList.tsx` - List component
- `types/workout.ts` - Workout types

**iOS (To Create):**
- `Models/Workout.swift` - Data models
- `Services/WorkoutService.swift` - Firebase operations
- `Views/Workouts/WorkoutListView.swift` - List screen
- `Views/Workouts/WorkoutDetailView.swift` - PDF viewer
- `Views/Workouts/ProgressTrackerView.swift` - Progress UI
- `ViewModels/WorkoutViewModel.swift` - Business logic

---

**Autor:** FitToday Team
**Data:** 2026-02-04
**Versão:** 1.0
