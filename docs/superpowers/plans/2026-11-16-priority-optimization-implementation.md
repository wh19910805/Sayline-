# Priority Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement every P1 and P2 recommendation from the 2026-11-16 product audit while preserving the current Sayline visual language and existing uncommitted user work.

**Architecture:** Keep the Vue 3, Pinia, Spring Boot, JPA, and IndexedDB boundaries already in use. Fix user-facing behavior in focused components, add book discovery metadata through the existing typed REST contract, and verify each task with a failing browser or API test before changing production code.

**Tech Stack:** Vue 3, TypeScript, CSS, Playwright, Vitest, Spring Boot, JPA, Flyway, JUnit.

---

## Scope And Constraints

- P1: offline course layout, weekly-goal consistency, profile save hierarchy, visible save feedback, read-completion transparency, speaking semantics, legal-document entry points.
- P2: actionable and localized admin alerts, minimum typography/contrast and touch targets, richer book-selection metadata, and release hygiene.
- Do not generated approved legal wording. Route and page scaffolding may be implemented, but final legal content requires approved copy.
- Do not create commits that mix pre-existing user changes with this implementation. Record verification and leave a per-file handoff until the owner separates the dirty worktree.
- Do not modify unrelated backend, admin, or design files unless required by a listed task.

## File Structure

### Learner UI

- `frontend/src/views/learner/OfflineLessonsView.vue`: mobile card layout and actions.
- `frontend/src/views/learner/MyView.vue`: goal semantics and action placement.
- `frontend/src/views/learner/ProfileSettingsView.vue`: split profile/security save surfaces.
- `frontend/src/views/learner/LearningSettingsView.vue`: visible save confirmation.
- `frontend/src/views/learner/PlayerView.vue`: read-completion and speaking copy.
- `frontend/src/views/learner/LoginView.vue`: legal links.
- `frontend/src/views/learner/LegalDocumentView.vue`: public legal-document shell.
- `frontend/src/router/index.ts`: public `/terms` and `/privacy` routes.

### Shared UI And Types

- `frontend/src/styles/components.css`: minimum touch targets and toast treatment.
- `frontend/src/styles/learner.css`: mobile type-size and navigation adjustments.
- `frontend/src/components/course/BookShelf.vue`: book metadata in the selection card.
- `frontend/src/api/types.ts`: typed book-discovery metadata.

### Admin UI

- `frontend/src/views/admin/OperationsView.vue`: localized and actionable health issues.
- `frontend/src/views/admin/CoursesView.vue`: mobile checkbox targets.
- `frontend/src/views/admin/AdminLayout.vue`: mobile navigation composition.
- `frontend/src/views/admin/BooksView.vue`: edit discovery metadata.

### Backend

- `backend/src/main/java/com/sayline/englishstudy/catalog/Book.java`
- `backend/src/main/java/com/sayline/englishstudy/catalog/CatalogDtos.java`
- `backend/src/main/java/com/sayline/englishstudy/catalog/CourseCatalogService.java`
- `backend/src/main/java/com/sayline/englishstudy/admin/AdminDtos.java`
- `backend/src/main/java/com/sayline/englishstudy/admin/AdminService.java`
- `backend/src/main/resources/db/migration/V9__add_book_discovery_metadata.sql`

### Tests

- `frontend/tests/e2e/learner-flow.spec.ts`
- `frontend/tests/e2e/book-shelf.spec.ts`
- `frontend/tests/e2e/login-security.spec.ts`
- `frontend/tests/e2e/admin-flow.spec.ts`
- `frontend/tests/e2e/mock-api.ts`
- `backend/src/test/java/com/sayline/englishstudy/admin/AdminApiTest.java`

---

### Task 1: Fix Downloaded-Course Layout On Mobile

**Files:**
- Modify: `frontend/src/views/learner/OfflineLessonsView.vue`
- Test: `frontend/tests/e2e/learner-flow.spec.ts`

- [ ] **Step 1: Add a failing browser test**

After downloading a course at 390x844, assert that:

- The article contains a metadata row followed by an action row.
- `离线学习` and `删除` do not overlap the cover.
- Both actions have a height of at least 44px and are not vertically oriented.

Use `boundingBox()` and text dimension checks, not screenshots alone.

- [ ] **Step 2: Run the test and verify it fails**

Run:

```powershell
pnpm exec playwright test tests/e2e/learner-flow.spec.ts -g "offline course layout"
```

Expected: FAIL because the mobile grid places the primary button in the 48px cover column.

- [ ] **Step 3: Implement a two-row mobile card**

Use two grid columns for the cover and copy, then place both buttons in a second row spanning the card. Keep the current desktop four-column layout.

- [ ] **Step 4: Verify**

Run the focused test and the existing offline tests.

---

### Task 2: Make Goal And Weekly Statistics Period-Independent

**Files:**
- Modify: `frontend/src/views/learner/MyView.vue`
- Test: `frontend/tests/e2e/learner-flow.spec.ts`

- [ ] **Step 1: Add a failing test**

Load `/me`, record today's goal text and weekly completion, switch to `本月`, then assert:

- Today's minutes and goal do not change because only the report period changed.
- Weekly completion still uses the seven dates ending today.

- [ ] **Step 2: Run it and verify failure**

```powershell
pnpm exec playwright test tests/e2e/learner-flow.spec.ts -g "goal remains stable"
```

Expected: FAIL because both values derive from whichever period is currently loaded.

- [ ] **Step 3: Separate active-day data from report data**

Store current-day minutes from the initial weekly response and reuse it when displaying the daily goal. Calculate weekly completion from dates in the inclusive range `today - 6 days` through `today`, independent of the selected report period.

- [ ] **Step 4: Move the goal action**

Move `调整目标` from the review-section header into the daily-goal card header. Keep the review controls unchanged.

- [ ] **Step 5: Verify**

Run the focused test plus all `review|daily goal|weekly report` tests.

---

### Task 3: Show Save Confirmation Inside The Current Viewport

**Files:**
- Modify: `frontend/src/views/learner/LearningSettingsView.vue`
- Test: `frontend/tests/e2e/learner-flow.spec.ts`

- [ ] **Step 1: Add a failing viewport test**

Change the subtitle size, save from the top of the form, and assert that a success status is visible inside the 390x844 viewport within one second.

- [ ] **Step 2: Run it and verify failure**

```powershell
pnpm exec playwright test tests/e2e/learner-flow.spec.ts -g "save confirmation stays visible"
```

Expected: FAIL because the only success message is at the bottom of the long form.

- [ ] **Step 3: Add a fixed success status**

After a successful save, show a compact top/bottom status surface for 2–3 seconds. Keep the existing inline message for document flow and accessibility.

- [ ] **Step 4: Verify**

Run the focused settings tests and `pnpm build`.

---

### Task 4: Split Profile Editing From Security Operations

**Files:**
- Modify: `frontend/src/views/learner/ProfileSettingsView.vue`
- Test: `frontend/tests/e2e/learner-flow.spec.ts`

- [ ] **Step 1: Add a failing hierarchy test**

Assert that:

- A `保存个人资料` action is adjacent to the nickname field.
- The phone-change action remains in the security section.
- Saving the profile does not submit the phone-change form.
- The profile action is visible without scrolling past login sessions or account deletion.

- [ ] **Step 2: Run it and verify failure**

```powershell
pnpm exec playwright test tests/e2e/learner-flow.spec.ts -g "profile editing has a local save"
```

- [ ] **Step 3: Split the form**

Use a profile form for nickname/avatar and a separate security form for phone/password. Keep sessions and account deletion in separate sections below. Do not alter API endpoints.

- [ ] **Step 4: Verify**

Run profile/account tests and `pnpm build`.

---

### Task 5: Explain Read Completion And Correct Speaking Language

**Files:**
- Modify: `frontend/src/views/learner/PlayerView.vue`
- Modify: `frontend/src/utils/visibleCueTimers.ts`
- Test: `frontend/tests/e2e/learner-flow.spec.ts`
- Test: `frontend/tests/speech-quality.spec.ts` only if wording logic moves into the utility.

- [ ] **Step 1: Add failing copy/state tests**

In read mode, assert that the interface explains how a sentence is marked read and exposes a visible completion hint. In speak mode, assert that a valid recording uses `录音有效` or equivalent rather than `本句已完成`.

- [ ] **Step 2: Run and verify failure**

```powershell
pnpm exec playwright test tests/e2e/learner-flow.spec.ts -g "read completion|speaking wording"
```

- [ ] **Step 3: Add explicit read feedback**

Keep the one-second engine behavior only if the screen communicates it. Prefer a two-second threshold and show a small live/complete indicator on the active reading row.

- [ ] **Step 4: Correct speaking semantics**

Use `录音有效` for duration/volume checks. Do not imply pronunciation correctness without speech-content analysis.

- [ ] **Step 5: Verify**

Run player read/speak tests and `pnpm build`.

---

### Task 6: Expose Legal Documents Without Inventing Legal Copy

**Files:**
- Modify: `frontend/src/views/learner/LoginView.vue`
- Modify: `frontend/src/router/index.ts`
- Create: `frontend/src/views/learner/LegalDocumentView.vue`
- Test: `frontend/tests/e2e/login-security.spec.ts`

- [ ] **Step 1: Add a failing public-route test**

Assert that login contains accessible links to `/terms` and `/privacy`, both routes render publicly, and neither requires authentication.

- [ ] **Step 2: Run and verify failure**

```powershell
pnpm exec playwright test tests/e2e/login-security.spec.ts -g "legal"
```

- [ ] **Step 3: Add the routes and document shell**

The shell must read its title and body from a single typed document map. Until approved legal copy exists, display a clearly visible `正式文本待法务审核` notice instead of fabricated contractual wording.

- [ ] **Step 4: Verify**

Run the legal tests and `pnpm build`.

**External dependency:** Replace the review notice with approved user-agreement and privacy-policy text before public release.

---

### Task 7: Make Admin Operations Actionable And Localized

**Files:**
- Modify: `frontend/src/views/admin/OperationsView.vue`
- Modify: `frontend/src/api/types.ts` only if orphan details are added to the response.
- Test: `frontend/tests/e2e/admin-flow.spec.ts`
- Test: `frontend/tests/e2e/mock-api.ts`

- [ ] **Step 1: Add a failing admin test**

Assert that issue and audit labels are localized, orphan-media issues expose a concrete next action, and no raw enum appears as the primary label.

- [ ] **Step 2: Run and verify failure**

```powershell
pnpm exec playwright test tests/e2e/admin-flow.spec.ts -g "operations alerts are actionable"
```

- [ ] **Step 3: Add a translation map and action map**

Map known issue and audit enums to Chinese labels. Missing/duplicate media links go to filtered courses; orphan media displays the available object details or a clear details action. Unknown values retain a readable fallback without exposing raw underscores only.

- [ ] **Step 4: Verify**

Run all admin operations tests.

---

### Task 8: Meet Mobile Typography And Touch-Target Baselines

**Files:**
- Modify: `frontend/src/views/learner/LoginView.vue`
- Modify: `frontend/src/views/learner/PlayerView.vue`
- Modify: `frontend/src/views/learner/MyView.vue`
- Modify: `frontend/src/views/admin/CoursesView.vue`
- Modify: `frontend/src/views/admin/AdminLayout.vue`
- Modify: `frontend/src/styles/components.css`
- Modify: `frontend/src/styles/learner.css`
- Test: `frontend/tests/e2e/ui-quality.spec.ts`

- [ ] **Step 1: Add failing quality assertions**

Assert:

- Login helper links are at least 12px.
- Player metadata and inactive labels are at least 12px where they carry information.
- Settings section shortcuts and admin checkboxes expose at least 44px hit areas.
- The range input exposes a 44px interaction area without visually thickening the rail.
- The mobile admin navigation makes all items discoverable.

- [ ] **Step 2: Run and verify failure**

```powershell
pnpm exec playwright test tests/e2e/ui-quality.spec.ts
```

- [ ] **Step 3: Apply shared and scoped styles**

Use a transparent `::before` or wrapper for expanded hit areas. Do not enlarge every visual icon. Increase informational text only where contrast or legibility is weak.

- [ ] **Step 4: Verify**

Run UI-quality tests at 390x844 and check the four key screenshots.

---

### Task 9: Add Book Discovery Metadata End To End

**Files:**
- Modify: `backend/src/main/java/com/sayline/englishstudy/catalog/Book.java`
- Modify: `backend/src/main/java/com/sayline/englishstudy/catalog/CatalogDtos.java`
- Modify: `backend/src/main/java/com/sayline/englishstudy/catalog/CourseCatalogService.java`
- Modify: `backend/src/main/java/com/sayline/englishstudy/admin/AdminDtos.java`
- Modify: `backend/src/main/java/com/sayline/englishstudy/admin/AdminService.java`
- Create: `backend/src/main/resources/db/migration/V9__add_book_discovery_metadata.sql`
- Modify: `frontend/src/api/types.ts`
- Modify: `frontend/src/views/admin/BooksView.vue`
- Modify: `frontend/src/components/course/BookShelf.vue`
- Test: `backend/src/test/java/com/sayline/englishstudy/admin/AdminApiTest.java`
- Test: `frontend/tests/e2e/book-shelf.spec.ts`
- Test: `frontend/tests/e2e/mock-api.ts`

- [ ] **Step 1: Add failing backend tests**

Create and update a book with:

- `level`: `A1`, `A2`, `B1`, `B2`, `C1`, or `C2`
- `accent`: `US`, `UK`, `AU`, `MIXED`
- `speakingPace`: `SLOW`, `NORMAL`, `NATURAL`
- `learningGoal`: maximum 300 characters

Assert these values round-trip through the admin view and learner book summary.

- [ ] **Step 2: Add a failing learner test**

Assert the selected-book card exposes the four metadata values without crowding the mobile CTA.

- [ ] **Step 3: Add the migration and nullable model fields**

Use null-safe columns so existing books remain valid. Default to no invented metadata; the UI shows only values that exist.

- [ ] **Step 4: Extend the typed contracts**

Add the fields to `BookRequest`, `BookAdminView`, `BookSummary`, `BookDetail`, `AdminBook`, `BookSummary`, and `BookDetail` frontend types.

- [ ] **Step 5: Add admin controls**

Add selects for level/accent/pace and a short learning-goal field to the book editor.

- [ ] **Step 6: Render learner metadata**

Add a compact metadata row in `BookShelf`. Preserve the current mobile shelf geometry and desktop side-card behavior.

- [ ] **Step 7: Verify**

```powershell
cd backend
mvn -Dtest=AdminApiTest,CatalogApiTest test

cd ..\frontend
pnpm exec playwright test tests/e2e/book-shelf.spec.ts
pnpm build
```

---

### Task 10: Improve Release Hygiene Without Mixing User Changes

**Files:**
- Modify: `backend/Dockerfile`
- Create: `docs/superpowers/plans/2026-11-16-priority-optimization-implementation.md`

- [ ] **Step 1: Replace unbounded dependency prewarming**

Remove or constrain `mvn dependency:go-offline`, which resolves a very large unrelated Google Cloud BOM in a fresh container. Keep dependency caching by copying the POM and running only the package phase with the existing repository settings.

- [ ] **Step 2: Add a per-file release summary**

Record:

- Which audit priority each changed file implements.
- Which files were already dirty before this work.
- Verification commands and results.

- [ ] **Step 3: Do not commit mixed ownership changes**

Because the worktree already contains user changes in many touched files, do not stage or commit entire files. Produce a clean handoff and let the owner split or authorize commits.

---

## Verification

Run focused tests after each task, then:

```powershell
cd backend
mvn test

cd ..\frontend
pnpm test
pnpm build
pnpm test:e2e
```

Capture updated 390x844 states for:

- Offline downloaded card
- Personal-center week and month
- Learning settings after save
- Profile settings
- Read and speak modes
- Legal document shell
- Admin operations
- Admin courses mobile
- Book selection metadata

## Evidence Limits

- Legal copy is not supplied and must not be invented.
- Pronunciation accuracy is out of scope; copy may only describe recording quality.
- Mixed pre-existing changes prevent safe commits without owner confirmation.
