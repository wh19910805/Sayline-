# Admin Operations Scale Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make course management, batch import recovery, and operations alerts work reliably with hundreds of lessons and multi-item failures.

**Architecture:** Extend the existing Spring Boot admin service and Vue admin pages. Keep REST DTOs typed and add server-side filtering/sorting rather than filtering full result sets in the browser.

**Tech Stack:** Vue 3, TypeScript, Spring Boot, JPA, Flyway, JUnit, Playwright.

---

## Scope

Reference scope: `docs/superpowers/specs/2026-11-15-product-experience-optimization-scope.md`

## File Structure

- `backend/src/main/java/com/sayline/englishstudy/admin/AdminController.java`: course/import endpoints.
- `backend/src/main/java/com/sayline/englishstudy/admin/AdminService.java`: course query and sort whitelist.
- `backend/src/main/java/com/sayline/englishstudy/admin/AdminDtos.java`: course filter enums and views.
- `backend/src/main/java/com/sayline/englishstudy/catalog/CourseRepository.java`: filtered course query.
- `backend/src/main/java/com/sayline/englishstudy/admin/AdminImportService.java`: retry logic and persisted import request data.
- `backend/src/main/java/com/sayline/englishstudy/admin/ImportDtos.java`: import retry response and persisted item snapshot.
- `frontend/src/views/admin/CoursesView.vue`: course filters, sorting, and quick operational views.
- `frontend/src/views/admin/BatchImportView.vue`: result filtering, pagination, progress, and retry.
- `frontend/src/views/admin/OperationsView.vue`: actionable alert details.
- `frontend/src/api/services.ts`, `frontend/src/api/types.ts`: typed admin API changes.
- `backend/src/test/java/com/sayline/englishstudy/admin/AdminApiTest.java`: API coverage.
- `frontend/tests/e2e/admin-flow.spec.ts`: browser coverage.

### Task 1: Add Course Media Filters And Server-Side Sorting

**Files:**
- Modify: `backend/src/main/java/com/sayline/englishstudy/admin/AdminController.java:185-194`
- Modify: `backend/src/main/java/com/sayline/englishstudy/admin/AdminService.java:210-235`
- Modify: `backend/src/main/java/com/sayline/englishstudy/admin/AdminDtos.java`
- Modify: `backend/src/main/java/com/sayline/englishstudy/catalog/CourseRepository.java:31-46`
- Modify: `frontend/src/views/admin/CoursesView.vue`
- Modify: `frontend/src/api/services.ts`
- Modify: `frontend/src/api/types.ts`
- Test: `backend/src/test/java/com/sayline/englishstudy/admin/AdminApiTest.java`
- Test: `frontend/tests/e2e/admin-flow.spec.ts`

- [ ] **Step 1: Write failing backend tests**

Add tests asserting:

- `media=COMPLETE` returns only courses with audio and subtitle keys.
- `media=MISSING` returns incomplete courses.
- `sort=updatedAt,desc` orders newest first.
- An unsupported sort field returns `400`.

- [ ] **Step 2: Run the tests and confirm failure**

```powershell
cd backend
mvn -Dtest=AdminApiTest test
```

Expected: FAIL because the endpoint ignores media and sort parameters.

- [ ] **Step 3: Add the request contract**

In `AdminDtos.java`, add:

```java
public enum CourseMediaFilter {
    ALL,
    COMPLETE,
    MISSING
}
```

Extend the controller method with:

```java
@RequestParam(defaultValue = "ALL") CourseMediaFilter media,
@RequestParam(defaultValue = "sortOrder,asc") String sort
```

- [ ] **Step 4: Whitelist sortable fields**

In `AdminService.courses`, map only:

- `sortOrder`
- `updatedAt`
- `createdAt`
- `title`
- `status`

Reject any other property with `ApiException("INVALID_SORT", BAD_REQUEST, ...)`. Limit direction to `asc` or `desc`.

- [ ] **Step 5: Extend the repository query**

Add media conditions to `searchAdmin`:

```text
and (:media = 'ALL'
  or (:media = 'COMPLETE' and c.audioObjectKey is not null and c.subtitleObjectKey is not null)
  or (:media = 'MISSING' and (c.audioObjectKey is null or c.subtitleObjectKey is null)))
```

- [ ] **Step 6: Update the Vue filters**

Add a media filter select:

- 全部媒体
- 媒体完整
- 媒体缺失

Make these headers sortable:

- 课时
- 媒体
- 状态
- 更新时间

Expose sort state in API requests. Preserve filters when paginating.

- [ ] **Step 7: Verify**

```powershell
cd backend
mvn -Dtest=AdminApiTest test

cd ..\frontend
pnpm exec playwright test tests/e2e/admin-flow.spec.ts -g "filters books|courses"
```

- [ ] **Step 8: Commit**

```powershell
git add backend/src/main/java/com/sayline/englishstudy/admin backend/src/main/java/com/sayline/englishstudy/catalog/CourseRepository.java backend/src/test/java/com/sayline/englishstudy/admin/AdminApiTest.java frontend/src/views/admin/CoursesView.vue frontend/src/api/services.ts frontend/src/api/types.ts frontend/tests/e2e/admin-flow.spec.ts
git commit -m "feat: add admin media filters and sorting"
```

### Task 2: Persist Enough Import Data To Retry Failed Items

**Files:**
- Modify: `backend/src/main/java/com/sayline/englishstudy/admin/ImportDtos.java`
- Modify: `backend/src/main/java/com/sayline/englishstudy/admin/AdminImportService.java:78-151`
- Modify: `backend/src/main/java/com/sayline/englishstudy/admin/ContentImportJob.java`
- Create: `backend/src/main/resources/db/migration/V8__add_import_item_snapshot.sql`
- Test: `backend/src/test/java/com/sayline/englishstudy/admin/AdminApiTest.java`

- [ ] **Step 1: Add a failing persistence test**

Create an import with one successful and one failed item, then assert the stored job can return the original request fields needed for retry:

- type
- bookId
- sourceName
- title
- audioObjectKey
- subtitleObjectKey
- audioMd5
- subtitleMd5
- durationMs
- courseId

- [ ] **Step 2: Add a versioned job item snapshot**

Add a DTO:

```java
public record ImportJobItemSnapshot(
    ImportItemRequest request,
    ImportItemView result
) {
}
```

Store `List<ImportJobItemSnapshot>` as versioned JSON. Use `V8__add_import_item_snapshot.sql` to add an optional snapshot column; keep reading the old report format for existing jobs, but disable retry for legacy jobs with a clear message.

- [ ] **Step 3: Preserve failed request data**

Replace the current write of result-only items with snapshots. Ensure rollback still reads legacy reports.

- [ ] **Step 4: Verify migration and service tests**

```powershell
cd backend
mvn -Dtest=AdminApiTest,CourseSchemaTest test
```

- [ ] **Step 5: Commit**

```powershell
git add backend/src/main/java/com/sayline/englishstudy/admin backend/src/main/resources/db/migration backend/src/test/java/com/sayline/englishstudy/admin/AdminApiTest.java
git commit -m "feat: persist retryable import item data"
```

### Task 3: Retry Only Failed Import Items

**Files:**
- Modify: `backend/src/main/java/com/sayline/englishstudy/admin/AdminController.java:169-183`
- Modify: `backend/src/main/java/com/sayline/englishstudy/admin/AdminImportService.java`
- Modify: `frontend/src/views/admin/BatchImportView.vue:424-460`
- Modify: `frontend/src/api/services.ts`
- Test: `backend/src/test/java/com/sayline/englishstudy/admin/AdminApiTest.java`
- Test: `frontend/tests/e2e/admin-flow.spec.ts`

- [ ] **Step 1: Add failing API and browser tests**

API:

- Retry endpoint returns a new job containing only failed source items.
- Successful and duplicate items are not re-imported.
- Legacy jobs return `422 IMPORT_RETRY_UNAVAILABLE`.

Browser:

- Result filter `失败` shows only failed rows.
- “只重试失败项” invokes the endpoint and displays the new job.

- [ ] **Step 2: Add endpoint**

```java
@PostMapping("/imports/{jobId}/retry-failed")
public ImportJobView retryFailedImport(
    @AuthenticationPrincipal AuthenticatedUser user,
    @PathVariable Long jobId
) {
    return importService.retryFailed(user, jobId);
}
```

- [ ] **Step 3: Implement retry service**

`retryFailed` must:

1. Load the original job snapshots.
2. Filter `result.status == FAILED`.
3. Reject when there are no failed items.
4. Build the original `ImportExecuteRequest`.
5. Execute as a new job.
6. Audit `RETRY_FAILED_IMPORT`.

- [ ] **Step 4: Add result filters and pagination**

In `BatchImportView.vue`, add:

- Status tabs: 全部 / 成功 / 跳过 / 失败 / 需修复.
- Client pagination of 25 rows.
- Visible row count.
- “只重试失败项” button only when failed count is greater than zero.

- [ ] **Step 5: Verify**

```powershell
cd backend
mvn -Dtest=AdminApiTest test

cd ..\frontend
pnpm exec playwright test tests/e2e/admin-flow.spec.ts -g "batch import"
```

- [ ] **Step 6: Commit**

```powershell
git add backend/src/main/java/com/sayline/englishstudy/admin/AdminController.java backend/src/main/java/com/sayline/englishstudy/admin/AdminImportService.java backend/src/test/java/com/sayline/englishstudy/admin/AdminApiTest.java frontend/src/views/admin/BatchImportView.vue frontend/src/api/services.ts frontend/tests/e2e/admin-flow.spec.ts
git commit -m "feat: retry failed import items"
```

### Task 4: Show Durable Import Progress

**Files:**
- Modify: `frontend/src/views/admin/BatchImportView.vue:200-245`
- Modify: `frontend/src/api/types.ts`
- Test: `frontend/tests/e2e/admin-flow.spec.ts`

- [ ] **Step 1: Add a failing progress test**

During upload, assert:

- A native progress element appears.
- `aria-valuenow` advances with completed uploads.
- The progress does not reset when the task moves from uploading to executing.

- [ ] **Step 2: Add shared job progress state**

Track:

```ts
const uploadProgress = ref({ completed: 0, total: 0 })
const executionLabel = ref('')
```

Use a single `progressPercent` computed value for the full workflow.

- [ ] **Step 3: Render accessible progress**

```vue
<progress :value="progressPercent" max="100" aria-label="批量导入进度" />
```

Keep the textual label for screen readers and reduced-motion users.

- [ ] **Step 4: Verify**

```powershell
pnpm exec playwright test tests/e2e/admin-flow.spec.ts -g "batch import"
```

- [ ] **Step 5: Commit**

```powershell
git add frontend/src/views/admin/BatchImportView.vue frontend/src/api/types.ts frontend/tests/e2e/admin-flow.spec.ts
git commit -m "feat: show durable batch import progress"
```

### Task 5: Make Operations Alerts Actionable

**Files:**
- Modify: `backend/src/main/java/com/sayline/englishstudy/admin/OperationsService.java`
- Modify: `backend/src/main/java/com/sayline/englishstudy/admin/OperationsDtos.java`
- Modify: `backend/src/main/java/com/sayline/englishstudy/admin/AdminController.java`
- Modify: `frontend/src/views/admin/OperationsView.vue`
- Modify: `frontend/src/api/services.ts`
- Test: `backend/src/test/java/com/sayline/englishstudy/admin/AdminApiTest.java`
- Test: `frontend/tests/e2e/admin-flow.spec.ts`

- [ ] **Step 1: Add failing orphan-media detail test**

The API must return orphan object keys and upload timestamps. The UI must show each object and provide a copy-key action. Do not offer deletion in the first release of this task.

- [ ] **Step 2: Add detail endpoint**

```java
@GetMapping("/content-health/orphans")
public List<OrphanObjectView> orphanObjects()
```

Keep the count endpoint unchanged for compatibility.

- [ ] **Step 3: Add actionable issue links**

Map issue type to the relevant admin page:

- Missing media -> `/admin/courses?media=MISSING`
- Failed imports -> `/admin/imports`
- Duplicate audio -> `/admin/courses?media=COMPLETE`
- Orphan media -> display the object list inline

- [ ] **Step 4: Verify**

```powershell
cd backend
mvn -Dtest=AdminApiTest test

cd ..\frontend
pnpm exec playwright test tests/e2e/admin-flow.spec.ts -g "operations"
```

- [ ] **Step 5: Commit**

```powershell
git add backend/src/main/java/com/sayline/englishstudy/admin frontend/src/views/admin/OperationsView.vue frontend/src/api/services.ts backend/src/test/java/com/sayline/englishstudy/admin/AdminApiTest.java frontend/tests/e2e/admin-flow.spec.ts
git commit -m "feat: make operations alerts actionable"
```

## Final Verification

```powershell
cd backend
mvn test

cd ..\frontend
pnpm test
pnpm build
pnpm test:e2e
```

Expected:

- Course filters and sorting work server-side.
- Failed import items can be retried without repeating successful items.
- Import progress remains visible across upload and execution.
- Operations alerts navigate to actionable views.
- Existing admin regression tests remain green.
