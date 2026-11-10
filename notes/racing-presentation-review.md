# Racing review and fixes

## Findings

The current Dirt, Wave and Horse views passed older tests but only extreme passing direction was asserted. A one-fact lead produced very little separation. Engine catch-up plus camera easing added visual delay; Horse also had an important CSS transition fighting each requestAnimationFrame position update. Dirt kept one beautiful car photo, but its faint tread strips were too small and entirely skipped selected store vehicles. A short Horse stage could clip the pace horse head and label because width was based only on viewport width.

## Changes

- Actual pacing remains elapsed-time based and all score, reward, mastery and win rules are unchanged.
- Honest fact lead is mapped more clearly to bounded passing depth. A brief visual-only response momentum effect makes a miss or correct answer readable immediately, then settles back to actual lead. It is not added to scores or the lead HUD.
- Dirt and Wave have one fast camera easing controller. Horse has one RAF controller for both racers, with no second CSS left-position transition.
- Original tyre texture rolls inside the full rear tyre footprints and has visible rolling cross-tread. Selected store vehicles also receive model-appropriate tyre overlays without replacing their body artwork.
- Horse sprite widths are bounded by actual track height and cropped aspect ratio, with room for head and label. Original gallop frames, coats and gear are unchanged.
- Demos start their first response delay at the actual racing start, not during the countdown. They show the pacer pulling ahead and the student catching and passing.
- All racing adapters propagate pause state into shared card animations.
- Pause/settings/visibility handlers propagate that state synchronously and update their labels without waiting for the next frame.
- Horse centers are explicitly bounded by measured stage/lane geometry and fitted sprite width, including a 12px edge margin, so labels and full silhouettes remain visible at either lead extreme.
- Dirt and Wave reserve a neutral deck during the launch countdown. Their engine explicitly defers creating or reserving the first academic question until GO. The first visible card then receives its complete three-second window, including when restarting a race.
- Demo decisions use small engine-clock steps rather than clamped render time. Slow rendering cannot cause the scripted demo to miss its three-second card window unintentionally. The real-play deadline is unchanged.

## Verification

`tests/racing-presentation.cjs` asserts perceptible one-fact separation, stronger sustained leads, full silhouette bounds and non-overlap, rolling stock and store tread, paused phases, unchanged actual score/pace, response momentum and short-stage horse fit. Existing engine, renderer, runtime, timed-session, shared-practice and demo tests remain required. Final in-browser visual review is coordinated by the main agent.

`tests/race-countdown.cjs` verifies blank placeholder content, disabled input, no pre-GO shared question reservation or shown clock, restart-from-racing safety, a fresh full three-second deadline, and zero timeout reward. Runtime tests that previously bypassed countdown by assigning mode directly now traverse GO.

`tests/race-demo-clock.cjs` runs both complete demos at 100ms, 250ms and 750ms frame intervals, with and without an initial two-second render stall. Every run must win, answer 24 correctly, show exactly four intentional wrong responses and no accidental timeouts, show repeated boosts and award no saved rewards.
