# Learner Motion Continuity Handoff

## Result

Implemented the approved continuous-light-motion design for the learner app.

### Navigation and loading

- App route transitions now overlap instead of waiting for the outgoing screen to finish.
- The entering route is the active visual layer.
- The outgoing route is made `inert`, `aria-hidden`, and non-interactive during the fade.
- Book opening now uses bounded cover decoding plus a 180ms minimum choreography window instead of a fixed 410ms delay.
- Cover settle retries were shortened from up to 1.6s to 240ms.
- Home catalog loading starts in an explicit loading state.
- A remembered category begins loading in parallel with interests/categories/settings.
- Book responses are guarded against stale category selections.
- Learner route chunks are prefetched during idle time when the connection permits it.

### Player motion

- Listen/read/write/speak panels now crossfade in a shared grid stack.
- Entering panels use 180ms opacity plus a maximum 6px translate.
- Leaving panels fade over 120ms and accept no pointer input.
- The bottom mode navigation remains stationary.
- Performance marks measure mode-transition readiness.

### Reduced motion

- Route translation and book scaling are bypassed.
- Mode-panel translation is removed.
- Existing reduced-motion behavior for atmosphere, cover animation, recording, and skeleton loops remains active.

## Measurements

Production build, 390x844, mocked API:

- Home to first visible lesson content: 284ms.
- Direct home load: approximately 586ms in this sample.
- Direct lesson list: approximately 432ms.
- Direct player: approximately 496ms.
- Direct personal center: approximately 459ms.
- CI route continuity budget: under 900ms.
- Local route target: under 650ms.

## Verification

- Frontend unit tests: 16 passed.
- Frontend E2E: 87 passed.
- Production build: passed.
- Added route continuity, delayed skeleton, mode-transition, and reduced-motion tests.

Visual evidence:

- `frontend/audit/motion-continuity-2026-11-16/01-route-transition-mid.png`
- `frontend/audit/motion-continuity-2026-11-16/02-lesson-final.png`
- `frontend/audit/motion-continuity-2026-11-16/03-mode-transition-mid.png`
- `frontend/audit/motion-continuity-2026-11-16/04-read-final.png`

## Files Changed

- `frontend/src/App.vue`
- `frontend/src/composables/useBookEnter.ts`
- `frontend/src/stores/catalog.ts`
- `frontend/src/utils/idleTask.ts`
- `frontend/src/views/learner/HomeView.vue`
- `frontend/src/views/learner/LessonListView.vue`
- `frontend/src/views/learner/PlayerView.vue`
- `frontend/src/styles/learner.css`
- `frontend/tests/e2e/learner-flow.spec.ts`
- `frontend/tests/idleTask.spec.ts`

## Git Note

Several touched files already contained user-owned modifications before this motion work. They were not committed to avoid mixing ownership and unrelated changes. The design and implementation-plan documents were committed separately.
