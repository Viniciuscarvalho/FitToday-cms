# Tasks: SDUI + BFF Architecture

> ADR-001 implementation task breakdown.
> Stack: Next.js 14 / TypeScript / Zod / Firebase Admin / Firestore.
> Scope: Backend only -- no iOS renderer work.

---

## Phase 1: BFF Layer Separation

Extract business logic from the 34 existing route handlers into a reusable service layer under `lib/services/`. Each service encapsulates Firestore queries, authorization checks, and data transformation so that both the existing REST routes and the new SDUI BFF endpoints can share the same logic without duplication.

---

### Task 1.1: Create service layer foundation and shared types

- [ ] Create `lib/services/index.ts` barrel export
- [ ] Create `lib/services/types.ts` with shared service result types (`ServiceResult<T>`, `PaginatedResult<T>`, `ServiceError`)
- [ ] Create `lib/services/firestore-helpers.ts` with `serializeTimestamp()`, `buildPaginatedQuery()`, and `docToObject()` utilities extracted from the repeated patterns across all route handlers
- [ ] Add `zod` validation schemas for common query params (pagination, status filters) in `lib/services/validation.ts`

**Files:**
- `web-cms/lib/services/index.ts` (create)
- `web-cms/lib/services/types.ts` (create)
- `web-cms/lib/services/firestore-helpers.ts` (create)
- `web-cms/lib/services/validation.ts` (create)

**Dependencies:** none
**Estimate:** M (3-4 hours)

---

### Task 1.2: Extract workout service

- [ ] Create `lib/services/workout-service.ts`
- [ ] Extract `listWorkouts(trainerId, filters)` from `app/api/workouts/route.ts` GET handler (lines 201-300) -- includes progress and feedback count enrichment
- [ ] Extract `getWorkoutById(workoutId, trainerId)` from `app/api/workouts/[id]/route.ts` GET handler -- includes signed URL regeneration, progress fetch, and feedback count
- [ ] Extract `listStudentWorkouts(studentId, filters)` from `app/api/students/workouts/route.ts` GET handler -- includes signed URL regeneration per workout
- [ ] Extract `getWorkoutProgress(workoutId, trainerId)` from `app/api/workouts/[id]/progress/route.ts`
- [ ] Extract `listWorkoutFeedback(workoutId, trainerId)` from `app/api/workouts/[id]/feedback/route.ts` GET handler

**Files:**
- `web-cms/lib/services/workout-service.ts` (create)
- `web-cms/app/api/workouts/route.ts` (modify -- delegate to service)
- `web-cms/app/api/workouts/[id]/route.ts` (modify)
- `web-cms/app/api/workouts/[id]/progress/route.ts` (modify)
- `web-cms/app/api/workouts/[id]/feedback/route.ts` (modify)
- `web-cms/app/api/students/workouts/route.ts` (modify)

**Dependencies:** Task 1.1
**Estimate:** L (1+ day)

---

### Task 1.3: Extract program service

- [ ] Create `lib/services/program-service.ts`
- [ ] Extract `listPrograms(filters)` from `app/api/programs/route.ts` GET handler -- handles trainerId, studentId, status, visibility, category filters and marketplace fallback
- [ ] Extract `getProgramById(programId)` from `app/api/programs/[id]/route.ts` GET handler -- includes timestamp serialization
- [ ] Extract `getProgramWeeks(programId)` as a standalone query for SDUI program-detail screen rendering (weeks array is embedded in the program doc today)
- [ ] Ensure the service handles the public/private visibility distinction (marketplace vs trainer-owned)

**Files:**
- `web-cms/lib/services/program-service.ts` (create)
- `web-cms/app/api/programs/route.ts` (modify)
- `web-cms/app/api/programs/[id]/route.ts` (modify)

**Dependencies:** Task 1.1
**Estimate:** M (3-4 hours)

---

### Task 1.4: Extract student service

- [ ] Create `lib/services/student-service.ts`
- [ ] Extract `getStudentProfile(studentId)` -- reads from `users` collection, returns student data
- [ ] Extract `listStudentProgress(trainerId, studentId)` from `app/api/students/[id]/progress/route.ts` GET handler -- includes timestamp serialization and photo URLs
- [ ] Extract `getStudentAnalytics(trainerId, studentId)` from `app/api/students/[id]/analytics/route.ts` -- workout completion data and exercise weight tracking
- [ ] Extract student-limit check logic from `app/api/workouts/route.ts` POST handler (lines 76-101) into `checkStudentLimit(trainerId, studentId)`

**Files:**
- `web-cms/lib/services/student-service.ts` (create)
- `web-cms/app/api/students/route.ts` (modify)
- `web-cms/app/api/students/[id]/progress/route.ts` (modify)
- `web-cms/app/api/students/[id]/analytics/route.ts` (modify)

**Dependencies:** Task 1.1
**Estimate:** M (3-4 hours)

---

### Task 1.5: Extract exercise service

- [ ] Create `lib/services/exercise-service.ts`
- [ ] Extract `listExercises(filters)` from `app/api/exercises/route.ts` GET handler -- includes in-memory search filtering, category/equipment/level/source filters, and pagination
- [ ] Extract `searchExercises(query, filters)` from `app/api/exercises/search/route.ts` GET handler -- deduplicates the search logic that is nearly identical to the list endpoint
- [ ] Extract `getExerciseById(exerciseId)` from `app/api/exercises/[id]/route.ts`
- [ ] Consolidate the duplicated in-memory search pattern (name.pt, name.en, aliases) into a single `matchExerciseSearch(exercise, searchTerm)` helper

**Files:**
- `web-cms/lib/services/exercise-service.ts` (create)
- `web-cms/app/api/exercises/route.ts` (modify)
- `web-cms/app/api/exercises/search/route.ts` (modify)
- `web-cms/app/api/exercises/[id]/route.ts` (modify)

**Dependencies:** Task 1.1
**Estimate:** M (3-4 hours)

---

### Task 1.6: Extract trainer service

- [ ] Create `lib/services/trainer-service.ts`
- [ ] Extract `listTrainers(filters)` from `app/api/trainers/route.ts` GET handler -- includes city-based in-memory filtering and `toPublicProfile()` mapping
- [ ] Extract `getTrainerProfile(trainerId)` from `app/api/trainers/[id]/route.ts` -- includes active trainer validation
- [ ] Extract `listTrainerReviews(trainerId, pagination)` from `app/api/trainers/[id]/reviews/route.ts` GET handler -- includes average rating from denormalized store data
- [ ] Move `toPublicProfile()` from `lib/trainer-utils.ts` into the service (or keep as utility and re-export)

**Files:**
- `web-cms/lib/services/trainer-service.ts` (create)
- `web-cms/app/api/trainers/route.ts` (modify)
- `web-cms/app/api/trainers/[id]/route.ts` (modify)
- `web-cms/app/api/trainers/[id]/reviews/route.ts` (modify)
- `web-cms/lib/trainer-utils.ts` (modify or deprecate)

**Dependencies:** Task 1.1
**Estimate:** M (3-4 hours)

---

### Task 1.7: Extract connection service

- [ ] Create `lib/services/connection-service.ts`
- [ ] Extract `listConnections(trainerId, status)` from `app/api/connections/route.ts` GET handler -- includes student data enrichment
- [ ] Extract `checkConnectionStatus(trainerId, studentId)` from `app/api/trainers/[id]/connect/route.ts` GET handler
- [ ] Extract `respondToConnection(connectionId, trainerId, action)` from `app/api/connections/[id]/route.ts` PATCH handler -- includes batch write for accept flow (subscription creation, user linking, student count increment, chat room creation)

**Files:**
- `web-cms/lib/services/connection-service.ts` (create)
- `web-cms/app/api/connections/route.ts` (modify)
- `web-cms/app/api/connections/[id]/route.ts` (modify)
- `web-cms/app/api/trainers/[id]/connect/route.ts` (modify)

**Dependencies:** Task 1.1
**Estimate:** M (3-4 hours)

---

### Task 1.8: Refactor existing route handlers to use service layer

- [ ] Update all GET handlers in workout routes to call `WorkoutService` methods instead of inline Firestore queries
- [ ] Update all GET handlers in program routes to call `ProgramService` methods
- [ ] Update student, exercise, trainer, and connection GET handlers to call their respective services
- [ ] Verify existing CMS frontend behavior is unchanged by running the app locally and smoke-testing key flows
- [ ] Ensure POST/PUT/PATCH/DELETE handlers still work (mutation logic stays in route handlers for now; only read queries are extracted)

**Files:**
- All route handlers listed in Tasks 1.2-1.7 (modify)

**Dependencies:** Tasks 1.2, 1.3, 1.4, 1.5, 1.6, 1.7
**Estimate:** M (3-4 hours)

---

### Task 1.9: Create BFF directory structure and auth middleware

- [ ] Create `app/api/mobile/v1/` directory with a README or comment explaining the BFF namespace convention
- [ ] Create `lib/middleware/mobile-auth.ts` -- wraps `verifyAuthRequest` with additional mobile-specific logic: extracts `X-App-Version`, `X-Platform` (ios/android), `Accept-Language` headers and attaches them to the request context
- [ ] Create `lib/middleware/types.ts` with `MobileRequestContext` interface (uid, role, platform, appVersion, locale)
- [ ] Create a shared `withMobileAuth()` higher-order function that route handlers can wrap to get typed auth context, replacing the repetitive auth check boilerplate

**Files:**
- `web-cms/app/api/mobile/v1/` (create directory)
- `web-cms/lib/middleware/mobile-auth.ts` (create)
- `web-cms/lib/middleware/types.ts` (create)

**Dependencies:** Task 1.1
**Estimate:** S (1-2 hours)

---

## Phase 2: SDUI Schema Definition

Define the complete SDUI type system using Zod schemas. These schemas serve as the single source of truth: runtime validation for BFF responses, TypeScript types via `z.infer`, and JSON Schema export for the iOS client contract.

---

### Task 2.1: Define design token system

- [ ] Create `lib/sdui/tokens.ts` with Zod schemas for the design token system
- [ ] Define `SpacingToken` enum: `none`, `xs` (4), `sm` (8), `md` (16), `lg` (24), `xl` (32), `xxl` (48)
- [ ] Define `ColorToken` enum: semantic colors (`primary`, `secondary`, `accent`, `background`, `surface`, `error`, `success`, `warning`, `textPrimary`, `textSecondary`, `textTertiary`, `border`, `divider`)
- [ ] Define `RadiusToken` enum: `none`, `sm` (4), `md` (8), `lg` (16), `xl` (24), `full` (9999)
- [ ] Define `ShadowToken` enum: `none`, `sm`, `md`, `lg`
- [ ] Define `TextStyleToken` enum: `largeTitle`, `title1`, `title2`, `title3`, `headline`, `body`, `callout`, `subheadline`, `footnote`, `caption1`, `caption2`
- [ ] Define `IconToken` as a string enum of supported SF Symbol names used across the app

**Files:**
- `web-cms/lib/sdui/tokens.ts` (create)

**Dependencies:** none
**Estimate:** S (1-2 hours)

---

### Task 2.2: Create Zod schemas for layout components

- [ ] Create `lib/sdui/schemas/layout.ts`
- [ ] Define `VStackSchema` -- children array, spacing token, padding, alignment (`leading`, `center`, `trailing`, `stretch`)
- [ ] Define `HStackSchema` -- children array, spacing token, padding, alignment (`top`, `center`, `bottom`, `stretch`)
- [ ] Define `ScrollViewSchema` -- children array, axis (`vertical`, `horizontal`), showsIndicators boolean, refreshable boolean
- [ ] Define `SectionSchema` -- title string, subtitle optional, children array, headerAction optional
- [ ] Define `GridSchema` -- children array, columns (fixed count or adaptive with minWidth), spacing token
- [ ] Define `SpacerSchema` -- size token or fixed pixel value
- [ ] Define `DividerSchema` -- color token, thickness optional
- [ ] Handle recursive `children` references using `z.lazy()` for nested component trees

**Files:**
- `web-cms/lib/sdui/schemas/layout.ts` (create)

**Dependencies:** Task 2.1
**Estimate:** M (3-4 hours)

---

### Task 2.3: Create Zod schemas for content and interactive components

- [ ] Create `lib/sdui/schemas/content.ts`
- [ ] Define `TextSchema` -- text string, style token, color token, numberOfLines optional, alignment optional
- [ ] Define `ImageSchema` -- url string, placeholder optional, aspectRatio optional, cornerRadius token, contentMode (`fill`, `fit`)
- [ ] Define `IconSchema` -- name (SF Symbol), size number, color token
- [ ] Define `BadgeSchema` -- text string, variant (`default`, `success`, `warning`, `error`, `info`)
- [ ] Define `ProgressBarSchema` -- value number (0-1), color token, trackColor token, height optional
- [ ] Define `AvatarSchema` -- imageUrl optional, initials optional, size (`sm`, `md`, `lg`)
- [ ] Define `ButtonSchema` -- title string, variant (`primary`, `secondary`, `outline`, `ghost`, `destructive`), size (`sm`, `md`, `lg`), icon optional, action required, isLoading boolean, disabled boolean
- [ ] Define `CardSchema` -- children array, padding token, cornerRadius token, shadow token, action optional (tappable card)
- [ ] Define `ListItemSchema` -- leading component optional, title string, subtitle optional, trailing component optional, action optional
- [ ] Define `EmptyStateSchema` -- icon optional, title string, message string, action optional (CTA button)
- [ ] Define `LoadingSchema` -- style (`spinner`, `skeleton`, `shimmer`)
- [ ] Define `ChipSchema` -- text string, variant (`filled`, `outlined`), selected boolean, action optional
- [ ] Define `ToggleSchema` -- isOn boolean, label string, action required
- [ ] Define `TextFieldSchema` -- placeholder string, value string, keyboardType optional, action required (onSubmit)
- [ ] Define `SegmentedControlSchema` -- segments array of {title, value}, selectedIndex number, action required

**Files:**
- `web-cms/lib/sdui/schemas/content.ts` (create)

**Dependencies:** Task 2.1
**Estimate:** L (1+ day)

---

### Task 2.4: Create Zod schemas for navigation and domain-specific components

- [ ] Create `lib/sdui/schemas/navigation.ts`
- [ ] Define `TabBarSchema` -- tabs array of {title, icon, screenId}, selectedIndex number
- [ ] Define `NavigationBarSchema` -- title string, leadingAction optional, trailingActions array optional
- [ ] Define `ToolbarSchema` -- items array of {icon, action, badge optional}
- [ ] Create `lib/sdui/schemas/domain.ts`
- [ ] Define `WorkoutCardSchema` -- workout-specific card: title, trainerName, progress percentage, status badge, daysRemaining, action
- [ ] Define `ExerciseRowSchema` -- exercise name, muscleGroup badge, equipment icon, thumbnail image, action
- [ ] Define `ProgramCardSchema` -- program-specific card: title, coverImage, difficulty badge, duration text, price optional, rating, action
- [ ] Define `ProgressChartSchema` -- chartType (`line`, `bar`), dataPoints array, xLabel, yLabel, color token
- [ ] Define `StatCardSchema` -- label, value string, trend optional (`up`, `down`, `neutral`), trendValue optional, icon optional
- [ ] Define `TrainerCardSchema` -- displayName, photoUrl, specialties, rating, totalStudents, action

**Files:**
- `web-cms/lib/sdui/schemas/navigation.ts` (create)
- `web-cms/lib/sdui/schemas/domain.ts` (create)

**Dependencies:** Task 2.1
**Estimate:** M (3-4 hours)

---

### Task 2.5: Create action system schemas

- [ ] Create `lib/sdui/schemas/actions.ts`
- [ ] Define `NavigateAction` -- screenId string, params record optional (e.g., `{ screenId: "workout-detail", params: { workoutId: "abc" } }`)
- [ ] Define `ApiCallAction` -- method (`GET`, `POST`, `PATCH`, `DELETE`), path string, body optional, onSuccess action optional, onError action optional
- [ ] Define `OpenUrlAction` -- url string, inApp boolean
- [ ] Define `ShareAction` -- text string, url optional
- [ ] Define `RefreshAction` -- screenId string (reload current or specific screen)
- [ ] Define `ShowModalAction` -- component tree for modal content, title optional, dismissable boolean
- [ ] Define `ShowAlertAction` -- title string, message string, actions array of {title, style, action}
- [ ] Define `DismissAction` -- dismiss current modal/sheet
- [ ] Define `SubmitFormAction` -- path string, method string, fieldIds array
- [ ] Define `ToggleAction` -- stateKey string, value boolean
- [ ] Define `TrackEventAction` -- eventName string, properties record optional
- [ ] Create the discriminated union `ActionSchema` using `z.discriminatedUnion("type", [...])`

**Files:**
- `web-cms/lib/sdui/schemas/actions.ts` (create)

**Dependencies:** none
**Estimate:** M (3-4 hours)

---

### Task 2.6: Create screen envelope schema and component union

- [ ] Create `lib/sdui/schemas/screen.ts`
- [ ] Define `ScreenSchema` -- the top-level response envelope: `{ screenId, title, body (component tree), refreshInterval optional, cachePolicy, analytics }`
- [ ] Define `CachePolicySchema` -- `maxAge` (seconds), `staleWhileRevalidate` (seconds), `scope` (`public`, `private`)
- [ ] Define `ComponentSchema` as the discriminated union of ALL component schemas from Tasks 2.2-2.4, using `z.discriminatedUnion("type", [...])`
- [ ] Wire up the recursive `children` references in layout components to use the `ComponentSchema` union
- [ ] Create `lib/sdui/schemas/index.ts` barrel export for all schemas

**Files:**
- `web-cms/lib/sdui/schemas/screen.ts` (create)
- `web-cms/lib/sdui/schemas/index.ts` (create)

**Dependencies:** Tasks 2.2, 2.3, 2.4, 2.5
**Estimate:** M (3-4 hours)

---

### Task 2.7: Build component builder functions

- [ ] Create `lib/sdui/builders/layout.ts` with `vstack()`, `hstack()`, `scrollView()`, `section()`, `grid()`, `spacer()`, `divider()` builder functions that return typed objects
- [ ] Create `lib/sdui/builders/content.ts` with `text()`, `image()`, `icon()`, `badge()`, `progressBar()`, `avatar()`, `button()`, `card()`, `listItem()`, `emptyState()`, `loading()`, `chip()`, `toggle()`, `textField()`, `segmentedControl()` builders
- [ ] Create `lib/sdui/builders/domain.ts` with `workoutCard()`, `exerciseRow()`, `programCard()`, `progressChart()`, `statCard()`, `trainerCard()` builders that accept domain objects and return SDUI components
- [ ] Create `lib/sdui/builders/actions.ts` with `navigate()`, `apiCall()`, `openUrl()`, `share()`, `refresh()`, `showModal()`, `showAlert()`, `dismiss()`, `submitForm()`, `toggleAction()`, `trackEvent()` action builders
- [ ] Create `lib/sdui/builders/screen.ts` with `screen()` builder that wraps a component tree in the screen envelope
- [ ] Create `lib/sdui/builders/index.ts` barrel export

**Files:**
- `web-cms/lib/sdui/builders/layout.ts` (create)
- `web-cms/lib/sdui/builders/content.ts` (create)
- `web-cms/lib/sdui/builders/domain.ts` (create)
- `web-cms/lib/sdui/builders/actions.ts` (create)
- `web-cms/lib/sdui/builders/screen.ts` (create)
- `web-cms/lib/sdui/builders/index.ts` (create)

**Dependencies:** Task 2.6
**Estimate:** L (1+ day)

---

### Task 2.8: Export JSON Schema from Zod for iOS contract

- [ ] Add `zod-to-json-schema` as a dev dependency
- [ ] Create `scripts/generate-sdui-schema.ts` -- reads all Zod schemas and exports a single `sdui-schema.json` file
- [ ] Add `"generate:schema"` npm script that runs the generation script via `tsx`
- [ ] Generate the initial `sdui-schema.json` and commit it to `docs/sdui-schema.json` for the iOS team to reference
- [ ] Add a versioning field (`schemaVersion: number`) to the screen envelope so the iOS client can detect breaking changes

**Files:**
- `web-cms/scripts/generate-sdui-schema.ts` (create)
- `web-cms/package.json` (modify -- add script and dev dep)
- `docs/sdui-schema.json` (create -- generated output)

**Dependencies:** Task 2.6
**Estimate:** S (1-2 hours)

---

## Phase 3: SDUI Endpoint Implementation

Implement the BFF screen endpoints under `/api/mobile/v1/screens/`. Each endpoint uses the service layer from Phase 1 and the builders from Phase 2 to compose a complete SDUI screen response.

---

### Task 3.1: Implement student-workouts screen endpoint

- [ ] Create `app/api/mobile/v1/screens/student-workouts/route.ts`
- [ ] Use `WorkoutService.listStudentWorkouts()` to fetch the authenticated student's workouts
- [ ] Build SDUI response: `ScrollView` > list of `WorkoutCard` components with progress bars, status badges, and navigate actions to workout-detail
- [ ] Handle empty state: show `EmptyState` component with message "Nenhum treino ainda" and optional action to browse trainers
- [ ] Include `SegmentedControl` for filtering by status (`active`, `completed`, `archived`)
- [ ] Add pull-to-refresh via `refreshable: true` on the ScrollView
- [ ] Validate response against `ScreenSchema` before returning

**Files:**
- `web-cms/app/api/mobile/v1/screens/student-workouts/route.ts` (create)

**Dependencies:** Tasks 1.2, 2.7
**Estimate:** M (3-4 hours)

---

### Task 3.2: Implement workout-detail screen endpoint

- [ ] Create `app/api/mobile/v1/screens/workout-detail/route.ts`
- [ ] Accept `workoutId` as query param
- [ ] Use `WorkoutService.getWorkoutById()` or `listStudentWorkouts()` to fetch workout with progress and feedback
- [ ] Build SDUI response: workout title, description, PDF viewer link (OpenUrl action), progress section with `ProgressBar` and `StatCard` (days completed, streak, percent), feedback section with list of feedback items
- [ ] Include action buttons: "Marcar dia" (ApiCall to mark day complete), "Enviar feedback" (ShowModal with TextInput)
- [ ] Handle not-found case with appropriate error screen

**Files:**
- `web-cms/app/api/mobile/v1/screens/workout-detail/route.ts` (create)

**Dependencies:** Tasks 1.2, 2.7
**Estimate:** M (3-4 hours)

---

### Task 3.3: Implement student-home screen endpoint

- [ ] Create `app/api/mobile/v1/screens/student-home/route.ts`
- [ ] Compose a dashboard screen for the authenticated student
- [ ] Section 1: "Treino de Hoje" -- active workout card with progress, navigate to workout-detail
- [ ] Section 2: "Seu Progresso" -- stat cards for current streak, total workouts completed, percent complete across all active workouts
- [ ] Section 3: "Seus Programas" -- horizontal scroll of program cards (from `ProgramService.listPrograms({ studentId })`)
- [ ] Section 4: "Seu Personal" -- trainer card with name, photo, rating, and action to navigate to trainer-profile or chat
- [ ] Handle student with no trainer connected: show connect CTA instead of trainer card
- [ ] Handle student with no active workouts: show motivational empty state

**Files:**
- `web-cms/app/api/mobile/v1/screens/student-home/route.ts` (create)

**Dependencies:** Tasks 1.2, 1.3, 1.6, 1.7, 2.7
**Estimate:** L (1+ day)

---

### Task 3.4: Implement trainer-profile screen endpoint

- [ ] Create `app/api/mobile/v1/screens/trainer-profile/route.ts`
- [ ] Accept `trainerId` as query param
- [ ] Use `TrainerService.getTrainerProfile()` and `TrainerService.listTrainerReviews()` to fetch data
- [ ] Build SDUI response: cover photo image, avatar, name, bio, specialties as chips, certifications list, stats row (rating, students, reviews), reviews section with paginated list
- [ ] Include connection status check via `ConnectionService.checkConnectionStatus()` -- show "Conectar" button if not connected, "Pendente" badge if pending, "Conectado" badge if active
- [ ] Include "Ver Programas" button that navigates to a filtered program list for this trainer
- [ ] Use `ShareAction` for the share button in the navigation bar

**Files:**
- `web-cms/app/api/mobile/v1/screens/trainer-profile/route.ts` (create)

**Dependencies:** Tasks 1.6, 1.7, 2.7
**Estimate:** M (3-4 hours)

---

### Task 3.5: Implement exercise-catalog screen endpoint

- [ ] Create `app/api/mobile/v1/screens/exercise-catalog/route.ts`
- [ ] Accept optional `category`, `equipment`, `search` query params
- [ ] Use `ExerciseService.listExercises()` or `ExerciseService.searchExercises()` depending on params
- [ ] Build SDUI response: search `TextField` at top, `SegmentedControl` or `ChipGroup` for category filter, `ScrollView` with list of `ExerciseRow` components
- [ ] Each `ExerciseRow` navigates to an exercise-detail modal showing instructions, images, muscle groups
- [ ] Handle empty search results with `EmptyState` component
- [ ] Support pagination via `offset` param with "load more" button or infinite scroll marker

**Files:**
- `web-cms/app/api/mobile/v1/screens/exercise-catalog/route.ts` (create)

**Dependencies:** Tasks 1.5, 2.7
**Estimate:** M (3-4 hours)

---

### Task 3.6: Implement program-detail screen endpoint

- [ ] Create `app/api/mobile/v1/screens/program-detail/route.ts`
- [ ] Accept `programId` as query param
- [ ] Use `ProgramService.getProgramById()` to fetch program with all nested data (weeks, workouts, exercises)
- [ ] Build SDUI response: cover image, title, description, metadata row (difficulty badge, duration text, equipment chips), stats section (rating, sales, completion rate), week-by-week breakdown as collapsible sections
- [ ] Include CTA button: "Comprar" for paid programs, "Iniciar" for free/assigned programs
- [ ] Include preview video `OpenUrl` action if `previewVideoURL` exists
- [ ] Handle archived/private programs with appropriate error screen

**Files:**
- `web-cms/app/api/mobile/v1/screens/program-detail/route.ts` (create)

**Dependencies:** Tasks 1.3, 2.7
**Estimate:** M (3-4 hours)

---

### Task 3.7: Implement trainer-discovery screen endpoint

- [ ] Create `app/api/mobile/v1/screens/trainer-discovery/route.ts`
- [ ] Use `TrainerService.listTrainers()` to fetch active trainers with optional city/specialty filters
- [ ] Build SDUI response: search/filter bar at top, grid or list of `TrainerCard` components with rating, specialties, student count
- [ ] Each card navigates to trainer-profile screen
- [ ] Include specialty chips as horizontal scroll filter
- [ ] Support pagination with offset/limit

**Files:**
- `web-cms/app/api/mobile/v1/screens/trainer-discovery/route.ts` (create)

**Dependencies:** Tasks 1.6, 2.7
**Estimate:** M (3-4 hours)

---

### Task 3.8: Add caching headers and cache invalidation strategy

- [ ] Create `lib/sdui/cache.ts` with helper functions to set `Cache-Control` and `CDN-Cache-Control` headers based on `CachePolicy` schema
- [ ] Apply cache headers to each screen endpoint: public screens (trainer-profile, exercise-catalog, trainer-discovery) get `s-maxage=300, stale-while-revalidate=600`; private screens (student-home, student-workouts) get `private, max-age=60`
- [ ] Add `ETag` generation based on a hash of the response body for conditional requests
- [ ] Add `X-SDUI-Schema-Version` response header to every screen endpoint for client-side version detection
- [ ] Document the cache invalidation approach: Firestore writes trigger cache busting via `revalidateTag()` or short TTLs

**Files:**
- `web-cms/lib/sdui/cache.ts` (create)
- All `app/api/mobile/v1/screens/*/route.ts` (modify -- add cache headers)

**Dependencies:** Tasks 3.1-3.7
**Estimate:** S (1-2 hours)

---

## Phase 4: Testing and Validation

Comprehensive test coverage for the service layer, SDUI builders, schema validation, and BFF endpoints. Target: 80%+ coverage across new code.

---

### Task 4.1: Unit tests for service layer

- [ ] Create `__tests__/services/workout-service.test.ts` -- mock Firestore, test `listWorkouts`, `getWorkoutById`, `listStudentWorkouts` with various filter combinations and edge cases (empty results, missing progress docs, expired signed URLs)
- [ ] Create `__tests__/services/program-service.test.ts` -- test `listPrograms` marketplace vs trainer-owned filtering, `getProgramById` not-found case
- [ ] Create `__tests__/services/student-service.test.ts` -- test `getStudentProfile`, `listStudentProgress`, `checkStudentLimit` at limit boundary
- [ ] Create `__tests__/services/exercise-service.test.ts` -- test in-memory search matching (Portuguese diacritics, alias matching, case insensitivity)
- [ ] Create `__tests__/services/trainer-service.test.ts` -- test city-based filtering, `toPublicProfile` transformation, review aggregation
- [ ] Create `__tests__/services/connection-service.test.ts` -- test connection status checks, accept/reject flows
- [ ] Set up test configuration: add `vitest` (or `jest`) as dev dependency, create `vitest.config.ts`, add `"test"` npm script

**Files:**
- `web-cms/__tests__/services/workout-service.test.ts` (create)
- `web-cms/__tests__/services/program-service.test.ts` (create)
- `web-cms/__tests__/services/student-service.test.ts` (create)
- `web-cms/__tests__/services/exercise-service.test.ts` (create)
- `web-cms/__tests__/services/trainer-service.test.ts` (create)
- `web-cms/__tests__/services/connection-service.test.ts` (create)
- `web-cms/vitest.config.ts` (create)
- `web-cms/package.json` (modify -- add vitest, test script)

**Dependencies:** Tasks 1.2-1.7
**Estimate:** L (1+ day)

---

### Task 4.2: Unit tests for SDUI builders

- [ ] Create `__tests__/sdui/builders.test.ts` -- test each builder function returns valid Zod-parseable output
- [ ] Test `workoutCard()` builder with a real Workout object -- verify all fields mapped correctly
- [ ] Test `programCard()` builder with pricing variations (free, one-time, subscription)
- [ ] Test `screen()` envelope builder includes all required top-level fields
- [ ] Test `navigate()`, `apiCall()`, `showModal()` action builders produce correct discriminated union shapes
- [ ] Test nested composition: `scrollView([ section("Title", [ workoutCard(...), workoutCard(...) ]) ])` produces valid deeply nested structure
- [ ] Test edge cases: empty children arrays, optional fields omitted, null-safe handling

**Files:**
- `web-cms/__tests__/sdui/builders.test.ts` (create)

**Dependencies:** Task 2.7
**Estimate:** M (3-4 hours)

---

### Task 4.3: Schema validation tests (round-trip JSON Schema)

- [ ] Create `__tests__/sdui/schema-validation.test.ts`
- [ ] Test that every builder output passes `ScreenSchema.parse()` without errors
- [ ] Test that invalid component trees are rejected (missing required fields, wrong enum values, invalid nesting)
- [ ] Test JSON Schema generation: verify `generate-sdui-schema.ts` produces valid JSON Schema draft-07
- [ ] Test round-trip: build a screen with builders, serialize to JSON, parse with JSON Schema validator (ajv), parse back with Zod -- all three should agree
- [ ] Test schema versioning: verify `schemaVersion` field increments correctly when schemas change
- [ ] Test recursive component nesting up to 10 levels deep does not cause stack overflow

**Files:**
- `web-cms/__tests__/sdui/schema-validation.test.ts` (create)

**Dependencies:** Tasks 2.7, 2.8
**Estimate:** M (3-4 hours)

---

### Task 4.4: Integration tests for BFF endpoints

- [ ] Create `__tests__/api/mobile/screens/student-workouts.test.ts` -- test with mocked Firebase Auth and Firestore, verify full response shape matches `ScreenSchema`
- [ ] Create `__tests__/api/mobile/screens/workout-detail.test.ts` -- test found and not-found cases, verify progress components included
- [ ] Create `__tests__/api/mobile/screens/student-home.test.ts` -- test with and without active trainer, with and without workouts
- [ ] Create `__tests__/api/mobile/screens/trainer-profile.test.ts` -- test public access, verify connection status affects CTA button
- [ ] Create `__tests__/api/mobile/screens/exercise-catalog.test.ts` -- test search filtering, category filtering, empty results
- [ ] Create `__tests__/api/mobile/screens/program-detail.test.ts` -- test with full week structure, test archived program error
- [ ] Test authentication: verify 401 response for missing/invalid tokens, verify 403 for wrong role
- [ ] Test cache headers: verify `Cache-Control` values match the caching strategy per endpoint

**Files:**
- `web-cms/__tests__/api/mobile/screens/student-workouts.test.ts` (create)
- `web-cms/__tests__/api/mobile/screens/workout-detail.test.ts` (create)
- `web-cms/__tests__/api/mobile/screens/student-home.test.ts` (create)
- `web-cms/__tests__/api/mobile/screens/trainer-profile.test.ts` (create)
- `web-cms/__tests__/api/mobile/screens/exercise-catalog.test.ts` (create)
- `web-cms/__tests__/api/mobile/screens/program-detail.test.ts` (create)

**Dependencies:** Tasks 3.1-3.7, 4.1
**Estimate:** L (1+ day)

---

### Task 4.5: Response snapshot tests

- [ ] Create `__tests__/sdui/snapshots/` directory
- [ ] Generate snapshot fixtures for each screen endpoint with representative data
- [ ] Create `__tests__/sdui/snapshots/student-workouts.snap.test.ts` -- assert response structure matches committed snapshot (catches unintentional schema drift)
- [ ] Create snapshots for all 7 screen endpoints
- [ ] Add snapshot update script: `"test:update-snapshots"` npm script
- [ ] Document the snapshot testing approach: when to update vs when a change indicates a bug

**Files:**
- `web-cms/__tests__/sdui/snapshots/student-workouts.snap.test.ts` (create)
- `web-cms/__tests__/sdui/snapshots/workout-detail.snap.test.ts` (create)
- `web-cms/__tests__/sdui/snapshots/student-home.snap.test.ts` (create)
- `web-cms/__tests__/sdui/snapshots/trainer-profile.snap.test.ts` (create)
- `web-cms/__tests__/sdui/snapshots/exercise-catalog.snap.test.ts` (create)
- `web-cms/__tests__/sdui/snapshots/program-detail.snap.test.ts` (create)
- `web-cms/__tests__/sdui/snapshots/trainer-discovery.snap.test.ts` (create)

**Dependencies:** Task 4.4
**Estimate:** M (3-4 hours)

---

## Summary

| Phase | Tasks | Estimated Effort |
|-------|-------|-----------------|
| Phase 1: BFF Layer Separation | 9 tasks (1.1 - 1.9) | ~6-7 days |
| Phase 2: SDUI Schema Definition | 8 tasks (2.1 - 2.8) | ~5-6 days |
| Phase 3: SDUI Endpoint Implementation | 8 tasks (3.1 - 3.8) | ~5-6 days |
| Phase 4: Testing & Validation | 5 tasks (4.1 - 4.5) | ~4-5 days |
| **Total** | **30 tasks** | **~20-24 days** |

### Dependency Graph (Critical Path)

```
1.1 ──┬── 1.2 ──┐
      ├── 1.3 ──┤
      ├── 1.4 ──┤
      ├── 1.5 ──┼── 1.8 ──┐
      ├── 1.6 ──┤         │
      ├── 1.7 ──┤         │
      └── 1.9 ──┘         │
                           │
2.1 ──┬── 2.2 ──┐         │
      ├── 2.3 ──┤         │
      └── 2.4 ──┤         │
                 ├── 2.6 ──┼── 2.7 ──┬── 3.1 ──┐
2.5 ─────────────┘         │         ├── 3.2 ──┤
                           │         ├── 3.3 ──┤
                    2.8 ───┘         ├── 3.4 ──┼── 3.8
                                     ├── 3.5 ──┤
                                     ├── 3.6 ──┤
                                     └── 3.7 ──┘
                                               │
4.1 (after 1.x) ──────────────────────┐       │
4.2 (after 2.7) ──────────────────────┼── 4.4 ┼── 4.5
4.3 (after 2.7, 2.8) ─────────────────┘       │
```

### Parallelization Notes

- Phase 1 tasks 1.2-1.7 can be done in parallel after 1.1.
- Phase 2 tasks 2.1-2.5 can be done in parallel (2.2-2.4 depend on 2.1 for tokens).
- Phase 1 and Phase 2 can proceed in parallel -- no cross-phase dependencies until Phase 3.
- Phase 3 tasks 3.1-3.7 can be done in parallel after both Phase 1 and Phase 2 complete.
- Phase 4 task 4.1 can start as soon as Phase 1 completes; 4.2-4.3 after Phase 2.
