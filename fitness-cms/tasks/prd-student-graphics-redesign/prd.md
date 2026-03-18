# Product Requirements Document (PRD)

**Project Name:** Student Graphics Redesign + Health Metrics Pipeline
**Document Version:** 1.0
**Date:** 2026-03-17
**Author:** Vinicius Carvalho
**Status:** Draft

---

## Executive Summary

**Problem Statement:**
The CMS student dashboard shows only basic subscription/progress data. Trainers lack visibility into real performance metrics (strength loads, resistance loads, calorie trends) that their students are already tracking via Apple Health on the iOS app. This gap prevents trainers from making data-driven workout decisions.

**Proposed Solution:**
Build a full-stack health metrics pipeline: iOS app sends Apple Health data to a new API endpoint, the API stores and aggregates it, and the CMS displays rich visualizations (sparkline charts, bar charts, performance insights) on redesigned student list and detail pages.

**Business Value:**
Trainers can create better, personalized workouts when they see actual performance data. This increases perceived platform value, reduces churn, and differentiates FitToday from competitors.

**Success Metrics:**

- Trainers access student detail page 3x more frequently after redesign
- 80% of active students have health data synced within 30 days
- Trainer NPS increases by 10 points post-launch

---

## Goals and Objectives

### Business Goals

1. Increase trainer engagement with the student management features
2. Enable data-driven workout prescription by surfacing real student metrics
3. Differentiate FitToday with Apple Health integration as a premium feature

### User Goals

1. Trainers: See at-a-glance performance metrics for every student in a rich table
2. Trainers: Drill into a student's detail page to see 12-month evolution charts, weekly breakdowns, and AI-driven insights
3. Students: Benefit from better-targeted workouts based on their actual health data

---

## User Personas

### Primary Persona: Personal Trainer (CMS User)

**Goals:** Quickly assess student performance, identify trends, prescribe optimal workouts
**Pain Points:** Currently flies blind — no real data from student's actual training sessions or health metrics

### Secondary Persona: Student (iOS App User)

**Goals:** Track workouts, sync health data automatically, receive personalized training
**Pain Points:** Shares Apple Health data but trainer can't see any of it

---

## Functional Requirements

### FR-001: Health Data API Endpoint [MUST]

**Description:** New API endpoint `POST /api/students/{id}/health-data` that receives batched health metrics from the iOS app (calories burned, active energy, workout sessions with exercise details including weights/reps/sets).

**Acceptance Criteria:**

- Accepts JSON payload with date-stamped health entries
- Validates data structure and rejects malformed payloads
- Stores data in Firestore `health_metrics` collection partitioned by student+trainer
- Returns 201 on success with entry count
- Requires student authentication (Bearer token)

### FR-002: Health Data Aggregation Endpoint [MUST]

**Description:** New API endpoint `GET /api/students/{id}/health-summary` that returns aggregated metrics for the CMS to display (weekly/monthly/yearly summaries of strength load, resistance load, calories, session counts).

**Acceptance Criteria:**

- Accepts query params: period (week, month, year), startDate, endDate
- Returns: strengthLoadTotal, resistanceLoadTotal, avgDailyCalories, sessionCount, completionRate, trend percentage
- Weekly breakdown by day-of-week
- Monthly breakdown for 12-month view
- Requires trainer authentication

### FR-003: Redesigned Student List Page [MUST]

**Description:** Replace current students table with the new design showing: avatar+name, objective, sessions count, daily calorie frequency (with sparkline), strength load (with sparkline), resistance load (with sparkline), trend %, and status indicator.

**Acceptance Criteria:**

- Table displays all 8 columns from the mockup
- Sparkline mini-charts render inline for calories, strength, and resistance columns
- Search by name works
- Filter by objective works
- Clicking a row navigates to student detail
- Summary stat cards show: active count, avg completion, avg strength load, avg resistance load

### FR-004: Redesigned Student Detail Page [MUST]

**Description:** Replace current student detail with the new design showing: header with avatar + objective + stats, 4 stat cards, 12-month strength evolution bar chart, weekly strength vs resistance comparison, calorie consumption chart, and performance insights panel.

**Acceptance Criteria:**

- 4 stat cards: strength load, resistance load, daily calories, completion %
- 12-month bar chart showing strength load evolution
- Weekly grouped bar chart comparing strength vs resistance by day
- Weekly calorie bar chart
- Performance insights panel with 3 computed insights
- "Send Workout PDF" button in header

### FR-005: iOS App Health Data Sync [MUST]

**Description:** The iOS app (which already collects Apple Health data) sends health metrics to the new API endpoint periodically (on app launch, after workout completion, and every 6 hours in background).

**Acceptance Criteria:**

- Syncs: active calories, workout sessions, exercise details (name, weight, sets, reps, duration)
- Batches data by date to avoid duplicate entries
- Handles offline gracefully (queues and retries)
- Background sync via BackgroundTasks framework
- Respects HealthKit authorization status

### FR-006: Playwright E2E Tests [MUST]

**Description:** E2E tests covering the redesigned student pages.

**Acceptance Criteria:**

- Test: Student list page loads with stat cards and table
- Test: Search filters students correctly
- Test: Clicking student navigates to detail page
- Test: Student detail page shows all 4 charts
- Test: Empty state renders when no students exist
- Tests pass in CI

---

## Non-Functional Requirements

### NFR-001: Performance [MUST]

- Student list page loads in < 2s with 50 students
- Health summary API responds in < 500ms
- Sparkline charts render without layout shift

### NFR-002: Data Volume [SHOULD]

- Support 365 days of daily health data per student
- Aggregate queries should not scan all raw documents (use pre-aggregated summaries)

---

## Out of Scope

1. **Android app** - iOS only for now
2. **Real-time streaming** - Batch sync is sufficient
3. **AI workout generation** - Insights are pre-computed rules, not ML
4. **Nutrition tracking** - Only calories from Apple Health, not macros
5. **Dark theme for CMS** - Uses existing light theme with Tailwind

---

## Release Planning

### Phase 1: API + CMS (This PR)

- New health data endpoints
- Redesigned student list page
- Redesigned student detail page with charts
- Playwright E2E tests

### Phase 2: iOS App Sync (Separate PR)

- Implement health data sync service in iOS app
- Background task scheduling
- Offline queue

---

## Risks and Mitigations

| Risk                                  | Mitigation                                             |
| ------------------------------------- | ------------------------------------------------------ |
| No health data yet (cold start)       | Show graceful empty states and mock data for demo      |
| Firestore query costs for aggregation | Pre-aggregate daily summaries on write                 |
| Apple Health permissions denied       | Show clear messaging about what data is needed and why |
