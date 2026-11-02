# Player Modes Design QA

## Visual Truth

- Listen: `D:/code/English_study/designs/sayline-design-system/ui_kits/learner/player-controls-mobile.png`
- Read: `D:/code/English_study/designs/sayline-design-system/ui_kits/learner/player-read-mobile.png`
- Write: `D:/code/English_study/designs/sayline-design-system/ui_kits/learner/player-write-mobile.png`
- Speak: `D:/code/English_study/designs/sayline-design-system/ui_kits/learner/player-speak-mobile.png`

## Implementation Evidence

- Listen: `D:/code/English_study/frontend/audit/current/design-system-listen.png`
- Read: `D:/code/English_study/frontend/audit/current/design-system-read.png`
- Write: `D:/code/English_study/frontend/audit/current/design-system-write.png`
- Speak: `D:/code/English_study/frontend/audit/current/design-system-speak.png`
- Side-by-side comparisons:
  - `D:/code/English_study/frontend/audit/current/design-system-listen-comparison.png`
  - `D:/code/English_study/frontend/audit/current/design-system-read-comparison.png`
  - `D:/code/English_study/frontend/audit/current/design-system-write-comparison.png`
  - `D:/code/English_study/frontend/audit/current/design-system-speak-comparison.png`
- Read-to-player transition: `D:/code/English_study/frontend/audit/current/read-transition-fixed.png`
- Desktop: `D:/code/English_study/frontend/audit/current/design-system-listen-desktop.png`
- Tablet: `D:/code/English_study/frontend/audit/current/design-system-listen-tablet.png`

All screenshots use a 390 x 844 CSS viewport at 1x density. Source and implementation images are 390 x 844 and were compared side by side without image generation or replacement.

## Findings

No actionable P0, P1, or P2 differences remain.

- Typography: display headings use the existing Instrument Serif face; English transcript, controls, labels, and Chinese translations use the established Manrope scale. Read and write headings now match the source hierarchy.
- Spacing and layout: header, course identity, four-part progress strip, content gutters, mode-specific content, completion action, and bottom icon tabs follow the reference rhythm.
- Listen: controls now use a full-width scrub bar, centered speed value, circular five-button transport, square-free circular play button, and icon-only mode navigation.
- Read: the transcript is now a dark translucent card list with numbered rows, bilingual copy, active-row treatment, and play affordance.
- Read transition: the transcript list fades out gradually beneath the player controls. The partially covered final card no longer exposes a separate border or creates a visible horizontal divider.
- Completion transition: when a mode reaches 100%, its completion button becomes a neutral three-second prompt and automatically switches to the next unconfirmed mode in the order Listen, Read, Write, Speak. After the final mode, the existing next-course countdown starts.
- Write: context rows and the active dictation card now share one continuous transcript; the active card contains playback, translation, auto-submit hint, word blanks, and skip action.
- Speak: the quote, waveform, white recording button, comparison cards, navigation buttons, and recording state match the source order and visual weight.
- Colors: warm dark green/brown cover-derived atmosphere, translucent surfaces, oat active state, and muted secondary copy match the design system.
- Responsiveness: 834 px tablet and 1440 px desktop checks show no horizontal overflow; player content remains centered within the existing 820/900 px maximum widths.
- Copy/content differences are data-driven: the live course currently has five cues and a 20-second demo duration, while the design data has more cues and a longer duration.

## Comparison History

- P1: the previous read view used opaque light cards without the transcript heading or play affordance. Fixed by restoring the design-system transcript row structure.
- P1: the previous write view placed the exercise card before the transcript context. Fixed by rendering context before and after the active dictation card in one scroll flow.
- P1: the previous speak view used a dark outlined record button and split recording hints. Fixed with the white circular record control and a single state hint.
- P2: the previous listen/read controls used a square play button and a right-side speed selector. Fixed with the circular transport and centered speed control from the design system.
- P2: the final transcript card previously remained visible through the transparent top of the player overlay, producing a bright card edge that looked like a divider. Fixed with a bottom mask on the transcript list.
- P2: reaching the end of a course list previously displayed a persistent notice and close action over the player. This now returns silently, so no notice bar crosses the player transition.

## Verification

- Primary interactions tested: four mode switches, sentence selection, Chinese visibility, auto-hide/restore, speed selection, playback-rate update, three-second automatic mode advance, silent list-end behavior, completed-mode layout, and responsive page overflow.
- Build validation: TypeScript and Vite production build passed.
- Automated checks: 8 unit tests and 12 Playwright tests passed.

final result: passed
