# Product Optimization Backlog Implementation Plan

> **For agentic workers:** Execute inline in the current workspace. Every behavior change starts with a failing automated test, then minimal implementation, then full regression.

**Goal:** Implement the prioritized functional, UX, accessibility, performance, and admin improvements identified in the product audit.

**Architecture:** Keep the existing Vue 3 + Spring Boot feature-first structure. Extend existing catalog, learning, user-settings, and admin modules instead of creating parallel service layers. Use typed REST DTOs and in-memory frontend caches with explicit invalidation.

**Tech Stack:** Vue 3, TypeScript, Pinia, Spring Boot 3.5, JPA, Flyway, Playwright, Vitest, JUnit 5.

---

## Batch 1: Safety And Core Behavior

### Task 1: Real Book Search

**Files:**
- Modify: `backend/src/main/java/com/sayline/englishstudy/catalog/BookRepository.java`
- Modify: `backend/src/main/java/com/sayline/englishstudy/catalog/CatalogController.java`
- Modify: `backend/src/main/java/com/sayline/englishstudy/catalog/CourseCatalogService.java`
- Modify: `frontend/src/api/services.ts`
- Modify: `frontend/src/views/learner/HomeView.vue`
- Test: `backend/src/test/java/com/sayline/englishstudy/catalog/CatalogApiTest.java`
- Test: `frontend/tests/e2e/book-shelf.spec.ts`

- [ ] Add a backend test asserting `/api/v1/books?q=...` filters title, description, and category.
- [ ] Run the test and confirm the query is currently ignored.
- [ ] Add a repository search query with nullable category and query parameters.
- [ ] Propagate `q` through controller and service.
- [ ] Add `q` to `learnerApi.books`; use an AbortController and debounce in HomeView.
- [ ] Add Playwright coverage asserting only matching books remain.

### Task 2: Book / Course / Lesson Terminology

**Files:**
- Modify: `frontend/src/views/admin/AdminLayout.vue`
- Modify: `frontend/src/views/admin/BooksView.vue`
- Modify: `frontend/src/views/admin/CoursesView.vue`
- Modify: `frontend/tests/e2e/admin-flow.spec.ts`

- [ ] Add tests for navigation labels `书籍管理` and `课时管理`.
- [ ] Update navigation, headings, create buttons, empty states, and delete copy.

### Task 3: Login Safety And Learner Logout

**Files:**
- Modify: `frontend/src/views/learner/LoginView.vue`
- Modify: `frontend/src/views/learner/MyView.vue`
- Modify: `frontend/src/stores/auth.ts`
- Modify: `frontend/src/api/cache.ts`
- Modify: `frontend/src/composables/useAmbient.ts`
- Test: `frontend/tests/learner-flow.spec.ts`

- [ ] Add a test asserting login fields are empty without an explicit demo flag.
- [ ] Remove hard-coded credentials.
- [ ] Add clear-all cache and ambient reset functions.
- [ ] Clear user state on logout and before accepting a new session.
- [ ] Add a learner logout section with confirmation and redirect to `/login`.

### Task 4: PWA Cache Isolation

**Files:**
- Modify: `frontend/public/sw.js`
- Create: `frontend/tests/sw.spec.ts`

- [ ] Add a service-worker unit test proving `/api/` responses are not cached.
- [ ] Bump cache version and restrict caching to static same-origin assets.
- [ ] Add bounded cache trimming and logout cache clearing support.

### Task 5: Remaining Touch And Accessibility Fixes

**Files:**
- Modify: `frontend/src/styles/learner.css`
- Modify: `frontend/src/views/learner/PlayerView.vue`
- Modify: `frontend/src/views/learner/LoginView.vue`
- Modify: `frontend/src/views/admin/AdminLayout.vue`
- Modify: `frontend/src/components/course/BookShelf.vue`
- Test: `frontend/tests/e2e/ui-quality.spec.ts`

- [ ] Extend the test to cover translation toggle, write-mode actions, record button, password toggle, and admin actions.
- [ ] Expand visual hit areas to at least 44px.
- [ ] Add an accessible label to the recording button and a larger invisible book hit area.

## Batch 2: Experience And Recovery

### Task 6: Scroll And Filter State Restoration

**Files:**
- Create: `frontend/src/composables/useScrollMemory.ts`
- Modify: `frontend/src/views/learner/HomeView.vue`
- Modify: `frontend/src/views/learner/LessonListView.vue`
- Modify: `frontend/src/views/learner/RecentView.vue`
- Modify: `frontend/src/views/learner/MyView.vue`
- Test: `frontend/tests/e2e/learner-flow.spec.ts`

- [ ] Add a failing browser test for returning to a scrolled list.
- [ ] Save scroll offset in sessionStorage per route/category.
- [ ] Restore after data and DOM are ready.

### Task 7: Unified Error Recovery

**Files:**
- Create: `frontend/src/components/ui/SlErrorState.vue`
- Modify learner and admin async pages.
- Test: `frontend/tests/e2e/learner-flow.spec.ts`

- [ ] Add a test where the first request fails and Retry succeeds.
- [ ] Show cause, Retry, and where relevant Back.

### Task 8: Statistics Clarity And Accessibility

**Files:**
- Modify: `frontend/src/views/learner/MyView.vue`
- Modify: `frontend/src/styles/learner.css`
- Test: `frontend/tests/e2e/learner-flow.spec.ts`

- [ ] Add per-day accessible labels and visible minute values.
- [ ] Add a textual chart summary and text legend to the heatmap.

### Task 9: Settings And Continue Learning Discoverability

**Files:**
- Modify: `frontend/src/views/learner/LearningSettingsView.vue`
- Modify: `frontend/src/components/ContinueBar.vue`
- Modify: `frontend/src/styles/learner.css`
- Test: `frontend/tests/e2e/learner-flow.spec.ts`

- [ ] Add bottom inset and a distinct save-bar surface.
- [ ] Track dirty state and only enable Save when values change.
- [ ] Add a visible “继续学习” caption to the center dock.

### Task 10: In-App Confirmations

**Files:**
- Modify: `frontend/src/views/admin/CategoriesView.vue`
- Modify: `frontend/src/views/admin/BooksView.vue`
- Modify: `frontend/src/views/admin/CoursesView.vue`
- Test: `frontend/tests/e2e/admin-flow.spec.ts`

- [ ] Replace `window.confirm` with `SlDialog`.
- [ ] Add Cancel, semantic danger action, and explicit consequence text.

## Batch 3: Product Depth And Performance

### Task 11: On-Demand Icons

**Files:**
- Modify: `frontend/src/components/ui/SlIcon.vue`
- Modify: `frontend/src/main.ts`
- Modify: `frontend/package.json`, `frontend/pnpm-lock.yaml`

- [ ] Introduce tree-shaken icon components or an explicit icon map.
- [ ] Remove the full Remix Icon stylesheet and font assets.
- [ ] Verify production bundle no longer contains the full icon font.

### Task 12: Thumbnail Delivery

**Files:**
- Modify: `backend/src/main/java/com/sayline/englishstudy/catalog/CatalogDtos.java`
- Modify: `backend/src/main/java/com/sayline/englishstudy/catalog/CourseCatalogService.java`
- Modify: `frontend/src/api/types.ts`
- Modify: `frontend/src/views/learner/HomeView.vue`
- Modify: `frontend/src/components/course/BookShelf.vue`
- Modify: `frontend/src/views/learner/RecentView.vue`
- Test: `backend/src/test/java/com/sayline/englishstudy/catalog/CatalogApiTest.java`

- [ ] Assert book summaries expose a thumbnail URL.
- [ ] Return the thumbnail first and full cover as fallback.
- [ ] Use thumbnail images in shelf and recent lists.

### Task 13: Daily Plan And Review Queue

**Files:**
- Create: `backend/src/main/resources/db/migration/V6__add_daily_goal.sql`
- Modify: `backend/src/main/java/com/sayline/englishstudy/user/UserSettings.java`
- Modify: `backend/src/main/java/com/sayline/englishstudy/user/UserProfileDtos.java`
- Modify: `backend/src/main/java/com/sayline/englishstudy/user/UserProfileService.java`
- Create: `backend/src/main/java/com/sayline/englishstudy/learning/ReviewService.java`
- Create: `backend/src/main/java/com/sayline/englishstudy/learning/ReviewDtos.java`
- Modify: `backend/src/main/java/com/sayline/englishstudy/learning/DictationAttemptRepository.java`
- Modify: `backend/src/main/java/com/sayline/englishstudy/learning/LearningController.java`
- Modify: learner settings and home/my pages.
- Test: backend API tests plus Playwright review flow.

- [ ] Add `daily_goal_minutes` with a 15-minute default.
- [ ] Compute today's progress against the daily goal.
- [ ] Return latest incorrect dictation cues as review tasks.
- [ ] Add settings, review banner, review list, and direct cue replay.

### Task 14: Unified Content Search

**Files:**
- Modify: `backend/src/main/java/com/sayline/englishstudy/catalog/BookRepository.java`
- Modify: `backend/src/main/java/com/sayline/englishstudy/catalog/CourseRepository.java`
- Modify: `backend/src/main/java/com/sayline/englishstudy/catalog/SubtitleCueRepository.java`
- Add unified search DTOs and endpoint.
- Modify: `frontend/src/views/learner/HomeView.vue`
- Test: backend and Playwright.

- [ ] Search published books, published lessons, and subtitle text.
- [ ] Group results by content type.
- [ ] Link lesson and subtitle results to the correct course/cue.

### Task 15: Admin Trends, Filtering And Batch Visibility

**Files:**
- Modify: `backend/src/main/java/com/sayline/englishstudy/admin/AdminDtos.java`
- Modify: `backend/src/main/java/com/sayline/englishstudy/admin/AdminService.java`
- Modify: `backend/src/main/java/com/sayline/englishstudy/admin/AdminController.java`
- Modify: `frontend/src/views/admin/DashboardView.vue`
- Modify: `frontend/src/views/admin/BooksView.vue`
- Test: backend and Playwright.

- [ ] Add seven-day study trend data to the dashboard.
- [ ] Add book search/category/status filters.
- [ ] Add multi-select batch show/hide for books.
- [ ] Add tests for trend data and batch visibility.

## Final Verification

- [ ] `mvn test`
- [ ] `pnpm test`
- [ ] `pnpm build`
- [ ] `pnpm test:e2e`
- [ ] Update README and API documentation.
