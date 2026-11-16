# Product Experience Optimization Scope

## Goal

Fix the remaining high-impact usability, reliability, accessibility, and admin-efficiency issues identified in the 2026-11-15 audit while preserving the existing Sayline visual language and learning flow.

## In Scope

- Offline course download, cold-start access, progress persistence, and reconnection sync.
- Login trust surfaces: terms/privacy links and the current account-recovery experience.
- Profile and learning-settings save behavior, including layout overlap.
- Player media fallback, small-text readability, write-mode error guidance, and basic speaking feedback.
- Multi-book bookshelf composition on tablet and desktop.
- Personal-center information order and review-section density.
- Admin course sorting/filtering, batch-import recovery, and actionable operations alerts.

## Out of Scope

- The single-book mobile home whitespace. The product expectation is at least three books per category tab.
- AI pronunciation scoring, payments, social features, and a native client.
- A full WCAG certification or assistive-technology audit.

## Success Criteria

- A downloaded course can be reopened after an API-disconnected cold start.
- Offline learning actions are queued locally and replay after reconnection.
- No save control overlaps another actionable control at 390x844.
- Player time and status text remains readable at the current dark background.
- Multi-book tablet and desktop layouts use screen space intentionally without changing the mobile presentation.
- Batch-import failures can be filtered and retried without restarting completed work.
- Existing frontend, backend, build, and E2E suites continue to pass.

## Evidence

- Screenshots: `frontend/audit/current-2026-11-15-rerun/`
- Current audit date: 2026-11-15.
