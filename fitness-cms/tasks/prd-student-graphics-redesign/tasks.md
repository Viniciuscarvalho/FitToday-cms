# Tasks - Student Graphics Redesign + Health Metrics Pipeline

## Task Overview

| Task                                  | Size | Priority | Dependencies  |
| ------------------------------------- | ---- | -------- | ------------- |
| 1.0 Health Data API - POST endpoint   | M    | P0       | None          |
| 2.0 Health Summary API - GET endpoint | L    | P0       | Task 1.0      |
| 3.0 Shared chart components           | M    | P0       | None          |
| 4.0 Redesign students list page       | L    | P0       | Task 2.0, 3.0 |
| 5.0 Redesign student detail page      | L    | P0       | Task 2.0, 3.0 |
| 6.0 Playwright E2E tests              | M    | P1       | Task 4.0, 5.0 |
| 7.0 Add to Swagger/OpenAPI spec       | S    | P1       | Task 1.0, 2.0 |

---

# Task 1.0: Health Data API - POST Endpoint (M)

<critical>Read the prd.md and techspec.md files in this folder. If you do not read these files, your task will be invalidated.</critical>

## Overview

Create `POST /api/students/{id}/health-data` to receive batched health metrics from the iOS app. The endpoint accepts date-stamped health entries (calories, workout sessions, exercise details) and stores them in Firestore, deduplicating by studentId+date.

## Subtasks

- [ ] 1.1 Create `web-cms/app/api/students/[id]/health-data/route.ts` with POST handler
- [ ] 1.2 Authenticate requests using `verifyAuthRequest` (student auth via Bearer token)
- [ ] 1.3 Validate request body schema: require `entries[]` array with `date`, `activeCalories`, `sessions[]` (each session has `exerciseName`, `weight`, `sets`, `reps`, `duration`)
- [ ] 1.4 Return 400 for malformed payloads with descriptive error messages
- [ ] 1.5 Store entries in Firestore `health_metrics` collection, partitioned by studentId + trainerId
- [ ] 1.6 Implement deduplication: upsert by composite key `studentId+date` to prevent duplicate entries
- [ ] 1.7 Return 201 with `{ success: true, entriesProcessed: N }`

## Success Criteria

- POST with valid health entries returns 201 with entry count
- POST with malformed payload returns 400
- Duplicate entries for the same studentId+date are upserted, not duplicated
- Unauthenticated requests return 401
- Data is queryable in Firestore by studentId and date range

## Relevant Files

- `web-cms/app/api/students/[id]/health-data/route.ts` (new)
- `web-cms/lib/firebase-admin.ts` (reference for Firestore and auth patterns)
- `web-cms/lib/api-helpers.ts` (reference for `verifyAuthRequest`)

## status: pending

---

# Task 2.0: Health Summary API - GET Endpoint (L)

<critical>Read the prd.md and techspec.md files in this folder. If you do not read these files, your task will be invalidated.</critical>

## Overview

Create `GET /api/students/{id}/health-summary` that aggregates health metrics stored by Task 1.0 and returns weekly/monthly/yearly breakdowns for the CMS to display. Requires trainer authentication.

## Subtasks

- [ ] 2.1 Create `web-cms/app/api/students/[id]/health-summary/route.ts` with GET handler
- [ ] 2.2 Authenticate requests using `verifyTrainerRequest` (trainer auth)
- [ ] 2.3 Accept query params: `period` (week | month | year), `startDate`, `endDate`
- [ ] 2.4 Query Firestore `health_metrics` for the student within the requested date range
- [ ] 2.5 Compute aggregated response: `strengthLoadTotal`, `resistanceLoadTotal`, `avgDailyCalories`, `sessionCount`, `completionRate`, `trendPercentage`
- [ ] 2.6 Return weekly breakdown by day-of-week (Mon-Sun) for strength, resistance, calories
- [ ] 2.7 Return monthly breakdown for 12-month evolution view
- [ ] 2.8 Ensure query performance stays under 500ms for 365 days of data (use date range filters, avoid full collection scans)

## Success Criteria

- GET with `?period=week` returns daily breakdown for current week
- GET with `?period=month` returns weekly breakdown for current month
- GET with `?period=year` returns monthly breakdown for 12 months
- Trend percentage compares current period to previous period
- Unauthenticated or non-trainer requests return 401/403
- Response time < 500ms with 365 days of data

## Dependencies

- Task 1.0 (health data must be stored before it can be aggregated)

## Relevant Files

- `web-cms/app/api/students/[id]/health-summary/route.ts` (new)
- `web-cms/app/api/students/[id]/health-data/route.ts` (Task 1.0 - defines the data schema)
- `web-cms/lib/firebase-admin.ts` (Firestore query patterns)
- `web-cms/lib/api-helpers.ts` (reference for `verifyTrainerRequest`)

## status: pending

---

# Task 3.0: Shared Chart Components (M)

<critical>Read the prd.md and techspec.md files in this folder. If you do not read these files, your task will be invalidated.</critical>

## Overview

Create reusable chart components using the recharts library (already installed). These components will be used by both the student list page (sparklines inline in table) and the student detail page (full-size bar charts). All components use Tailwind CSS for styling.

## Subtasks

- [ ] 3.1 Create `web-cms/components/charts/SparklineChart.tsx`
  - Accepts `data: number[]` and optional `color`, `width`, `height` props
  - Renders a minimal line chart with no axes, labels, or grid (sparkline style)
  - Support positive/negative trend coloring (green up, red down)
- [ ] 3.2 Create `web-cms/components/charts/BarChart.tsx`
  - Accepts `data: { label: string, value: number }[]` and configuration props
  - Renders vertical bar chart with labeled X axis and value Y axis
  - Support for showing trend line overlay
  - Used for: 12-month strength evolution, weekly calorie chart
- [ ] 3.3 Create `web-cms/components/charts/GroupedBarChart.tsx`
  - Accepts `data: { label: string, values: Record<string, number> }[]` with a `legend` prop
  - Renders grouped bars (multiple series per category)
  - Used for: weekly strength vs resistance comparison
- [ ] 3.4 Ensure all components handle empty data gracefully (render placeholder or empty state)
- [ ] 3.5 Ensure all components are responsive and work within Tailwind layout containers

## Success Criteria

- SparklineChart renders a clean mini chart suitable for inline table use
- BarChart renders labeled bars with correct proportions
- GroupedBarChart renders multiple series side-by-side with legend
- All components accept empty arrays without crashing
- All components render without layout shift (fixed dimensions or responsive containers)
- Components use recharts and Tailwind CSS only (no additional chart libraries)

## Relevant Files

- `web-cms/components/charts/SparklineChart.tsx` (new)
- `web-cms/components/charts/BarChart.tsx` (new)
- `web-cms/components/charts/GroupedBarChart.tsx` (new)
- `web-cms/package.json` (verify recharts is installed)

## status: pending

---

# Task 4.0: Redesign Students List Page (L)

<critical>Read the prd.md and techspec.md files in this folder. If you do not read these files, your task will be invalidated.</critical>

## Overview

Replace the current students table with a rich metrics table that shows inline sparkline charts, performance data, and summary stat cards. The page fetches health summary data from the API (Task 2.0) and renders chart components (Task 3.0).

## Subtasks

- [ ] 4.1 Add 4 summary stat cards at top of page: Active Students count, Avg Completion %, Avg Strength Load, Avg Resistance Load
- [ ] 4.2 Replace current table with new columns: Avatar+Name, Objective, Sessions, Daily Calories (with SparklineChart), Strength Load (with SparklineChart), Resistance Load (with SparklineChart), Trend %, Status indicator
- [ ] 4.3 Fetch health summary data for each student via `GET /api/students/{id}/health-summary?period=week`
- [ ] 4.4 Implement search by student name (client-side filter)
- [ ] 4.5 Implement filter by objective (dropdown filter)
- [ ] 4.6 Ensure clicking a row navigates to `/cms/students/{id}` (student detail page)
- [ ] 4.7 Handle empty state: display friendly message when no students exist
- [ ] 4.8 Handle loading state: show skeleton/spinner while data loads

## Success Criteria

- Page displays 4 stat cards with computed aggregate values
- Table shows all 8 columns with inline sparkline charts for calories, strength, resistance
- Search by name filters the table in real-time
- Objective dropdown filters the table
- Clicking a student row navigates to their detail page
- Empty state renders when trainer has no students
- Page loads in < 2s with 50 students

## Dependencies

- Task 2.0 (health summary API for fetching metrics)
- Task 3.0 (SparklineChart component for inline charts)

## Relevant Files

- `web-cms/app/(dashboard)/cms/students/page.tsx` (modify)
- `web-cms/components/charts/SparklineChart.tsx` (from Task 3.0)
- `web-cms/lib/api-client.ts` (for apiRequest)

## status: pending

---

# Task 5.0: Redesign Student Detail Page (L)

<critical>Read the prd.md and techspec.md files in this folder. If you do not read these files, your task will be invalidated.</critical>

## Overview

Replace the current student detail page with a rich dashboard showing a header with avatar and stats, 4 stat cards, three chart sections (12-month evolution, weekly comparison, calorie trend), and a performance insights panel.

## Subtasks

- [ ] 5.1 Redesign header section: avatar, student name, objective badge, inline stats (sessions, completion %)
- [ ] 5.2 Add 4 stat cards: Strength Load, Resistance Load, Daily Calories, Completion %
  - Each card shows current value, trend percentage vs previous period, and trend direction icon
- [ ] 5.3 Add 12-month strength evolution bar chart using BarChart component
  - Fetch `GET /api/students/{id}/health-summary?period=year` for monthly data
- [ ] 5.4 Add weekly strength vs resistance grouped bar chart using GroupedBarChart component
  - Fetch `GET /api/students/{id}/health-summary?period=week` for daily breakdown
  - Show Mon-Sun with strength and resistance as grouped bars
- [ ] 5.5 Add weekly calorie bar chart using BarChart component
  - Use same weekly data from 5.4
- [ ] 5.6 Add performance insights panel with 3 computed insights
  - Example insights: "Strength load increased 12% this month", "Most active on Wednesdays", "Calorie burn trending up"
  - Derive from the summary data, not ML
- [ ] 5.7 Handle empty state: display friendly message when student has no health data yet
- [ ] 5.8 Handle loading states for each chart section independently (skeleton placeholders)

## Success Criteria

- Header displays student info with avatar and objective
- 4 stat cards show correct values with trend indicators
- 12-month bar chart renders monthly strength data
- Weekly grouped bar chart renders strength vs resistance by day
- Weekly calorie bar chart renders daily calorie data
- Insights panel shows 3 relevant, computed insights
- Empty state renders gracefully when no health data exists
- Each chart section loads independently without blocking others

## Dependencies

- Task 2.0 (health summary API for all chart data)
- Task 3.0 (BarChart, GroupedBarChart components)

## Relevant Files

- `web-cms/app/(dashboard)/cms/students/[id]/page.tsx` (modify)
- `web-cms/components/charts/BarChart.tsx` (from Task 3.0)
- `web-cms/components/charts/GroupedBarChart.tsx` (from Task 3.0)
- `web-cms/lib/api-client.ts` (for apiRequest)

## status: pending

---

# Task 6.0: Playwright E2E Tests (M)

<critical>Read the prd.md and techspec.md files in this folder. If you do not read these files, your task will be invalidated.</critical>

## Overview

Write Playwright E2E tests covering the redesigned student list and detail pages. Tests should verify page loads, stat cards, search/filter functionality, chart rendering, navigation between pages, and empty states.

## Subtasks

- [ ] 6.1 Create `web-cms/e2e/tests/cuj-08-student-metrics.spec.ts`
- [ ] 6.2 Test: Student list page loads and displays 4 stat cards with values
- [ ] 6.3 Test: Student list table renders rows with student data
- [ ] 6.4 Test: Search input filters students by name
- [ ] 6.5 Test: Objective dropdown filters the table
- [ ] 6.6 Test: Clicking a student row navigates to `/cms/students/{id}`
- [ ] 6.7 Test: Student detail page renders all 4 chart sections (verify chart container elements exist)
- [ ] 6.8 Test: Student detail page displays 4 stat cards
- [ ] 6.9 Test: Empty state renders when no students/data exist
- [ ] 6.10 Follow existing E2E patterns (auth setup, test data fixtures, selectors)

## Success Criteria

- All tests pass locally via `npx playwright test`
- Tests cover: list page load, search, filter, navigation, detail page charts, empty state
- Tests use stable selectors (data-testid or accessible roles, not brittle CSS selectors)
- Tests clean up any test data they create

## Dependencies

- Task 4.0 (student list page must be implemented)
- Task 5.0 (student detail page must be implemented)

## Relevant Files

- `web-cms/e2e/tests/cuj-08-student-metrics.spec.ts` (new)
- `web-cms/e2e/` (reference for existing test patterns and fixtures)
- `web-cms/playwright.config.ts` (test configuration)

## status: pending

---

# Task 7.0: Add to Swagger/OpenAPI Spec (S)

<critical>Read the prd.md and techspec.md files in this folder. If you do not read these files, your task will be invalidated.</critical>

## Overview

Document the two new API endpoints in the existing Swagger/OpenAPI specification file so they appear in the API documentation.

## Subtasks

- [ ] 7.1 Add `POST /api/students/{id}/health-data` to `web-cms/public/swagger.yaml`
  - Document request body schema (entries array with date, calories, sessions)
  - Document 201, 400, 401 responses
  - Add student auth requirement
- [ ] 7.2 Add `GET /api/students/{id}/health-summary` to `web-cms/public/swagger.yaml`
  - Document query parameters: period, startDate, endDate
  - Document response schema (aggregated metrics, weekly/monthly breakdowns)
  - Document 200, 401, 403 responses
  - Add trainer auth requirement
- [ ] 7.3 Add reusable schema definitions under `components/schemas` for `HealthDataEntry`, `HealthSummaryResponse`

## Success Criteria

- Both endpoints appear in Swagger UI when viewing the spec
- Request/response schemas match the actual API implementation from Tasks 1.0 and 2.0
- Auth requirements are documented
- Error responses are documented

## Dependencies

- Task 1.0 (POST endpoint must be defined to document accurately)
- Task 2.0 (GET endpoint must be defined to document accurately)

## Relevant Files

- `web-cms/public/swagger.yaml` (modify)

## status: pending
