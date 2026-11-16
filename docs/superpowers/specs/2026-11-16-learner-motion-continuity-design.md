# Learner Motion Continuity Design

## Goal

Improve the learner experience by making navigation and state changes feel continuous while reducing perceived page-load time. Preserve the existing editorial, warm, 3D-bookshelf identity instead of replacing it with generic functional motion.

## Measured Baseline

Production build with mocked API, 390x844 viewport:

- Home to first visible shelf content: approximately 441ms.
- Direct lesson list, player, and personal-center routes: approximately 270-419ms.
- Home to visible lesson content: approximately 1.18s.
- Player listen-to-read-to-write mode switches: approximately 100-130ms in automation, but the visual switch is currently immediate rather than intentionally animated.

Known causes:

- App route transitions use `mode="out-in"` with 140ms leave plus 220ms enter.
- Book entry waits 410ms before routing, then waits for a separate settle animation.
- Home catalog loading is serialized: interests, categories, and settings complete before books begin loading.
- The initial home render can briefly represent an empty shelf before `catalog.loading` is raised.
- Player mode panels switch through `v-if` without a shared transition.

## Motion Principles

1. Motion communicates continuity, not decoration.
2. A user action receives visible feedback within one frame.
3. Standard interface transitions finish within 180ms.
4. Scene-level choreography finishes within 280ms.
5. No route transition may create a fully blank interval.
6. Content loading must preserve layout and avoid empty-state flashes.
7. Decorative motion stops under `prefers-reduced-motion`; essential state remains understandable without motion.

## Motion Scale

| Level | Duration | Use |
| --- | --- | --- |
| Feedback | 120ms | Active/pressed states, icon response, small state color changes |
| Interface | 180ms | Route crossfade, mode switch, popovers, list entry |
| Scene | 280ms | Book opening and cover handoff |

Existing product tokens remain the source of truth. Add a scene token only if the current token system cannot express the desired value cleanly.

## Navigation Continuity

### Route changes

- Replace the app-level `out-in` transition with a simultaneous crossfade and small vertical movement.
- New route content enters with opacity and a maximum 6px translate.
- Outgoing content uses a shorter fade so it does not obscure the new page.
- The route layer must never leave a blank frame between screens.
- The entering route is stacked above the outgoing route.
- The outgoing route receives `pointer-events: none` and is removed from the accessibility tree while it fades.
- Focus must move only after the entering route is active; no control may be focusable through both layers.
- Animations use `transform` and `opacity` only.

### Book opening

- Keep the full-screen cover handoff, but run the route navigation and cover expansion as one sequence.
- Create the preload image, assign `src`, and use `Promise.race` between `image.decode()` and a 220ms timeout.
- Catch decode errors and continue the route handoff with the existing gradient fallback.
- Route after the cover is decode-ready or the timeout elapses, never both serially.
- Settle toward the lesson cover in 180-220ms.
- Reduce retry waiting when the destination cover is absent.
- Total home-to-lesson choreography target: below 650ms with already-loaded data.

## Loading Continuity

### Home

- Start in an explicit loading state before the first render.
- When a remembered or default category is known, request its books in parallel with interest/category/settings loading.
- Merge the selected category when metadata resolves without discarding a successful book response.
- Keep a request generation key for the initial parallel book request.
- Commit a parallel book response only if its category still matches the currently selected category when it resolves.
- Ignore obsolete category responses and issue the correct request after metadata resolution instead.
- Keep skeleton geometry close to the final shelf/card layout.
- Prefetch the lesson-list route chunk after the home shelf is stable and the browser is idle.
- Use `requestIdleCallback` when available and a 200ms `setTimeout` fallback otherwise.
- Skip prefetch when `navigator.connection.saveData` is true or the effective connection type is `slow-2g`/`2g`.

### Lesson list

- Preserve the skeleton shell while detail data is loading.
- Animate the first visible grouping once with a restrained stagger; do not animate every row indefinitely.
- The cover handoff uses the same cover source and ambient color as the shelf.

### Player

- Prefetch the player route chunk while the learner is on the lesson list.
- Preserve course ambient color during navigation.
- Keep data requests parallel.
- Skeleton-to-content replacement uses a 120ms crossfade, not a scale animation.

## Player Mode Transitions

- Add a mode-panel transition around listen, read, write, and speak.
- Use a grid stacking wrapper for the mode panels, with entering and leaving panels occupying the same grid area.
- Do not use `mode="out-in"`; keeping both panels mounted during the 180ms crossfade avoids a blank stage.
- The leaving panel receives `pointer-events: none`; the entering panel receives pointer events immediately.
- The mode navigation dock remains outside the transitioning panel and never moves.
- Entering mode: 160-180ms opacity plus no more than 6px vertical movement.
- Leaving mode: 100-120ms opacity only.
- Do not animate panel height, width, scroll offsets, or transforms that trigger layout.
- Input focus and scroll restoration happen after the new panel has entered.
- Mode-switch labels and the bottom navigation remain stationary.

## Cue And Feedback Motion

- Active lyric/card changes retain color and opacity transitions.
- Auto-advance completion may use one subtle pulse, but no repeating attention loop.
- Write-mode correctness/error state changes use short color transitions; avoid bounce.
- Recording waveform remains the only intentionally continuous animation because it represents live audio.

## Reduced Motion

Under `prefers-reduced-motion: reduce`:

- No route translation, book scaling, panel translation, list stagger, or decorative pulse.
- Content changes immediately or with opacity only where necessary.
- Scrolling remains non-smooth.
- Recording state remains visible through color, text, and icon changes.

## Accessibility And Performance Constraints

- Animate only `opacity` and `transform`.
- Avoid `filter`, large blur, or box-shadow animation during route transitions.
- Do not use `will-change` on long-lived large surfaces.
- Do not delay navigation for animation completion when destination data is ready.
- No animation may block input or focus.
- Maintain existing touch targets and keyboard behavior.

## Acceptance Criteria

- Home first visible skeleton appears before catalog data resolves. Verify by delaying interests/categories/books responses long enough to assert the skeleton for at least one paint.
- Use browser `performance.mark()`/`performance.measure()` around the home-to-lesson interaction. Measure to the first visible lesson row, not to wall-clock test completion.
- Local target for home-to-lesson first visible lesson content is below 650ms.
- CI performance assertion uses a generous 900ms upper bound to avoid runner variance; the visual continuity assertion separately verifies no blank frame and correct pointer behavior.
- No app route transition has an intentional blank interval.
- Player mode changes expose the incoming panel within 200ms and do not shift the bottom navigation.
- Reduced-motion mode removes non-essential transitions while preserving all state feedback.
- Existing frontend unit tests, E2E tests, and production build continue to pass.

## Out Of Scope

- New visual styles, fonts, colors, layouts, or navigation structure.
- Physics libraries or WebGL changes.
- Audio decoding or backend latency optimization.
- Changes to admin motion.
