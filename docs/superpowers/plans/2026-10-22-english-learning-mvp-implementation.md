# English Learning MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a deployable, responsive adult English learning MVP with a Spring Boot API, Vue 3 learner/admin clients, MySQL persistence, object storage, and future-client-safe authentication.

**Architecture:** A versioned REST API serves both the Vue web client and future mini-program/App clients. The backend is a feature-first Spring Boot modular monolith; the Vue app contains role-aware learner and admin routes and consumes the API through a typed client. Media is uploaded directly to S3-compatible storage via short-lived presigned URLs.

**Tech Stack:** Java 21, Spring Boot 3.5, Maven, Spring Security, JPA, Flyway, MySQL 8, MinIO/S3, JJWT, Vue 3, TypeScript, Vite, Pinia, Vue Router, Vitest, Playwright, Docker Compose.

---

## Architecture Decisions

| Decision | Choice | Reason |
|---|---|---|
| API | REST under `/api/v1` | Stable contract for browser, mini-program, and native clients |
| Authentication | Short-lived JWT access token plus opaque refresh token | Stateless API requests, revocable refresh sessions, Web and native clients can share the same model |
| Web session storage | Access token in Pinia memory; refresh token in HttpOnly cookie | Avoid putting refresh credentials in JavaScript-readable storage |
| Client isolation | Frontend calls only public HTTP APIs | A future app/mini-program replaces the UI without changing backend domains |
| File storage | Private S3-compatible bucket with presigned upload/read URLs | Avoid routing large media through the application server |
| Database | MySQL 8 with Flyway migrations | Explicit, reviewable schema evolution |
| Project structure | Monorepo: `backend/`, `frontend/`, `deploy/` | Atomic development and straightforward Docker deployment |
| Responsive strategy | Mobile-first CSS with breakpoints at 768 and 1200 | Matches approved design: 2, 3, and 4-column course feeds |
| Error contract | Single JSON error body with stable code/status/detail/requestId | Consistent handling across current and future clients |

## Planned File Structure

```text
backend/
  pom.xml
  src/main/java/com/sayline/englishstudy/
    EnglishStudyApplication.java
    common/          # errors, request id, pagination, health
    config/          # security, CORS, storage, OpenAPI
    auth/            # login, refresh, logout, JWT
    user/            # users, profile, preferences
    catalog/         # categories and courses
    learning/        # progress, dictation, sessions, statistics
    admin/           # admin-specific queries
    storage/         # presigned URLs and object metadata
  src/main/resources/
    application.yml
    db/migration/
  src/test/java/com/sayline/englishstudy/
frontend/
  package.json
  vite.config.ts
  src/
    main.ts
    App.vue
    router/
    stores/
    api/
    styles/
    components/
    views/learner/
    views/admin/
  tests/
deploy/
  nginx/
  docker-compose.yml
README.md
.env.example
```

## Task 1: Repository and Infrastructure Baseline

**Files:**
- Create: `.env.example`
- Create: `docker-compose.yml`
- Create: `README.md`
- Create: `backend/pom.xml`
- Create: `backend/src/main/resources/application.yml`
- Create: `backend/src/main/java/com/sayline/englishstudy/EnglishStudyApplication.java`
- Create: `backend/src/test/java/com/sayline/englishstudy/HealthSmokeTest.java`

- [ ] Write a `@SpringBootTest` smoke test that asserts the application context starts.
- [ ] Run `mvn test` and verify the test fails because the backend project does not exist.
- [ ] Create the Maven project, configuration, and Docker services for MySQL 8 and MinIO.
- [ ] Add `/health` and `/ready` endpoints using Spring Boot Actuator or a small controller.
- [ ] Run `mvn test` and verify the smoke test passes.
- [ ] Commit: `chore: bootstrap backend and local infrastructure`.

## Task 2: Database Schema and Domain Entities

**Files:**
- Create: `backend/src/main/resources/db/migration/V1__initial_schema.sql`
- Create: `backend/src/main/java/com/sayline/englishstudy/user/User.java`
- Create: `backend/src/main/java/com/sayline/englishstudy/catalog/CourseCategory.java`
- Create: `backend/src/main/java/com/sayline/englishstudy/catalog/Course.java`
- Create: `backend/src/main/java/com/sayline/englishstudy/catalog/SubtitleCue.java`
- Create: `backend/src/main/java/com/sayline/englishstudy/learning/CourseFavorite.java`
- Create: `backend/src/main/java/com/sayline/englishstudy/learning/LearningRecord.java`
- Create: `backend/src/main/java/com/sayline/englishstudy/learning/LearningCueProgress.java`
- Create: `backend/src/main/java/com/sayline/englishstudy/learning/DictationAttempt.java`
- Create: `backend/src/main/java/com/sayline/englishstudy/learning/LearningDailyStat.java`
- Test: `backend/src/test/java/com/sayline/englishstudy/catalog/CourseSchemaTest.java`

- [ ] Write a repository integration test that saves a category, course, and two subtitle cues and reads them back in order.
- [ ] Run the test and verify it fails because the entities/repositories do not exist.
- [ ] Add Flyway schema and JPA entities for categories, single-lesson courses, subtitle cues, favorites, cue progress, attempts, learning records, daily stats, users, and refresh sessions.
- [ ] Add unique/index constraints:
  - `users.phone`
  - `(course_id, sequence_no)`
  - `(user_id, course_id)` for favorites and learning records
  - `(user_id, cue_id)` for cue progress
  - `(user_id, course_id, stat_date)` for daily stats
- [ ] Run the integration test against MySQL-compatible test infrastructure and verify it passes.
- [ ] Commit: `feat: add course and learning schema`.

## Task 3: Authentication and Refresh Sessions

**Files:**
- Create: `backend/.../auth/AuthController.java`
- Create: `backend/.../auth/AuthService.java`
- Create: `backend/.../auth/JwtService.java`
- Create: `backend/.../auth/RefreshSession.java`
- Create: `backend/.../auth/RefreshSessionRepository.java`
- Create: `backend/.../config/SecurityConfig.java`
- Test: `backend/src/test/java/com/sayline/englishstudy/auth/AuthFlowTest.java`

- [ ] Write failing MockMvc tests for registration, duplicate phone, login, invalid password, refresh rotation, logout, and disabled users.
- [ ] Implement BCrypt password storage and strict request validation.
- [ ] Issue a 15-minute JWT access token and a 30-day opaque refresh token stored as a SHA-256 hash in MySQL.
- [ ] Set the refresh token as `HttpOnly`, `Secure` in production, `SameSite=Lax` cookie.
- [ ] Add a separate API refresh path that accepts a refresh token in JSON for future native/mini-program clients.
- [ ] Configure `/api/v1/auth/**`, `/health`, and `/ready` as public; everything else requires authentication.
- [ ] Run `mvn test`; verify all auth tests pass.
- [ ] Commit: `feat: add API authentication and refresh tokens`.

## Task 4: Categories, Courses, Favorites, and Search

**Files:**
- Create: `backend/.../catalog/CategoryController.java`
- Create: `backend/.../catalog/CourseController.java`
- Create: `backend/.../catalog/CourseService.java`
- Create: `backend/.../catalog/CatalogDtos.java`
- Create: `backend/.../learning/FavoriteService.java`
- Test: `backend/src/test/java/com/sayline/englishstudy/catalog/CatalogApiTest.java`

- [ ] Write failing API tests for category listing, published-course filtering, direct course lookup, title/category search, favorite toggling, and favorite list ordering.
- [ ] Implement category and course queries with published/offline filtering.
- [ ] Implement course favorite/unfavorite endpoints with idempotent behavior.
- [ ] Return course list summaries and course detail including ordered subtitle cues.
- [ ] Add pagination to catalog and favorites endpoints.
- [ ] Run `mvn test`; verify tests pass.
- [ ] Commit: `feat: add catalog search and favorites API`.

## Task 5: Learning Progress, Sessions, and Statistics

**Files:**
- Create: `backend/.../learning/LearningController.java`
- Create: `backend/.../learning/LearningService.java`
- Create: `backend/.../learning/StatsService.java`
- Create: `backend/.../learning/LearningDtos.java`
- Test: `backend/src/test/java/com/sayline/englishstudy/learning/LearningFlowTest.java`

- [ ] Write failing tests for:
  - updating current mode/cue/position
  - confirming each mode after progress reaches 100%
  - course completion only when all four modes are 100% and confirmed
  - deduplicated per-cue progress
  - 30-second session counting and 10-minute inactivity rule
  - week/month aggregation in Asia/Shanghai
- [ ] Implement progress upsert and per-cue tracking.
- [ ] Implement mode completion and course completion rules.
- [ ] Implement active study session heartbeats and daily counters.
- [ ] Implement week/month reports and dashboard aggregates.
- [ ] Run `mvn test`; verify tests pass.
- [ ] Commit: `feat: add progress and learning statistics`.

## Task 6: Media Upload and Subtitle Processing

**Files:**
- Create: `backend/.../storage/StorageService.java`
- Create: `backend/.../storage/S3StorageService.java`
- Create: `backend/.../storage/UploadController.java`
- Create: `backend/.../catalog/SubtitleParser.java`
- Test: `backend/src/test/java/com/sayline/englishstudy/storage/UploadApiTest.java`
- Test: `backend/src/test/java/com/sayline/englishstudy/catalog/SubtitleParserTest.java`

- [ ] Write failing tests for valid SRT/VTT, invalid timestamps, missing bilingual lines, overlapping cues, and unauthenticated upload requests.
- [ ] Implement presigned upload requests for cover, audio, and subtitle objects.
- [ ] Enforce file type and size validation on the server.
- [ ] Parse SRT/VTT into ordered cues and keep the original file in object storage.
- [ ] Reject publication until all three media objects are present and subtitles are valid.
- [ ] Run `mvn test`; verify tests pass.
- [ ] Commit: `feat: add media upload and subtitle validation`.

## Task 7: Admin APIs

**Files:**
- Create: `backend/.../admin/AdminController.java`
- Create: `backend/.../admin/AdminCourseService.java`
- Create: `backend/.../admin/AdminUserService.java`
- Create: `backend/.../admin/AdminDashboardService.java`
- Test: `backend/src/test/java/com/sayline/englishstudy/admin/AdminApiTest.java`

- [ ] Write failing tests for category CRUD, course draft/publish/offline transitions, user search/disable, and dashboard metrics.
- [ ] Enforce ADMIN role on all admin endpoints.
- [ ] Reject category deletion when courses exist.
- [ ] Implement dashboard totals for learners, active users, course starts, completion rate, study duration, dictation accuracy, and speaking count.
- [ ] Run `mvn test`; verify tests pass.
- [ ] Commit: `feat: add admin management API`.

## Task 8: Frontend Scaffold and Shared Runtime

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/tsconfig.json`
- Create: `frontend/src/main.ts`
- Create: `frontend/src/App.vue`
- Create: `frontend/src/router/index.ts`
- Create: `frontend/src/stores/auth.ts`
- Create: `frontend/src/api/http.ts`
- Create: `frontend/src/styles/tokens.css`
- Create: `frontend/src/styles/base.css`
- Test: `frontend/tests/http.spec.ts`

- [ ] Write failing tests for Authorization header attachment, 401 refresh-and-retry, refresh failure, and API error mapping.
- [ ] Scaffold Vue 3 + TypeScript + Vite.
- [ ] Move the approved mobile/tablet/desktop breakpoints and visual tokens into production CSS.
- [ ] Implement a typed fetch client with in-memory access token and refresh-cookie retry.
- [ ] Implement Pinia auth state and route guards for USER/ADMIN.
- [ ] Run `pnpm test` and `pnpm build`; verify both pass.
- [ ] Commit: `feat: scaffold responsive Vue client`.

## Task 9: Learner UI

**Files:**
- Create: `frontend/src/views/learner/LoginView.vue`
- Create: `frontend/src/views/learner/InterestSetupView.vue`
- Create: `frontend/src/views/learner/HomeView.vue`
- Create: `frontend/src/views/learner/PlayerView.vue`
- Create: `frontend/src/views/learner/MyView.vue`
- Create: `frontend/src/views/learner/ProfileSettingsView.vue`
- Create: `frontend/src/views/learner/LearningSettingsView.vue`
- Create: `frontend/src/views/learner/PreferencesView.vue`
- Create: `frontend/src/components/player/*`
- Create: `frontend/src/components/course/*`
- Test: `frontend/tests/learner-flow.spec.ts`

- [ ] Write failing component tests for category tabs, search filtering, favorites, the four playback modes, auto-hiding controls, swipe behavior, word-letter coloring, and setting application.
- [ ] Implement the responsive home shell with 2/3/4-column course feeds.
- [ ] Implement the player with subtitle seeking, mode progress, dictation, and temporary recording.
- [ ] Implement My, profile settings, learning settings, and category preferences.
- [ ] Connect the UI to the API and handle loading/error/empty states.
- [ ] Run component tests and `pnpm build`.
- [ ] Commit: `feat: implement responsive learner experience`.

## Task 10: Admin UI

**Files:**
- Create: `frontend/src/views/admin/AdminLoginView.vue`
- Create: `frontend/src/views/admin/AdminLayout.vue`
- Create: `frontend/src/views/admin/DashboardView.vue`
- Create: `frontend/src/views/admin/CategoriesView.vue`
- Create: `frontend/src/views/admin/CoursesView.vue`
- Create: `frontend/src/views/admin/CourseEditorView.vue`
- Create: `frontend/src/views/admin/UsersView.vue`
- Test: `frontend/tests/admin-flow.spec.ts`

- [ ] Write failing tests for admin route protection, category/course forms, upload state, publish validation, user disable, and dashboard loading.
- [ ] Implement a responsive admin shell with desktop sidebar and compact mobile navigation.
- [ ] Implement the content, upload, user, and dashboard screens.
- [ ] Connect upload controls to presigned object storage URLs.
- [ ] Run component tests and `pnpm build`.
- [ ] Commit: `feat: implement responsive admin experience`.

## Task 11: End-to-End and Deployment

**Files:**
- Create: `frontend/tests/e2e/*.spec.ts`
- Create: `deploy/nginx/default.conf`
- Create: `docker-compose.yml`
- Modify: `README.md`
- Modify: `.env.example`

- [ ] Start MySQL, MinIO, backend, and frontend with Docker Compose.
- [ ] Run a Playwright E2E flow for register → interests → study → progress → favorites → stats.
- [ ] Run a Playwright E2E flow for admin upload → publish → learner visibility.
- [ ] Verify mobile, tablet, and desktop have no horizontal overflow.
- [ ] Verify `/health` and `/ready`.
- [ ] Document exact local development and production commands.
- [ ] Commit: `chore: add deployment and end-to-end verification`.

## Deferred

- SMS verification and password reset.
- Real payment and finance.
- AI pronunciation scoring.
- Persistent recording upload.
- Native App and WeChat mini-program clients.
- Offline audio download.

