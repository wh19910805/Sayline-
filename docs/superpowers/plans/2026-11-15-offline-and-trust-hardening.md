# Offline And Trust Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make downloaded courses genuinely usable offline, preserve offline learning progress, remove the profile-page overlap, and make account trust surfaces actionable.

**Architecture:** Keep the existing Vue 3, Pinia, IndexedDB, and route-guard structure. Persist only serializable course snapshots, add a bounded offline identity snapshot, and queue failed learning mutations for ordered replay after reconnection.

**Tech Stack:** Vue 3, TypeScript, Pinia, Vue Router, IndexedDB, Playwright, Vitest, Spring Boot.

---

## Scope

This plan covers the remaining release blockers from the 2026-11-15 audit except the excluded single-book home whitespace.

Reference scope: `docs/superpowers/specs/2026-11-15-product-experience-optimization-scope.md`

## File Structure

- `frontend/src/utils/offlineCourse.ts`: serializable course download/read/delete storage.
- `frontend/src/utils/offlineSession.ts`: create this focused module for cached offline identity.
- `frontend/src/utils/offlineMutationQueue.ts`: create this focused module for offline learning mutations.
- `frontend/src/stores/auth.ts`: online/offline session restoration and clearing.
- `frontend/src/router/index.ts`: route access while offline.
- `frontend/src/views/learner/PlayerView.vue`: enqueue failed actions, positions, and confirmations.
- `frontend/src/views/learner/ProfileSettingsView.vue`: remove sticky save overlap.
- `frontend/src/views/learner/LoginView.vue`: expose legal links.
- `frontend/tests/e2e/learner-flow.spec.ts`: download, offline relaunch, and overlap regression coverage.
- `frontend/tests/e2e/login-security.spec.ts`: legal-link and authentication trust coverage.

### Task 1: Serialize Courses Before Writing To IndexedDB

**Files:**
- Modify: `frontend/src/views/learner/PlayerView.vue:306-316`
- Modify: `frontend/src/utils/offlineCourse.ts:36-49`
- Test: `frontend/tests/e2e/learner-flow.spec.ts`

- [ ] **Step 1: Add a failing download test**

Append this test to `frontend/tests/e2e/learner-flow.spec.ts`:

```ts
test('learner downloads a course and sees it in offline storage', async ({ page }) => {
  await page.goto('/learn/1/1')
  await page.getByRole('button', { name: '下载本课时供离线学习' }).click()

  await expect(page.getByRole('button', { name: '已下载本课时' })).toBeVisible()
  await page.goto('/me/offline')
  await expect(page.getByText('Meeting a New Colleague')).toBeVisible()
})
```

- [ ] **Step 2: Run the test and confirm the current failure**

Run:

```powershell
pnpm exec playwright test tests/e2e/learner-flow.spec.ts -g "downloads a course"
```

Expected: FAIL because the UI shows `出现未知错误，请稍后重试`. The browser error is `DataCloneError`.

- [ ] **Step 3: Pass a plain course snapshot into the storage utility**

In `PlayerView.vue`, replace:

```ts
const record = await downloadCourse(course.value)
```

with:

```ts
const snapshot = JSON.parse(JSON.stringify(course.value)) as CourseDetail
const record = await downloadCourse(snapshot)
```

Use the existing `CourseDetail` import. No new abstraction is needed because this is the only caller.

- [ ] **Step 4: Defend the storage boundary**

At the beginning of `downloadCourse`, clone the incoming course into a plain object and store that clone in the record:

```ts
const serializableCourse = JSON.parse(JSON.stringify(course)) as CourseDetail
const record: OfflineCourse = {
  id: serializableCourse.id,
  course: serializableCourse,
  audio,
  downloadedAt: new Date().toISOString(),
  sizeBytes: audio.size,
}
```

- [ ] **Step 5: Run the test and verify success**

Run:

```powershell
pnpm exec playwright test tests/e2e/learner-flow.spec.ts -g "downloads a course"
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add frontend/src/views/learner/PlayerView.vue frontend/src/utils/offlineCourse.ts frontend/tests/e2e/learner-flow.spec.ts
git commit -m "fix: persist serializable offline courses"
```

### Task 2: Restore A Cached Identity When The Network Is Unavailable

**Files:**
- Create: `frontend/src/utils/offlineSession.ts`
- Modify: `frontend/src/stores/auth.ts:16-83`
- Modify: `frontend/src/router/index.ts:134-149`
- Test: `frontend/tests/e2e/learner-flow.spec.ts`

- [ ] **Step 1: Add the failing offline cold-start test**

Append:

```ts
test('downloaded course opens after an API-disconnected cold start', async ({ browser }) => {
  const context = await browser.newContext()
  const page = await context.newPage()
  await mockUserApi(page, 'USER')
  await page.goto('/learn/1/1')
  await page.getByRole('button', { name: '下载本课时供离线学习' }).click()
  await expect(page.getByRole('button', { name: '已下载本课时' })).toBeVisible()
  await page.close()

  const offlinePage = await context.newPage()
  await offlinePage.route('**/api/v1/**', (route) => route.abort('internetdisconnected'))
  await offlinePage.goto('/learn/1/1')

  await expect(offlinePage.locator('.player-screen')).toBeVisible()
  await expect(offlinePage.getByText('当前离线，已加载已下载的音频和字幕')).toBeVisible()
  await context.close()
})
```

- [ ] **Step 2: Run the test and confirm the redirect**

Run:

```powershell
pnpm exec playwright test tests/e2e/learner-flow.spec.ts -g "API-disconnected cold start"
```

Expected: FAIL because the new page is redirected to `/login`.

- [ ] **Step 3: Create the cached identity module**

Create `frontend/src/utils/offlineSession.ts`:

```ts
import type { User } from '@/api/types'

const STORAGE_KEY = 'sayline:offline-user'
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1_000

interface OfflineIdentity {
  user: User
  savedAt: number
}

export function rememberOfflineIdentity(user: User) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, savedAt: Date.now() }))
}

export function readOfflineIdentity(now = Date.now()): User | null {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '') as OfflineIdentity
    if (!saved.user || now - saved.savedAt > MAX_AGE_MS) {
      clearOfflineIdentity()
      return null
    }
    return saved.user
  } catch {
    return null
  }
}

export function clearOfflineIdentity() {
  localStorage.removeItem(STORAGE_KEY)
}
```

- [ ] **Step 4: Integrate the offline identity into auth**

In `auth.ts`:

- Import `clearOfflineIdentity`, `readOfflineIdentity`, and `rememberOfflineIdentity`.
- Add `const offline = ref(false)`.
- Call `rememberOfflineIdentity(response.user)` in `acceptSession`.
- On successful online `restore`, set `offline.value = false` and call `rememberOfflineIdentity(user.value)`.
- In the `restore` catch block, allow only network failures to use the snapshot:

```ts
const cachedUser = reason instanceof TypeError ? readOfflineIdentity() : null
if (cachedUser) {
  user.value = cachedUser
  accessToken.value = null
  http.setAccessToken(null)
  offline.value = true
  return cachedUser
}
clearOfflineIdentity()
```

- Clear the snapshot in `logout` and when a 401/authorization error is received.
- Return `offline` and `isOffline` from the store.

- [ ] **Step 5: Block admin access and unexpected routes while offline**

In `router/index.ts`, after the user check:

```ts
if (auth.isOffline) {
  const allowed = to.name === 'player' || to.name === 'offline-lessons'
  if (!allowed) return { name: 'offline-lessons' }
}
```

This keeps offline access limited to downloaded content and prevents cached admin access.

- [ ] **Step 6: Run the test and verify**

Run:

```powershell
pnpm exec playwright test tests/e2e/learner-flow.spec.ts -g "API-disconnected cold start"
```

Expected: PASS, and the page remains on `/learn/1/1`.

- [ ] **Step 7: Commit**

```powershell
git add frontend/src/utils/offlineSession.ts frontend/src/stores/auth.ts frontend/src/router/index.ts frontend/tests/e2e/learner-flow.spec.ts
git commit -m "fix: allow downloaded lessons after offline cold start"
```

### Task 3: Queue Learning Progress While Offline

**Files:**
- Create: `frontend/src/utils/offlineMutationQueue.ts`
- Create: `frontend/src/composables/useOfflineSync.ts`
- Modify: `frontend/src/App.vue`
- Modify: `frontend/src/views/learner/PlayerView.vue:468-499,606-615`
- Test: `frontend/tests/e2e/learner-flow.spec.ts`

- [ ] **Step 1: Add a failing reconnect test**

Add a Playwright test that:

1. Downloads the course while online.
2. Reopens it with `/api/v1/**` blocked.
3. Marks the first cue as read.
4. Restores the API routes.
5. Dispatches `window.dispatchEvent(new Event('online'))`.
6. Asserts that `/api/v1/learning/courses/1/actions` receives the queued action.

Expected before implementation: the action request is lost.

- [ ] **Step 2: Define a bounded queue**

Create `offlineMutationQueue.ts` with these operation types:

```ts
type QueuedMutation =
  | { id: string; at: number; type: 'position'; courseId: number; payload: Record<string, unknown> }
  | { id: string; at: number; type: 'action'; courseId: number; payload: Record<string, unknown> }
  | { id: string; at: number; type: 'confirm'; courseId: number; payload: Record<string, unknown> }
```

Persist to `localStorage` under `sayline:offline-mutations`. Keep at most 200 operations. Deduplicate by `type + courseId + cueId + mode`, retaining the newest value.

- [ ] **Step 3: Enqueue only network failures**

In `markCue`, `savePosition`, and `finishModeAdvance`, enqueue when the caught error is a network `TypeError`; keep current error messaging for API validation and authorization errors.

- [ ] **Step 4: Replay in the background**

Create `useOfflineSync` to:

- Run when the app mounts while `navigator.onLine`.
- Listen for the `online` event.
- Submit mutations sequentially.
- Remove a mutation only after a successful API response.
- Stop on the first non-network error and preserve the remaining queue.
- Refresh the current learning state after synchronization.

Mount the composable once in `frontend/src/App.vue`.

- [ ] **Step 5: Run focused and regression tests**

Run:

```powershell
pnpm exec playwright test tests/e2e/learner-flow.spec.ts -g "reconnect"
pnpm test
pnpm test:e2e
```

Expected: all pass.

- [ ] **Step 6: Commit**

```powershell
git add frontend/src/utils/offlineMutationQueue.ts frontend/src/composables/useOfflineSync.ts frontend/src/App.vue frontend/src/views/learner/PlayerView.vue frontend/tests/e2e/learner-flow.spec.ts
git commit -m "feat: sync offline learning progress"
```

### Task 4: Remove The Profile Save Overlap

**Files:**
- Modify: `frontend/src/views/learner/ProfileSettingsView.vue:187,250-255`
- Test: `frontend/tests/e2e/learner-flow.spec.ts`

- [ ] **Step 1: Add the failing geometry test**

```ts
test('profile save does not overlap phone update controls', async ({ page }) => {
  await page.goto('/me/profile')
  const save = await page.locator('.profile-save').boundingBox()
  const update = await page.getByRole('button', { name: '更新手机号' }).boundingBox()
  expect(save).not.toBeNull()
  expect(update).not.toBeNull()
  expect(save!.y + save!.height).toBeLessThanOrEqual(update!.y)
})
```

- [ ] **Step 2: Run it and confirm the failure**

Run:

```powershell
pnpm exec playwright test tests/e2e/learner-flow.spec.ts -g "profile save"
```

Expected: FAIL with roughly 15px overlap.

- [ ] **Step 3: Make the save action non-overlapping**

Remove `position: sticky` from `.profile-save` and place the button after the content it saves. Keep it visually prominent with the existing black surface and shadow. Do not add global bottom padding that hides the overlap problem.

- [ ] **Step 4: Run the test and full learner regression**

```powershell
pnpm exec playwright test tests/e2e/learner-flow.spec.ts
pnpm build
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add frontend/src/views/learner/ProfileSettingsView.vue frontend/tests/e2e/learner-flow.spec.ts
git commit -m "fix: prevent profile save overlap"
```

### Task 5: Make Legal Links Actionable

**Files:**
- Modify: `frontend/src/views/learner/LoginView.vue:168`
- Modify: `frontend/src/router/index.ts`
- Create: `frontend/src/views/learner/LegalDocumentView.vue`
- Test: `frontend/tests/e2e/login-security.spec.ts`

**Dependency:** Product or legal must provide approved user-agreement and privacy-policy copy. Do not invent legal text.

- [ ] **Step 1: Add the failing link test**

```ts
test('login exposes terms and privacy links', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByRole('link', { name: '用户协议' })).toHaveAttribute('href', '/terms')
  await expect(page.getByRole('link', { name: '隐私政策' })).toHaveAttribute('href', '/privacy')
})
```

- [ ] **Step 2: Add public legal routes**

Add `/terms` and `/privacy` routes with `meta.public` and render approved content through `LegalDocumentView.vue`.

- [ ] **Step 3: Replace the plain footnote**

Use two `RouterLink` elements in `login-footnote` while preserving the sentence and footer layout.

- [ ] **Step 4: Verify**

```powershell
pnpm exec playwright test tests/e2e/login-security.spec.ts
pnpm build
```

- [ ] **Step 5: Commit**

```powershell
git add frontend/src/views/learner/LoginView.vue frontend/src/router/index.ts frontend/src/views/learner/LegalDocumentView.vue frontend/tests/e2e/login-security.spec.ts
git commit -m "feat: expose legal documents from login"
```

## Product Decision Required

Self-service password recovery needs a provider choice before implementation:

- SMS provider and template approval.
- Email provider and sender domain.
- Or a time-limited reset link generated by the admin workflow.

Keep the existing administrator reset code until one channel is approved. Do not add a non-functional “forgot password” promise.

## Final Verification

Run:

```powershell
cd frontend
pnpm test
pnpm build
pnpm test:e2e

cd ..\backend
mvn test
```

Expected:

- Frontend unit tests pass.
- Production build succeeds.
- E2E download, cold-start, reconnect, profile-overlap, and legal-link tests pass.
- Backend tests pass.
