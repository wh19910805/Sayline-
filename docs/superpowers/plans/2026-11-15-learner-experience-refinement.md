# Learner Experience Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve multi-book tablet/desktop composition, player readability and fallbacks, settings efficiency, personal-center hierarchy, and learning feedback without changing the mobile 3D bookshelf concept.

**Architecture:** Keep the current Vue component boundaries and design tokens. Extend existing player and bookshelf components with responsive states and explicit fallbacks; avoid new feature pages.

**Tech Stack:** Vue 3, TypeScript, CSS, Playwright, Vitest.

---

## Scope

The single-book mobile whitespace is explicitly excluded because production tabs contain at least three books. All responsive work in this plan must be tested with four books.

Reference scope: `docs/superpowers/specs/2026-11-15-product-experience-optimization-scope.md`

## File Structure

- `frontend/src/components/course/BookShelf.vue`: 3D shelf and selected-book card.
- `frontend/src/views/learner/HomeView.vue`: home navigation and shelf placement.
- `frontend/src/views/learner/PlayerView.vue`: player surfaces, fallback media, mode UI.
- `frontend/src/components/player/WordDictation.vue`: write-mode feedback.
- `frontend/src/composables/useSpeechRecording.ts`: create a focused recorder with duration and level tracking.
- `frontend/src/views/learner/LearningSettingsView.vue`: save dock and section navigation.
- `frontend/src/views/learner/MyView.vue`: personal-center section order.
- `frontend/tests/e2e/book-shelf.spec.ts`: responsive multi-book layout.
- `frontend/tests/e2e/player-cover.spec.ts`: image fallbacks.
- `frontend/tests/e2e/learner-flow.spec.ts`: player, settings, and personal-center behavior.
- `frontend/tests/e2e/ui-quality.spec.ts`: typography, contrast prerequisites, and touch targets.

### Task 1: Use Tablet And Desktop Space For Multi-Book Shelves

**Files:**
- Modify: `frontend/src/components/course/BookShelf.vue:302-387,674-812`
- Modify: `frontend/src/views/learner/HomeView.vue`
- Test: `frontend/tests/e2e/book-shelf.spec.ts`

- [ ] **Step 1: Add a failing four-book desktop test**

Add a route override with four books and assert:

- The active shelf width is greater than 560px on a 1440px viewport.
- The selected-book card moves to the right of the shelf instead of staying bottom-centered.
- The card does not cover any book.

Use bounding boxes, not snapshots.

- [ ] **Step 2: Run it and confirm failure**

```powershell
pnpm exec playwright test tests/e2e/book-shelf.spec.ts -g "multi-book desktop"
```

Expected: FAIL because the card remains fixed to the bottom center.

- [ ] **Step 3: Add desktop-only layout rules**

In `BookShelf.vue`, keep the current mobile layout unchanged. Add a `@media (min-width: 1024px)` rule that:

- Centers the shelf in the left 65–70% of the content area.
- Limits the shelf width to `min(760px, 58vw)`.
- Places `.book-selection-card` on the right as a 300–340px card.
- Removes the fixed bottom transform.
- Keeps the bottom navigation and continue control outside the card area.

At `768px–1023px`, enlarge the shelf to `min(720px, 84vw)` while keeping the selected-book card at the bottom.

- [ ] **Step 4: Keep mobile behavior unchanged**

Run the existing mobile shelf tests and compare the 390x844 capture with the current audit screenshot. No mobile geometry should change.

- [ ] **Step 5: Verify**

```powershell
pnpm exec playwright test tests/e2e/book-shelf.spec.ts
```

Expected: all shelf tests pass at mobile, tablet, and desktop widths.

- [ ] **Step 6: Commit**

```powershell
git add frontend/src/components/course/BookShelf.vue frontend/src/views/learner/HomeView.vue frontend/tests/e2e/book-shelf.spec.ts
git commit -m "feat: improve multi-book desktop shelf layout"
```

### Task 2: Add A Real Player Cover Fallback

**Files:**
- Modify: `frontend/src/views/learner/PlayerView.vue:170-182,1084-1098,1500-1525`
- Test: `frontend/tests/e2e/player-cover.spec.ts`

- [ ] **Step 1: Add a failing missing-image test**

Intercept the course cover with a 404 response and assert:

- `.player-identity__cover` shows the fallback state.
- The fallback includes a book icon and the course initial or title mark.
- The blurred backdrop does not retain the missing image.

- [ ] **Step 2: Run it and confirm failure**

```powershell
pnpm exec playwright test tests/e2e/player-cover.spec.ts -g "missing course cover"
```

Expected: FAIL because the current background image silently renders empty.

- [ ] **Step 3: Replace background-only identity rendering**

Inside `.player-identity__cover`, render an `<img>` when `playerCoverUrl` exists and add `@error="coverFailed = true"`.

Reset `coverFailed` whenever `course.id` changes, otherwise a failed cover from a previous lesson leaks into the next lesson.

Fallback order:

```ts
const playerCoverUrl = computed(() => {
  if (coverFailed.value) return null
  return course.value?.coverUrl || bookInfo.value?.coverUrl || null
})
```

When no URL remains, render the existing book-open icon with the first character of the course title.

- [ ] **Step 4: Apply the same source to the backdrop**

Only render `.player-cover-backdrop` when `playerCoverUrl` is present. When the cover fails, keep the course-color gradient rather than showing an empty blurred layer.

- [ ] **Step 5: Verify**

```powershell
pnpm exec playwright test tests/e2e/player-cover.spec.ts
pnpm build
```

Expected: pass.

- [ ] **Step 6: Commit**

```powershell
git add frontend/src/views/learner/PlayerView.vue frontend/tests/e2e/player-cover.spec.ts
git commit -m "fix: add player cover fallbacks"
```

### Task 3: Raise Player Text Readability

**Files:**
- Modify: `frontend/src/views/learner/PlayerView.vue`
- Modify: `frontend/src/styles/learner.css:2346-2382,2471-2488`
- Test: `frontend/tests/e2e/ui-quality.spec.ts`

- [ ] **Step 1: Add failing typography assertions**

On `/learn/1/1`, assert:

- `.audio-deck__times` uses at least 12px.
- `.player-header__title span`, `.player-header__title strong`, `.speed-select`, and the mode labels use at least 11px.
- Time text color has an alpha of at least 0.55 over the darkest player surface.

- [ ] **Step 2: Run it and confirm failure**

```powershell
pnpm exec playwright test tests/e2e/ui-quality.spec.ts -g "player text readability"
```

Expected: FAIL because time text is 10px with `rgba(255,250,240,.38)`.

- [ ] **Step 3: Increase size and opacity**

- Audio times: 12px, alpha at least 0.58.
- Header metadata: 11px minimum, alpha at least 0.68.
- Inactive mode labels: 12px minimum.
- Chinese translation text: preserve the user-selected color but set a minimum readable size.

Do not alter the active English line hierarchy.

- [ ] **Step 4: Verify**

```powershell
pnpm exec playwright test tests/e2e/ui-quality.spec.ts
pnpm build
```

- [ ] **Step 5: Commit**

```powershell
git add frontend/src/views/learner/PlayerView.vue frontend/src/styles/learner.css frontend/tests/e2e/ui-quality.spec.ts
git commit -m "fix: improve player text readability"
```

### Task 4: Give Write Errors Actionable Guidance

**Files:**
- Modify: `frontend/src/components/player/WordDictation.vue`
- Test: `frontend/tests/e2e/learner-flow.spec.ts`

- [ ] **Step 1: Add failing error-copy tests**

Submit one incorrect word and assert the feedback names that word position, for example:

```text
第 1 个单词需要修改
```

Submit two incorrect words and assert both positions are named.

- [ ] **Step 2: Run and confirm failure**

```powershell
pnpm exec playwright test tests/e2e/learner-flow.spec.ts -g "actionable write feedback"
```

Expected: FAIL because the current copy is generic.

- [ ] **Step 3: Compute incorrect word positions**

Add:

```ts
const incorrectWordNumbers = computed(() =>
  words.value.flatMap((word, index) =>
    wordState(word, index) === 'incorrect' ? [index + 1] : [],
  ),
)
```

Render a message naming those positions. Keep the retry button and skip action unchanged.

- [ ] **Step 4: Add a second-attempt hint**

Track `attemptCount`. On the second failed submission:

- Show the first letter and expected letter count for each incorrect word.
- Do not reveal the full answer until a third failed attempt.

- [ ] **Step 5: Verify**

```powershell
pnpm exec playwright test tests/e2e/learner-flow.spec.ts -g "write"
pnpm build
```

- [ ] **Step 6: Commit**

```powershell
git add frontend/src/components/player/WordDictation.vue frontend/tests/e2e/learner-flow.spec.ts
git commit -m "feat: improve dictation error guidance"
```

### Task 5: Add Basic Speaking Quality Feedback

**Files:**
- Create: `frontend/src/composables/useSpeechRecording.ts`
- Modify: `frontend/src/views/learner/PlayerView.vue:526-566,1229-1292`
- Create: `frontend/tests/useSpeechRecording.spec.ts`
- Test: `frontend/tests/e2e/learner-flow.spec.ts`

- [ ] **Step 1: Write failing recorder tests**

Mock `getUserMedia`, `MediaRecorder`, and Web Audio. Assert:

- Recordings shorter than one second return `too-short`.
- Recordings with near-zero input level return `too-quiet`.
- A valid recording returns `ready`.

- [ ] **Step 2: Implement the focused composable**

Move recorder lifecycle state into `useSpeechRecording`. Expose:

```ts
{
  recording,
  seconds,
  result,
  start,
  stop,
  reset,
}
```

Track duration plus peak input level via `AudioContext` while recording. Do not upload audio.

- [ ] **Step 3: Update the speaking UI**

Show one of:

- `录音太短，请完整读出本句`
- `声音太小，请靠近麦克风重试`
- `录音已就绪，可以听自己或下一句`

Keep the existing privacy behavior and four primary actions.

- [ ] **Step 4: Verify**

```powershell
pnpm exec vitest run tests/useSpeechRecording.spec.ts
pnpm exec playwright test tests/e2e/learner-flow.spec.ts -g "speak"
pnpm build
```

- [ ] **Step 5: Commit**

```powershell
git add frontend/src/composables/useSpeechRecording.ts frontend/src/views/learner/PlayerView.vue frontend/tests/useSpeechRecording.spec.ts frontend/tests/e2e/learner-flow.spec.ts
git commit -m "feat: add speaking quality feedback"
```

### Task 6: Show The Settings Save Dock Only When Needed

**Files:**
- Modify: `frontend/src/views/learner/LearningSettingsView.vue:195-205,309-340`
- Test: `frontend/tests/e2e/learner-flow.spec.ts`

- [ ] **Step 1: Add failing visibility tests**

Assert that:

- The save dock is absent initially.
- It appears after changing font size.
- It disappears after save and leaves an inline success message.
- It respects `safe-area-inset-bottom`.

- [ ] **Step 2: Run and confirm failure**

```powershell
pnpm exec playwright test tests/e2e/learner-flow.spec.ts -g "settings save dock"
```

- [ ] **Step 3: Render conditionally**

Use:

```vue
<Transition name="save-dock">
  <div v-if="dirty || saving" class="settings-save-dock is-dirty">
    ...
  </div>
</Transition>
```

Keep `inline-success` after the save completes.

- [ ] **Step 4: Add section shortcuts**

Add a compact horizontal section navigation above the form with links to:

- 字号
- 颜色
- 速度
- 目标
- 提醒
- 翻译

Use anchor buttons and `scrollIntoView`, not a new router.

- [ ] **Step 5: Add a live subtitle preview**

Add a small preview block using the current `fontScale` and `subtitleColor`. This is a preview in the settings page, not a new player mode.

- [ ] **Step 6: Verify**

```powershell
pnpm exec playwright test tests/e2e/learner-flow.spec.ts -g "learning settings"
pnpm build
```

- [ ] **Step 7: Commit**

```powershell
git add frontend/src/views/learner/LearningSettingsView.vue frontend/tests/e2e/learner-flow.spec.ts
git commit -m "feat: streamline learning settings"
```

### Task 7: Put Learning Progress Before Settings In The Personal Center

**Files:**
- Modify: `frontend/src/views/learner/MyView.vue:304-475`
- Test: `frontend/tests/e2e/learner-flow.spec.ts`

- [ ] **Step 1: Add a failing DOM-order test**

Assert the order of these sections:

1. Daily goal.
2. Review queue.
3. Learning summary.
4. Settings shortcuts.

Use element order, not pixel snapshots.

- [ ] **Step 2: Reorder the template**

Move `settings-shortcuts` below the report and skill summary. Keep profile and account security in their current logical groups.

- [ ] **Step 3: Reduce duplicated progress**

Keep the compact goal percentage in the profile insight strip or the large daily-goal card, but not both as equal-weight representations. The large card remains the primary progress display.

- [ ] **Step 4: Verify**

```powershell
pnpm exec playwright test tests/e2e/learner-flow.spec.ts -g "report|daily goal|review"
pnpm build
```

- [ ] **Step 5: Commit**

```powershell
git add frontend/src/views/learner/MyView.vue frontend/tests/e2e/learner-flow.spec.ts
git commit -m "feat: prioritize learning progress in profile"
```

## Final Verification

```powershell
cd frontend
pnpm test
pnpm build
pnpm test:e2e
```

Expected:

- Mobile shelf geometry remains unchanged.
- Four-book tablet and desktop shelf tests pass.
- Player image fallback, readable text, write guidance, speaking feedback, settings dock, and personal-center order tests pass.
- Existing E2E suite remains green.
