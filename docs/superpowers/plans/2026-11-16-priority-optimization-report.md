# Priority Optimization Handoff

## Status

All code-level P1/P2 audit recommendations are implemented and verified.

The following items remain external or ownership-dependent:

- Approved legal copy must replace the review shell at `/terms` and `/privacy`.
- No commit was created because the pre-existing worktree already mixes many user-owned changes with this implementation.

## P1

| Item | Status | Evidence |
| --- | --- | --- |
| Offline downloaded-course mobile layout | Done | `learner-flow.spec.ts`, `offline course layout keeps actions clear on mobile` |
| Weekly goal and today's goal period consistency | Done | `learner-flow.spec.ts`, `goal and weekly completion remain stable...` |
| Goal action moved to the correct card | Done | Same goal regression test |
| Profile save action near editable profile fields | Done | `profile editing has a local save action...` |
| Visible save confirmation | Done | `learning settings save confirmation stays visible...` |
| Explicit read-completion rule | Done | Read guidance and 2-second visibility threshold |
| Accurate speaking wording | Done | `本句待录音` / `录音已完成` |
| Public legal routes and links | Shell done | `/terms`, `/privacy`, login links; approved copy still required |

## P2

| Item | Status | Evidence |
| --- | --- | --- |
| Localized and actionable operations alerts | Done | Admin operations E2E |
| Player/helper text minimum sizes | Done | UI-quality E2E |
| 44px settings, slider, and admin checkbox targets | Done | UI-quality E2E |
| All admin mobile navigation items visible | Done | UI-quality and admin mobile E2E |
| Mobile course-management title layout | Done | Admin mobile E2E |
| Book level, accent, pace, duration, and learning goal | Done | Admin API test, bookshelf E2E, V9 migration |
| Docker dependency prewarm cleanup | Done | `backend/Dockerfile` |

## Verification

- Backend: 55 tests passed.
- Frontend unit tests: 13 passed.
- Frontend E2E: 83 passed.
- Frontend production build passed.
- Local backend container restarted with the new jar.
- Flyway schema version: V9.
- Backend health: `{"status":"ok"}`.

Visual verification:

- `frontend/audit/priority-implementation-2026-11-16/`

## Changed Areas

- Learner: offline list, personal center, profile, settings, player, login, legal shell.
- Admin: books metadata editor, operations monitor, course mobile layout.
- Shared: API types, design CSS, book shelf metadata.
- Backend: book schema/DTOs/services, admin validation, Flyway V9.
- Tests: learner/admin/login/book-shelf/UI-quality/backend API.
- Build: Dockerfile dependency prewarm removed.

## Git Handoff

The worktree contains pre-existing modifications and untracked artifacts that were present before this implementation. Do not run a broad `git add .` or create a single mixed commit. Split changes by the areas listed above after confirming ownership.
