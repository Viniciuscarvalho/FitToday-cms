# Implementation Plan - FitToday CMS ↔ iOS Integration

## Overview

Implementação da integração entre CMS e App iOS para envio de treinos em PDF via Firebase.

## Execution Order

### Sprint 1: Foundation (Tasks 9, 1, 2)

| Order | Task | Description | Est. |
|-------|------|-------------|------|
| 1 | **9.0** | Instalar dependências (react-dropzone, react-pdf) | 15min |
| 2 | **1.0** | Setup Firebase Storage + Types | 30min |
| 3 | **2.0** | API POST /api/workouts (upload) | 1h |

**Deliverable:** Upload de PDF funcional via API

### Sprint 2: Backend Complete (Tasks 3, 4, 5)

| Order | Task | Description | Est. |
|-------|------|-------------|------|
| 4 | **3.0** | Push notification service | 45min |
| 5 | **4.0** | API CRUD completo | 1h |
| 6 | **5.0** | API progress/feedback | 30min |

**Deliverable:** Backend completo com todas as APIs

### Sprint 3: Frontend (Tasks 6, 7, 8)

| Order | Task | Description | Est. |
|-------|------|-------------|------|
| 7 | **6.0** | Upload modal component | 1.5h |
| 8 | **7.0** | Workouts list page | 1.5h |
| 9 | **8.0** | Workout detail page | 1h |

**Deliverable:** UI completa no CMS

## Technical Notes

### Key Files to Create

```
app/api/workouts/
├── route.ts                    # POST, GET (list)
└── [id]/
    ├── route.ts                # GET, PATCH, DELETE
    ├── progress/route.ts       # GET progress
    └── feedback/route.ts       # GET, POST feedback

components/workouts/
├── UploadWorkoutModal.tsx
├── WorkoutsList.tsx
├── WorkoutCard.tsx
└── WorkoutProgress.tsx

types/
└── workout.ts

lib/
├── notifications.ts
└── storage.ts (or add to firebase-admin.ts)
```

### Firebase Collections

```
workouts/
workout_progress/
workout_feedback/
```

### Dependencies to Install

```bash
npm install react-dropzone @react-pdf-viewer/core @react-pdf-viewer/default-layout pdfjs-dist
```

## Checkpoint

- [ ] Phase 1 complete
- [ ] Sprint 1 complete
- [ ] Sprint 2 complete
- [ ] Sprint 3 complete
- [ ] All tests passing
- [ ] Committed and PR created
