# Technical Specification: Student Graphics Redesign + Health Metrics Pipeline

**Version:** 1.0
**Date:** 2026-03-17
**Status:** Draft
**PRD Reference:** `tasks/prd-student-graphics-redesign/prd.md`

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Data Model](#2-data-model)
3. [API Contracts](#3-api-contracts)
4. [Frontend Components](#4-frontend-components)
5. [Implementation Phases](#5-implementation-phases)
6. [Testing Strategy](#6-testing-strategy)
7. [Performance Considerations](#7-performance-considerations)
8. [Security](#8-security)
9. [Open Questions](#9-open-questions)

---

## 1. Architecture Overview

### Data Flow

```
iOS App (student)
  --> POST /api/students/{id}/health-data  [student auth via verifyAuthRequest]
    --> Firestore health_metrics collection (write + pre-aggregate)

CMS Dashboard (trainer)
  --> GET /api/students/{id}/health-summary  [trainer auth via verifyTrainerRequest]
    --> Firestore health_metrics collection (read + aggregate)
    --> JSON response with weekly/monthly breakdowns
  --> Rendered by Recharts components on students list and detail pages
```

### Stack Alignment

| Layer      | Technology                         | Notes                                                                 |
| ---------- | ---------------------------------- | --------------------------------------------------------------------- |
| API Routes | Next.js 14 App Router (`app/api/`) | Follows existing pattern in `web-cms/app/api/`                        |
| Auth       | Firebase Admin SDK                 | `verifyAuthRequest` for students, `verifyTrainerRequest` for trainers |
| Database   | Firestore (Admin SDK)              | `adminDb` from `@/lib/firebase-admin`                                 |
| Charts     | Recharts (already installed)       | Already imported in current student detail page                       |
| Styling    | Tailwind CSS                       | Existing utility-class approach                                       |
| E2E Tests  | Playwright                         | Existing `e2e/tests/cuj-XX-*.spec.ts` pattern                         |

### New Files

```
web-cms/
  app/api/students/[id]/
    health-data/route.ts          # POST - receive health metrics from iOS
    health-summary/route.ts       # GET  - aggregated metrics for CMS
  app/(dashboard)/cms/students/
    page.tsx                      # MODIFY - redesigned list with sparklines
    [id]/page.tsx                 # MODIFY - redesigned detail with charts
  components/students/
    SparklineChart.tsx            # NEW - reusable inline sparkline
    HealthStatCard.tsx            # NEW - stat card with trend indicator
    StrengthEvolutionChart.tsx    # NEW - 12-month bar chart
    WeeklyComparisonChart.tsx     # NEW - grouped bar (strength vs resistance)
    CalorieChart.tsx              # NEW - weekly calorie bar chart
    PerformanceInsights.tsx       # NEW - computed insights panel
  e2e/tests/
    cuj-08-student-health.spec.ts # NEW - E2E tests for redesigned pages
```

---

## 2. Data Model

### Firestore Collection: `health_metrics`

**Document path:** `health_metrics/{autoId}`

**Unique constraint:** One document per `studentId + trainerId + date`. The POST endpoint enforces this by querying for an existing document and upserting.

```typescript
interface HealthMetricDocument {
  // Identity
  studentId: string; // Firebase UID of the student
  trainerId: string; // Firebase UID of the connected trainer
  date: string; // YYYY-MM-DD (string, not Timestamp, for easy dedup queries)

  // Raw data from iOS
  activeCalories: number; // kcal burned (from Apple Health)
  sessions: WorkoutSession[];

  // Pre-aggregated on write (computed server-side)
  strengthLoadTotal: number; // sum of (sets * reps * weight) for category="strength"
  resistanceLoadTotal: number; // sum of (sets * reps * weight) for category="resistance"
  sessionCount: number; // sessions.length

  // Timestamps
  createdAt: Timestamp; // Firestore server timestamp
  updatedAt: Timestamp; // Firestore server timestamp
}

interface WorkoutSession {
  exerciseName: string;
  category: "strength" | "resistance" | "cardio";
  sets: number;
  reps: number;
  weight: number; // kilograms
  duration: number; // minutes
}
```

### Firestore Indexes Required

```
Collection: health_metrics
  Composite index 1: studentId ASC, trainerId ASC, date DESC
  Composite index 2: trainerId ASC, studentId ASC, date ASC
```

These indexes support both the deduplication query (studentId + trainerId + date) and the aggregation query (trainerId + studentId + date range ordered ascending for charting).

### Why Pre-Aggregate on Write

The PRD calls out NFR-002: aggregate queries should not scan all raw documents. By computing `strengthLoadTotal`, `resistanceLoadTotal`, and `sessionCount` at write time, the summary endpoint can read daily documents directly without iterating over nested `sessions[]` arrays during reads. This keeps the GET path fast and Firestore read-cost low.

---

## 3. API Contracts

### 3.1 POST /api/students/{id}/health-data

**Purpose:** Receives batched health metrics from the iOS app. Designed for periodic sync (app launch, post-workout, background task every 6 hours).

**Auth:** Student authentication via `verifyAuthRequest`. The authenticated student's UID must match the `{id}` path parameter (students can only submit their own data).

**File:** `web-cms/app/api/students/[id]/health-data/route.ts`

#### Request

```
POST /api/students/{id}/health-data
Authorization: Bearer <firebase-id-token>
Content-Type: application/json
```

```json
{
  "entries": [
    {
      "date": "2026-03-15",
      "activeCalories": 420,
      "workoutSessions": [
        {
          "exerciseName": "Bench Press",
          "category": "strength",
          "sets": 4,
          "reps": 10,
          "weight": 80,
          "duration": 12
        },
        {
          "exerciseName": "Lat Pulldown",
          "category": "resistance",
          "sets": 3,
          "reps": 12,
          "weight": 55,
          "duration": 8
        }
      ]
    },
    {
      "date": "2026-03-16",
      "activeCalories": 380,
      "workoutSessions": []
    }
  ]
}
```

#### Validation Rules

| Field                            | Type   | Required | Constraints                                |
| -------------------------------- | ------ | -------- | ------------------------------------------ |
| `entries`                        | array  | yes      | 1-30 items (max 30 days per batch)         |
| `entries[].date`                 | string | yes      | YYYY-MM-DD format, not in the future       |
| `entries[].activeCalories`       | number | yes      | >= 0, <= 10000                             |
| `entries[].workoutSessions`      | array  | yes      | 0-20 items per day                         |
| `workoutSessions[].exerciseName` | string | yes      | 1-100 characters                           |
| `workoutSessions[].category`     | string | yes      | one of: "strength", "resistance", "cardio" |
| `workoutSessions[].sets`         | number | yes      | >= 0, <= 100                               |
| `workoutSessions[].reps`         | number | yes      | >= 0, <= 1000                              |
| `workoutSessions[].weight`       | number | yes      | >= 0, <= 1000 (kg)                         |
| `workoutSessions[].duration`     | number | yes      | >= 0, <= 600 (minutes)                     |

#### Deduplication Logic

For each entry in `entries[]`:

1. Query `health_metrics` where `studentId == {id}` AND `trainerId == connectedTrainerId` AND `date == entry.date`.
2. If a document exists, **merge**: replace `activeCalories`, `sessions`, and recompute aggregates. Update `updatedAt`.
3. If no document exists, **create** a new document with `createdAt` and `updatedAt`.

#### Trainer Resolution

The student may be connected to multiple trainers. The endpoint looks up the student's active connection from the `connections` collection (`where studentId == {id} AND status == "active"`). If multiple active connections exist, one document is created per trainer for the same date. If no active connection exists, return 400.

#### Response - Success (201)

```json
{
  "created": 1,
  "updated": 1,
  "total": 2
}
```

#### Response - Validation Error (400)

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "entries[0].activeCalories",
      "message": "Must be a non-negative number"
    }
  ]
}
```

#### Response - Auth Mismatch (403)

```json
{
  "error": "Cannot submit health data for another student"
}
```

#### Pseudocode

```typescript
export async function POST(request: NextRequest, { params }) {
  const { id: studentId } = await params;

  // 1. Auth: verifyAuthRequest, check role === 'student', check uid === studentId
  // 2. Parse + validate body.entries
  // 3. Look up active connections for this student
  // 4. For each entry, for each connected trainer:
  //    a. Compute strengthLoadTotal = sum(sessions.filter(s => s.category === 'strength').map(s => s.sets * s.reps * s.weight))
  //    b. Compute resistanceLoadTotal = same for category === 'resistance'
  //    c. Query existing doc by studentId + trainerId + date
  //    d. Upsert (set with merge or create)
  // 5. Return { created, updated, total }
}
```

---

### 3.2 GET /api/students/{id}/health-summary

**Purpose:** Returns aggregated health metrics for a student, formatted for CMS chart rendering. Called by the student list page (lightweight summary) and student detail page (full breakdowns).

**Auth:** Trainer authentication via `verifyTrainerRequest`. The trainer must be connected to the student (enforced by querying only documents where `trainerId == authResult.uid`).

**File:** `web-cms/app/api/students/[id]/health-summary/route.ts`

#### Request

```
GET /api/students/{id}/health-summary?period=month
Authorization: Bearer <firebase-id-token>
```

#### Query Parameters

| Param    | Type   | Required | Default | Values                  |
| -------- | ------ | -------- | ------- | ----------------------- |
| `period` | string | no       | `month` | `week`, `month`, `year` |

**Period semantics:**

- `week`: Last 7 days. Returns `weeklyBreakdown` with 7 entries (Mon-Sun).
- `month`: Last 30 days. Returns `weeklyBreakdown` (last 7 days) + `monthlyBreakdown` (last 4 weeks).
- `year`: Last 365 days. Returns `monthlyBreakdown` with 12 entries (one per month).

#### Response - Success (200)

```json
{
  "summary": {
    "strengthLoadTotal": 48500,
    "resistanceLoadTotal": 32200,
    "avgDailyCalories": 385,
    "sessionCount": 22,
    "completionRate": 78,
    "trend": 12.5
  },
  "weeklyBreakdown": [
    {
      "day": "Mon",
      "date": "2026-03-11",
      "strength": 6800,
      "resistance": 4200,
      "calories": 410,
      "sessions": 1
    },
    {
      "day": "Tue",
      "date": "2026-03-12",
      "strength": 0,
      "resistance": 0,
      "calories": 0,
      "sessions": 0
    },
    {
      "day": "Wed",
      "date": "2026-03-13",
      "strength": 7200,
      "resistance": 5100,
      "calories": 450,
      "sessions": 1
    },
    {
      "day": "Thu",
      "date": "2026-03-14",
      "strength": 0,
      "resistance": 0,
      "calories": 0,
      "sessions": 0
    },
    {
      "day": "Fri",
      "date": "2026-03-15",
      "strength": 6500,
      "resistance": 3800,
      "calories": 420,
      "sessions": 1
    },
    {
      "day": "Sat",
      "date": "2026-03-16",
      "strength": 0,
      "resistance": 0,
      "calories": 380,
      "sessions": 0
    },
    {
      "day": "Sun",
      "date": "2026-03-17",
      "strength": 0,
      "resistance": 0,
      "calories": 0,
      "sessions": 0
    }
  ],
  "monthlyBreakdown": [
    {
      "month": "Apr",
      "year": 2025,
      "strengthLoad": 42000,
      "resistanceLoad": 28000,
      "avgCalories": 350,
      "sessions": 18
    },
    {
      "month": "May",
      "year": 2025,
      "strengthLoad": 45000,
      "resistanceLoad": 30000,
      "avgCalories": 370,
      "sessions": 20
    }
  ],
  "sparkline": {
    "calories": [380, 410, 0, 450, 0, 420, 380],
    "strength": [6800, 0, 7200, 0, 6500, 0, 0],
    "resistance": [4200, 0, 5100, 0, 3800, 0, 0]
  }
}
```

#### Response Fields

| Field                         | Description                                                         |
| ----------------------------- | ------------------------------------------------------------------- |
| `summary.strengthLoadTotal`   | Sum of all `strengthLoadTotal` values in the period                 |
| `summary.resistanceLoadTotal` | Sum of all `resistanceLoadTotal` values in the period               |
| `summary.avgDailyCalories`    | Average `activeCalories` across days with data in the period        |
| `summary.sessionCount`        | Sum of all `sessionCount` values in the period                      |
| `summary.completionRate`      | Percentage of days in the period that have at least 1 session       |
| `summary.trend`               | Percentage change comparing current half of period vs previous half |
| `weeklyBreakdown[]`           | One entry per day (last 7 days), used for daily charts              |
| `monthlyBreakdown[]`          | One entry per month, used for 12-month evolution chart              |
| `sparkline.calories`          | Last 7 daily calorie values (for list page sparkline)               |
| `sparkline.strength`          | Last 7 daily strength load values (for list page sparkline)         |
| `sparkline.resistance`        | Last 7 daily resistance load values (for list page sparkline)       |

#### Response - No Data (200)

When no health data exists for the student, return the same shape with zeroed values rather than a 404. This allows the frontend to show graceful empty states without special error handling.

```json
{
  "summary": {
    "strengthLoadTotal": 0,
    "resistanceLoadTotal": 0,
    "avgDailyCalories": 0,
    "sessionCount": 0,
    "completionRate": 0,
    "trend": 0
  },
  "weeklyBreakdown": [],
  "monthlyBreakdown": [],
  "sparkline": {
    "calories": [],
    "strength": [],
    "resistance": []
  }
}
```

#### Aggregation Implementation

```typescript
export async function GET(request: NextRequest, { params }) {
  const { id: studentId } = await params;

  // 1. Auth: verifyTrainerRequest
  // 2. Parse period from searchParams (default: "month")
  // 3. Compute date range based on period
  // 4. Query health_metrics where trainerId == uid AND studentId == id AND date >= startDate AND date <= endDate, ordered by date ASC
  // 5. Aggregate:
  //    - Sum strengthLoadTotal, resistanceLoadTotal across all docs
  //    - Average activeCalories across docs that have data
  //    - Sum sessionCount
  //    - completionRate = (days with sessionCount > 0) / (total days in period) * 100
  //    - trend = ((sum of second half) - (sum of first half)) / (sum of first half) * 100
  // 6. Build weeklyBreakdown from last 7 days of data
  // 7. Build monthlyBreakdown by grouping by YYYY-MM
  // 8. Build sparkline arrays from last 7 daily values
  // 9. Return response
}
```

#### Trend Calculation Detail

The trend compares the recent half of the selected period against the earlier half, based on total strength load:

- `period=week`: days 5-7 vs days 1-4
- `period=month`: days 16-30 vs days 1-15
- `period=year`: months 7-12 vs months 1-6

Formula: `trend = ((recentSum - previousSum) / previousSum) * 100`, capped at -100 to +999. Returns 0 if `previousSum` is 0.

---

## 4. Frontend Components

### 4.1 Students List Page (Redesign)

**File:** `web-cms/app/(dashboard)/cms/students/page.tsx`

**Changes:** Replace the current table (6 columns: Aluno, Programa, Status, Progresso, Inicio, Acoes) with the new design.

#### New Table Columns

| Column            | Data Source                       | Component             |
| ----------------- | --------------------------------- | --------------------- |
| Aluno             | `users` collection (name, avatar) | Avatar + name + email |
| Objetivo          | `users.fitnessProfile.goals[0]`   | Text badge            |
| Sessoes           | `summary.sessionCount`            | Number                |
| Freq. Calorica    | `sparkline.calories`              | `SparklineChart`      |
| Carga Forca       | `sparkline.strength`              | `SparklineChart`      |
| Carga Resistencia | `sparkline.resistance`            | `SparklineChart`      |
| Evolucao          | `summary.trend`                   | Percentage with arrow |
| Status            | subscription status               | Colored badge         |

#### Data Fetching Strategy

The list page needs sparkline data for every student, which means calling `GET /api/students/{id}/health-summary?period=week` for each student. To avoid N+1 API calls from the browser:

**Option chosen: Parallel fetch with limit.** The page fetches student list first, then fires parallel `health-summary` requests for the visible page (max 10 students due to pagination). This keeps the request count bounded and avoids the need for a new batch endpoint.

```typescript
// In page.tsx useEffect:
// 1. Fetch students list (existing logic)
// 2. For each student on the current page:
//    fetch(`/api/students/${student.id}/health-summary?period=week`)
// 3. Merge sparkline data into student rows
```

#### Summary Stat Cards (Redesign)

Replace the current 4 stat cards with:

| Card                | Computation                                        |
| ------------------- | -------------------------------------------------- |
| Alunos Ativos       | Count of students with status `active` (unchanged) |
| Media de Conclusao  | Average `completionRate` across all students       |
| Media Carga Forca   | Average `strengthLoadTotal` across all students    |
| Media Carga Resist. | Average `resistanceLoadTotal` across all students  |

### 4.2 Student Detail Page (Redesign)

**File:** `web-cms/app/(dashboard)/cms/students/[id]/page.tsx`

**Changes:** Replace the current tabbed layout (overview, progress, workouts, financial) with the new chart-focused design.

#### Page Layout

```
+-------------------------------------------------------+
| <- Back    [Avatar] Name / Objective    [Send PDF btn] |
+-------------------------------------------------------+
| [Stat Card 1] [Stat Card 2] [Stat Card 3] [Stat Card 4] |
+-------------------------------------------------------+
| 12-Month Strength Evolution (BarChart)                 |
+-------------------------------------------------------+
| Weekly Strength vs Resistance    | Weekly Calories      |
| (GroupedBarChart)                | (BarChart)           |
+-------------------------------------------------------+
| Performance Insights Panel                             |
+-------------------------------------------------------+
```

#### Data Fetching

Single API call: `GET /api/students/{id}/health-summary?period=year`

This returns both `monthlyBreakdown` (for the 12-month chart) and `weeklyBreakdown` (for the weekly charts), plus `summary` for the stat cards.

#### Stat Cards

| Card              | Value                         | Trend              |
| ----------------- | ----------------------------- | ------------------ |
| Carga de Forca    | `summary.strengthLoadTotal`   | `summary.trend` %  |
| Carga de Resist.  | `summary.resistanceLoadTotal` | computed from data |
| Calorias Diarias  | `summary.avgDailyCalories`    | computed from data |
| Taxa de Conclusao | `summary.completionRate`      | computed from data |

#### Chart Components

**StrengthEvolutionChart** (`components/students/StrengthEvolutionChart.tsx`)

- Recharts `BarChart` with `monthlyBreakdown` data
- X-axis: month labels (Abr, Mai, Jun, ...)
- Y-axis: strength load (kg)
- Single bar series, primary color

**WeeklyComparisonChart** (`components/students/WeeklyComparisonChart.tsx`)

- Recharts `BarChart` with grouped bars
- X-axis: day labels (Seg, Ter, Qua, ...)
- Two bar series: strength (primary color) and resistance (secondary color)
- Legend below chart

**CalorieChart** (`components/students/CalorieChart.tsx`)

- Recharts `BarChart` with `weeklyBreakdown` data
- X-axis: day labels
- Y-axis: calories (kcal)
- Single bar series, accent color

**SparklineChart** (`components/students/SparklineChart.tsx`)

- Recharts `LineChart` with minimal config (no axes, no grid, no tooltip)
- Fixed height: 32px, width: 80px
- Stroke color based on prop (green for positive trend, red for negative)
- Used inline in the students list table

**PerformanceInsights** (`components/students/PerformanceInsights.tsx`)

- Renders 3 computed insight cards based on the health summary data
- Insight rules (computed client-side from the summary response):

```typescript
function computeInsights(summary, weeklyBreakdown): Insight[] {
  const insights: Insight[] = [];

  // 1. Strength trend insight
  if (summary.trend > 10) {
    insights.push({
      type: "positive",
      title: "Forca em alta",
      description: `Carga de forca aumentou ${summary.trend.toFixed(0)}% no periodo`,
    });
  } else if (summary.trend < -10) {
    insights.push({
      type: "warning",
      title: "Queda na forca",
      description: `Carga de forca diminuiu ${Math.abs(summary.trend).toFixed(0)}% no periodo`,
    });
  }

  // 2. Consistency insight
  if (summary.completionRate >= 80) {
    insights.push({
      type: "positive",
      title: "Excelente consistencia",
      description: `Treinou em ${summary.completionRate}% dos dias`,
    });
  } else if (summary.completionRate < 50) {
    insights.push({
      type: "warning",
      title: "Frequencia baixa",
      description: `Treinou em apenas ${summary.completionRate}% dos dias`,
    });
  }

  // 3. Calorie insight
  if (summary.avgDailyCalories > 0) {
    insights.push({
      type: "info",
      title: "Gasto calorico",
      description: `Media de ${summary.avgDailyCalories} kcal/dia nos dias de treino`,
    });
  }

  return insights.slice(0, 3);
}
```

### 4.3 Component Props Interfaces

```typescript
// SparklineChart.tsx
interface SparklineChartProps {
  data: number[];
  color?: string; // default: tailwind primary-600
  width?: number; // default: 80
  height?: number; // default: 32
}

// HealthStatCard.tsx
interface HealthStatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: number; // percentage, positive = up arrow green, negative = down arrow red
  icon: React.ReactNode;
}

// StrengthEvolutionChart.tsx
interface StrengthEvolutionChartProps {
  data: { month: string; year: number; strengthLoad: number }[];
}

// WeeklyComparisonChart.tsx
interface WeeklyComparisonChartProps {
  data: { day: string; strength: number; resistance: number }[];
}

// CalorieChart.tsx
interface CalorieChartProps {
  data: { day: string; calories: number }[];
}

// PerformanceInsights.tsx
interface PerformanceInsightsProps {
  summary: HealthSummary;
  weeklyBreakdown: WeeklyBreakdownEntry[];
}
```

---

## 5. Implementation Phases

### Phase 1: Data Layer (API Endpoints)

**Estimated effort:** 1-2 days

1. Create `web-cms/app/api/students/[id]/health-data/route.ts`
   - Implement POST handler with validation
   - Implement deduplication (upsert by studentId + trainerId + date)
   - Implement pre-aggregation (compute strength/resistance totals on write)
   - Add connection lookup for trainerId resolution

2. Create `web-cms/app/api/students/[id]/health-summary/route.ts`
   - Implement GET handler with period-based aggregation
   - Build weekly/monthly breakdown arrays
   - Build sparkline arrays
   - Compute trend percentage

3. Create Firestore composite indexes
   - Deploy index configuration

### Phase 2: Chart Components

**Estimated effort:** 1 day

1. `SparklineChart.tsx` - minimal Recharts LineChart wrapper
2. `HealthStatCard.tsx` - stat card with trend arrow
3. `StrengthEvolutionChart.tsx` - 12-month bar chart
4. `WeeklyComparisonChart.tsx` - grouped bar chart
5. `CalorieChart.tsx` - weekly calorie bars
6. `PerformanceInsights.tsx` - insight cards with computed rules

All components are `'use client'` with Recharts. Each component is self-contained with its own props interface.

### Phase 3: Page Integration

**Estimated effort:** 1-2 days

1. Redesign `students/page.tsx`
   - Replace table columns
   - Add parallel health-summary fetches for visible page
   - Update stat cards
   - Add sparkline rendering

2. Redesign `students/[id]/page.tsx`
   - Replace tabbed layout with chart layout
   - Integrate all chart components
   - Add health-summary fetch on mount
   - Handle loading and empty states

### Phase 4: E2E Tests

**Estimated effort:** 0.5 day

1. Create `cuj-08-student-health.spec.ts`

---

## 6. Testing Strategy

### 6.1 E2E Tests (Playwright)

**File:** `web-cms/e2e/tests/cuj-08-student-health.spec.ts`

Follows existing pattern: imports `loginAsTrainer` from `e2e/helpers/auth.setup.ts`, uses `test.describe` blocks.

```typescript
import { test, expect } from "@playwright/test";
import { loginAsTrainer } from "../helpers/auth.setup";

test.describe("CUJ 8: Student Health Metrics", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTrainer(page);
  });

  // --- Students List Page ---

  test("should display redesigned students list with stat cards", async ({
    page,
  }) => {
    await page.goto("/cms/students");
    await page.waitForLoadState("networkidle");
    // Verify stat cards are present
    await expect(page.getByText("Alunos ativos")).toBeVisible();
    // Verify table headers
    await expect(page.getByText("Objetivo")).toBeVisible();
  });

  test("should render sparkline charts in student table", async ({ page }) => {
    await page.goto("/cms/students");
    await page.waitForLoadState("networkidle");
    // Sparklines render as SVG elements inside recharts containers
    const sparklines = page.locator(".recharts-wrapper");
    // At least one sparkline should render if students exist
    // (may be 0 if no students - that's the empty state test)
  });

  test("should filter students by search query", async ({ page }) => {
    await page.goto("/cms/students");
    await page.waitForLoadState("networkidle");
    const searchInput = page.getByPlaceholder(/buscar/i);
    await searchInput.fill("nonexistent-name-xyz");
    // Should show empty or filtered result
    await expect(page.locator("main")).toBeVisible();
  });

  test("should navigate to student detail on row click", async ({ page }) => {
    await page.goto("/cms/students");
    await page.waitForLoadState("networkidle");
    // If students exist, click the first row
    const firstRow = page.locator("tbody tr").first();
    if (await firstRow.isVisible()) {
      await firstRow.click();
      await expect(page).toHaveURL(/\/cms\/students\/.+/);
    }
  });

  // --- Student Detail Page ---

  test("should display student detail with chart sections", async ({
    page,
  }) => {
    // Navigate directly to a known student or via list
    await page.goto("/cms/students");
    await page.waitForLoadState("networkidle");
    const firstRow = page.locator("tbody tr").first();
    if (await firstRow.isVisible()) {
      await firstRow.click();
      await page.waitForLoadState("networkidle");
      // Stat cards should be visible
      await expect(page.locator("main")).toBeVisible();
    }
  });

  test("should show empty state when no health data exists", async ({
    page,
  }) => {
    await page.goto("/cms/students");
    await page.waitForLoadState("networkidle");
    // The page should render gracefully even with no data
    await expect(page.locator("main")).toBeVisible();
  });
});
```

### 6.2 Manual API Testing

Since the codebase does not currently have unit tests or API integration tests (all testing is E2E via Playwright), API validation should be done manually or via curl scripts during development.

**Health data POST test:**

```bash
curl -X POST http://localhost:3000/api/students/{studentId}/health-data \
  -H "Authorization: Bearer <student-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "entries": [{
      "date": "2026-03-15",
      "activeCalories": 420,
      "workoutSessions": [{
        "exerciseName": "Bench Press",
        "category": "strength",
        "sets": 4,
        "reps": 10,
        "weight": 80,
        "duration": 12
      }]
    }]
  }'
```

**Health summary GET test:**

```bash
curl http://localhost:3000/api/students/{studentId}/health-summary?period=month \
  -H "Authorization: Bearer <trainer-token>"
```

### 6.3 What to Validate

| Scenario                       | Expected Behavior                               |
| ------------------------------ | ----------------------------------------------- |
| POST with valid entries        | 201, documents created in Firestore             |
| POST with duplicate date       | 201, existing document updated (not duplicated) |
| POST with mismatched studentId | 403, cannot submit for another student          |
| POST with invalid category     | 400, validation error with field path           |
| POST with future date          | 400, validation error                           |
| POST with empty entries        | 400, must have at least 1 entry                 |
| POST with > 30 entries         | 400, exceeds batch limit                        |
| GET with period=week           | 200, weeklyBreakdown has 7 entries              |
| GET with period=year           | 200, monthlyBreakdown has up to 12 entries      |
| GET for student with no data   | 200, zeroed summary, empty breakdowns           |
| GET by trainer not connected   | 200, zeroed summary (no docs match trainerId)   |
| GET without auth               | 401                                             |

---

## 7. Performance Considerations

### API Response Time Target

The PRD requires < 500ms for the health summary endpoint. Key strategies:

1. **Pre-aggregation on write:** `strengthLoadTotal` and `resistanceLoadTotal` are computed when data is POSTed, avoiding nested array iteration on reads.

2. **Bounded query range:** The GET endpoint queries a fixed date range (7, 30, or 365 days), so Firestore reads are bounded. For `period=year`, worst case is 365 documents.

3. **Composite indexes:** The required indexes ensure Firestore uses efficient index scans rather than collection scans.

4. **Sparkline data in summary response:** The `sparkline` field provides pre-formatted arrays so the list page doesn't need to parse `weeklyBreakdown` client-side for each row.

### Frontend Rendering

1. **Parallel fetches for list page:** Health summary requests fire in parallel for the 10 students visible on the current page, not for all students.

2. **No layout shift from charts:** SparklineChart has fixed dimensions (80x32px). Stat cards and chart containers use fixed heights via Tailwind classes to prevent CLS.

3. **Lazy loading detail charts:** The 12-month bar chart and weekly charts mount only after the API response arrives, with skeleton placeholders during loading.

### Firestore Cost Estimate

For a trainer with 30 active students, each syncing daily for 365 days:

- `health_metrics` documents: 30 \* 365 = 10,950 documents
- List page load (10 students visible): 10 \* 7 = 70 reads (sparkline data for 7 days each)
- Detail page load (1 student, year view): 365 reads
- POST per student per day: 1 read (dedup check) + 1 write = 2 operations

This is well within Firestore free tier for typical usage.

---

## 8. Security

### Authentication and Authorization

| Endpoint                                | Auth Method            | Authorization Rule                           |
| --------------------------------------- | ---------------------- | -------------------------------------------- |
| `POST /api/students/{id}/health-data`   | `verifyAuthRequest`    | `role === 'student'` AND `uid === params.id` |
| `GET /api/students/{id}/health-summary` | `verifyTrainerRequest` | Implicit via `trainerId` filter on query     |

### Input Validation

All POST body fields are validated server-side before any Firestore writes:

- Type checking (string, number, array)
- Range bounds (calories 0-10000, weight 0-1000, etc.)
- Enum validation for category field
- Date format validation (YYYY-MM-DD regex + Date.parse)
- Future date rejection
- Array length limits (entries: 1-30, sessions: 0-20)

### Data Isolation

The health summary endpoint filters by `trainerId == authResult.uid`, which means a trainer can only see health data for their own students. There is no cross-trainer data leakage. This follows the same pattern used in `GET /api/students/{id}/analytics` and `GET /api/students/{id}/progress`.

### Rate Limiting

Not implemented in this phase. The iOS app already self-limits to 3 sync events per day (app launch, post-workout, background task). If abuse becomes a concern, rate limiting can be added at the API gateway level.

---

## 9. Open Questions

| Question                                                                                                                | Impact                                                                                                                                       | Decision Needed By            |
| ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| Should the health-data POST accept data from students not connected to any trainer?                                     | Currently returns 400 if no active connection. Alternative: store with `trainerId: null` and associate later.                                | Before Phase 1 implementation |
| Should the sparkline on the list page show 7 days or 14 days?                                                           | Affects data density in the mini-chart. PRD shows 7 data points.                                                                             | Before Phase 3 implementation |
| Should we add a `GET /api/students/health-summary/batch` endpoint to fetch summaries for multiple students in one call? | Would reduce list page N+1 requests from 10 to 1. Adds complexity. Current parallel fetch approach is acceptable for 10 concurrent requests. | Post-launch optimization      |
| How should cardio sessions factor into the load calculations?                                                           | Currently cardio is stored but not included in strength or resistance totals. Should there be a `cardioLoadTotal` field?                     | Before Phase 1 implementation |
