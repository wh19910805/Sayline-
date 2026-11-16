# Learner Motion Continuity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make learner navigation and mode changes visually continuous while reducing perceived page-load time and preserving the existing Sayline aesthetic.

**Architecture:** Keep the current Vue Router, Pinia catalog, route-level lazy loading, and the 3D bookshelf. Replace serialized and blocking transitions with CSS transform/opacity transitions, data-aware cover handoff, parallel home requests with stale-response protection, and idle route prefetching.

**Tech Stack:** Vue 3, TypeScript, CSS transitions, Vue Router, Playwright, Vitest, Vite.

---

## Task 1: Add Motion And Loading Regression Tests

**Files:**
- Modify: `frontend/tests/e2e/learner-flow.spec.ts`
- Modify: `frontend/tests/e2e/book-shelf.spec.ts`
- Modify: `frontend/tests/e2e/ui-quality.spec.ts`

- [ ] **Step 1: Add a route continuity test**

Start at `/`, click the active book, and assert:

- At least one `.app-screen` remains visible throughout route change.
- During the entering transition, the outgoing screen has `pointer-events: none`.
- The lesson title becomes visible without an intentional blank frame.
- The browser measurement from `performance.mark('book-open-start')` to the first visible `.lesson-row` is below the CI budget of 900ms.

- [ ] **Step 2: Add a delayed skeleton test**

Delay `/api/v1/books` by 500ms and assert:

- The home skeleton is visible before books resolve.
- The empty state is not visible while the request is pending.

- [ ] **Step 3: Add a mode continuity test**

Switch from listen to read to write and assert:

- Entering panel becomes visible within 200ms.
- The bottom mode navigation's bounding box does not move.
- Only one mode panel accepts pointer events after the transition.

- [ ] **Step 4: Add reduced-motion assertions**

Under reduced motion, assert route and mode transitions have no translation and no non-essential animation duration.

- [ ] **Step 5: Run the new tests and verify failure**

Run:

```powershell
pnpm exec playwright test tests/e2e/learner-flow.spec.ts tests/e2e/book-shelf.spec.ts tests/e2e/ui-quality.spec.ts -g "motion continuity|delayed loading|mode navigation stays fixed|reduced motion"
```

Expected: FAIL because loading, route stacking, and mode transition behavior are not implemented.

---

## Task 2: Make App Route Transitions Non-Blocking

**Files:**
- Modify: `frontend/src/App.vue`
- Modify: `frontend/src/styles/tokens/motion.css`

- [ ] **Step 1: Add an app route layer**

Render only the active route while retaining the existing KeepAlive behavior. Use simultaneous enter/leave transition classes rather than `mode="out-in"`.

Use `@before-leave` to set `element.inert = true` and `aria-hidden="true"` on the outgoing screen. Clear those attributes in `@after-leave` before Vue removes the node, so no focus or assistive-technology access can cross layers.

- [ ] **Step 2: Define stacking and pointer behavior**

The entering screen is the top interactive layer. The leaving screen remains beneath it during the crossfade and gets `pointer-events: none`, `inert`, and `aria-hidden="true"` for the fade duration.

- [ ] **Step 3: Use the motion contract**

- Enter: opacity 0 to 1 plus `translateY(6px)` to 0 over 180ms.
- Leave: opacity 1 to 0 over 120ms with no scale.
- Reduced motion: opacity-only at 0ms, no transform.

- [ ] **Step 4: Verify route tests**

Run the route continuity test and the existing navigation/search tests.

---

## Task 3: Make Book Opening Data-Aware And Faster

**Files:**
- Modify: `frontend/src/composables/useBookEnter.ts`
- Modify: `frontend/tests/e2e/book-shelf.spec.ts`

- [ ] **Step 1: Decode covers with a bounded wait**

Preload the cover and race `image.decode()` against a 220ms timeout. Catch decode rejection and continue with the gradient fallback.

- [ ] **Step 2: Remove the fixed 410ms routing delay**

Route after the bounded decode wait plus one frame, never after two serial delays. Start the cover expansion immediately on the next frame.

- [ ] **Step 3: Shorten settle behavior**

Retry destination cover lookup at most six times at 40ms intervals. Use a 180–220ms settle transition.

- [ ] **Step 4: Preserve reduced-motion behavior**

Reduced motion navigates immediately without cover scaling.

- [ ] **Step 5: Verify**

Run:

```powershell
pnpm exec playwright test tests/e2e/book-shelf.spec.ts
```

Expected: all shelf tests pass and home-to-lesson continuity test remains under budget.

---

## Task 4: Parallelize Home Loading Without Stale Responses

**Files:**
- Modify: `frontend/src/stores/catalog.ts`
- Modify: `frontend/src/views/learner/HomeView.vue`
- Test: `frontend/tests/e2e/learner-flow.spec.ts`

- [ ] **Step 1: Add explicit readiness**

Initialize catalog loading as true before the first home render. Do not show the empty state until interests and the selected category's books have resolved.

- [ ] **Step 2: Start a known-category book request in parallel**

Read `sayline:home-category` first. If it is `favorite` or a numeric category, begin `loadBooks` immediately alongside `loadInterests`.

- [ ] **Step 3: Guard stale requests**

Increment a category request generation for every selection. Commit a response only when its generation and category still match the current selection.

- [ ] **Step 4: Merge metadata correctly**

When interests/settings resolve, preserve a valid parallel book response. If the resolved default differs from the provisional remembered category, request the correct category once.

- [ ] **Step 5: Verify**

Run the delayed skeleton test, category switching tests, favorite tests, and home scroll restoration tests.

---

## Task 5: Prefetch Learner Route Chunks Safely

**Files:**
- Create: `frontend/src/utils/idleTask.ts`
- Modify: `frontend/src/views/learner/HomeView.vue`
- Modify: `frontend/src/views/learner/LessonListView.vue`
- Test: `frontend/tests/e2e/learner-flow.spec.ts`

- [ ] **Step 1: Add a shared idle helper**

Expose `runWhenIdle(task)` using `requestIdleCallback` when available and a 200ms `setTimeout` fallback.

- [ ] **Step 2: Skip constrained connections**

Do not prefetch when `navigator.connection.saveData` is true or effective type is `slow-2g`/`2g`.

- [ ] **Step 3: Prefetch the next route module**

- Home shelf stable: import the lesson-list view module.
- Lesson list stable: import the player view module.

Do not prefetch data APIs in this task.

- [ ] **Step 4: Verify**

Run the learner navigation tests and production build.

---

## Task 6: Add Continuous Mode Panel Transitions

**Files:**
- Modify: `frontend/src/views/learner/PlayerView.vue`
- Modify: `frontend/src/styles/learner.css`
- Test: `frontend/tests/e2e/learner-flow.spec.ts`

- [ ] **Step 1: Add a grid stacking wrapper**

Wrap the listen/read/write/speak panels in one transition container where entering and leaving panels share a grid cell.

Bind `:key="mode"` to the active mode panel so Vue cannot reuse one DOM node across listen/read/write/speak changes and skip the transition.

- [ ] **Step 2: Transition without moving navigation**

- Enter: opacity plus max 6px translate over 180ms.
- Leave: opacity over 120ms.
- Leaving panel gets `pointer-events: none`.
- Entering panel gets pointer events immediately.
- Bottom mode navigation remains outside the transition.

- [ ] **Step 3: Preserve behavior**

Input focus, scroll restoration, cue observers, recording, and countdowns must start only after the incoming panel is mounted.

- [ ] **Step 4: Handle reduced motion**

Disable translation and use immediate/opacity-only mode changes.

- [ ] **Step 5: Verify**

Run all player-mode tests and the mode continuity test.

---

## Task 7: Final Motion And Performance Verification

**Files:**
- Modify: `frontend/tests/e2e/ui-quality.spec.ts` if final checks are missing.

- [ ] **Step 1: Run focused tests**

```powershell
pnpm exec playwright test tests/e2e/learner-flow.spec.ts tests/e2e/book-shelf.spec.ts tests/e2e/ui-quality.spec.ts
```

- [ ] **Step 2: Run full verification**

```powershell
pnpm test
pnpm build
pnpm test:e2e
```

- [ ] **Step 3: Capture production screenshots**

Capture:

- Home during delayed loading.
- Midpoint of home-to-lesson transition.
- Listen/read/write mode mid-transition.
- Reduced-motion states.

Reject any screenshot with blank frames, overlapping interactive layers, or shifted navigation.

### Performance Mark Points

- In `HomeView.openBook()`, call `performance.mark('book-open-start')` immediately before opening the cover transition.
- In `LessonListView`, after lesson data has rendered and at least one `.lesson-row` is in the DOM, call `performance.mark('lesson-visible')` and `performance.measure(...)`.
- The E2E test reads that named measure. It does not infer the timing from Playwright click completion.

## Commit Strategy

The worktree already contains user-owned changes, and motion changes overlap files that are already dirty. Whole-file staging is unsafe.

- Do not use `git add .`.
- Do not commit a file if its diff contains pre-existing unrelated changes that cannot be isolated.
- Use reviewed partial staging only when the motion-owned hunks can be separated cleanly.
- Otherwise leave the verified motion changes unstaged and document them for the owner.

## Acceptance Summary

- No blank route interval.
- Home-to-lesson first visible content target under 650ms locally and under 900ms in CI with mocked data.
- Home skeleton appears before delayed data resolves.
- Mode switch becomes visible within 200ms and does not move bottom navigation.
- Reduced motion remains functional and animation-free.
- Existing frontend tests/build continue to pass.
