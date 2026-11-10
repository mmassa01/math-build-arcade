# Arcade student-pilot review

Scope: all ten games, shared three-second typed cards, race pacing feedback, animation contact, collisions, pause/restart and demos. Existing player saves, learning policy, coins and educator previews are preserved. No MTSS connection is added.

## First review before implementation

All ten actual demo pages were opened and visually inspected at desktop width, in addition to source and baseline regression review. The source was recovered from the published v54 repository after workspace maintenance. Baseline regression suites passed despite the visual defects, demonstrating coverage gaps.

| Game | Observed or source-confirmed issue | Bounded change |
| --- | --- | --- |
| Horse | Legacy two-column card dock, off-center cards, pace easing applied twice, pace rider clipped on short stages | Full-width card dock, one position smoother, stage-aware sprite sizing |
| Wave Rider | Weak visible lead changes and old short-landscape sidebar | Stronger bounded lead presentation, common bottom dock |
| Dirt Track | Rear tread mostly static, custom vehicle wheel effect skipped, lead differences too subtle | Distance-based rolling tread for stock/upgraded vehicles, stronger honest gap mapping |
| Skyrail | Train-body overlap during lane transfers, jump/head path intersects overhead beams, roof vents penetrate landing plane | Predictive/swept movement, coordinated vertical/lateral path, shared clearance constants and clear roof strip |
| Ping-Pong | Diagonal paddle image, bunched launch trail, powered CPU-bound ball slower, moving impact rings, stale victory timer | Horizontal contact face, clean rubber, directional fire trail, captured impact point and guarded finish timer |
| Star Defender | Narrow portrait cards from old 260px cap; projectile position independent of authoritative impact clock | Full-width dock and engine-clock projectile presentation |
| Dragon | Narrow right-aligned card area; impact loses removed target pose | Full-width centered dock and retained target pose |
| Seed | Dock clipped keypad/footer at desktop size; flying card loses source dimensions/font | Explicit dock space and frozen clone appearance |
| Castle | Same native card/dock defects as Seed | Same shared presentation contract |
| Auto Shop | Same native card/dock defects as Seed | Same shared presentation contract |

## Review loop

1. Read-only agent audits and all-ten desktop visual baseline before game edits.
2. Split implementation owners for shared cards, racing, Skyrail/action impacts and Pong. Independent reviewer owns tests and release gates.
3. Second visual Pong review rejected an embedded diagonal texture; replaced with clean procedural rubber while preserving horizontal face geometry.
4. First real DOM sweep completed 24 layout cases with no clipping failures. Four games did not update pause labels within the harness deadline. Those handlers were made synchronous. The sweep also found unequal card widths between Horse and other games on phone and short landscape; viewport-based arena widths replaced inherited parent-width calculations.
5. Run a fresh forty-case sweep after all owners are frozen. Record actual geometry rather than relying on mocked rectangles. Re-run gameplay, rewards, timeouts, collision, rendering geometry, media playback and educator regression tests.

## Acceptance and limits

Cards share a 740px desktop arena, 112px desktop height, 82px phone height and 72px short-landscape height. All three live cards must have equal width/height and top edges within one pixel, with input, keypad and footer inside the viewport. Top-card flights are 220ms; native practice-pile recycling is 380ms. Reduced motion remains supported. No next math problem is revealed before its answer window is available.

Pacer scores remain elapsed-time based. Response momentum is a temporary presentation effect only; it never changes learning records, rewards, pace scores or win rules. Raw lead remains in the HUD.

The cloud review browser uses Skyrail's compatibility renderer. Native WebGL geometry/collision tests are separate evidence, not a claim of native GPU appearance approval. Before an unsupervised rollout, check native Skyrail on the actual school computers, iPad and phone, including upgraded outfits, roof transfers and overhead scenery. This is a supervised student-pilot readiness review, not proof that every device is defect-free.

## Measured final layout results

All forty actual DOM cases passed: ten games at each size below. Every live card matched its peer piles in width, height and top alignment; all inputs, keypads and selected footers were visible inside the viewport, with no page overflow. Cross-game card dimensions also matched within one pixel. See `layout-evidence-v55.json` for per-game measurements.

| Viewport | Card size in all ten games |
| --- | --- |
| Desktop 1100 × 780 | 236 × 112px |
| Phone 390 × 760 | 108 × 82px |
| iPad 1024 × 650 | 236 × 112px |
| Short landscape 844 × 390 | 147.33 × 72px |

Second visual inspection also covered all ten games. The card geometry was accepted, Horse heads/labels fit their stages, passing gaps were legible, Dirt rear tire bands visibly changed, the Pong face no longer contained tilted paddle art, and native building videos/keypads remained on screen. Native GPU appearance and target-device frame rate remain unverified in this cloud environment.

Further bounded timing fixes: Dirt/Wave now show only a neutral deck during the countdown and do not reserve or time an academic question before GO. Subway resets its first-card clock at launch, so loading time cannot consume the answer window. Motion review identified clamped demo-bot clocks falling behind authoritative game clocks at low frame rates; demo-only stepping was added without extending student answer deadlines. Low-FPS demo tests include 100/250/750ms frame intervals and initial loading stalls, with intentional misses distinguished from unintended timeouts.

Final automated result: 34/34 selected read-only regression suites passed via `node tests/student-trial-regression.cjs`; whitespace/diff validation passed. The source includes dedicated checks for countdown fairness, first-card launch timing, slow-frame demos, retained target impacts, rolling tires, paddle contact, cleared/review cards, saved rewards and educator reporting. Geometry was unchanged by the final demo-only timing corrections.

Developer answer-typing and visual-review fixtures were moved into `tests/browser/` instead of being published as student pages. The student arcade still opens at the landing page and preserves existing player progress. Test-only scripted runs use the isolated local preview, not real student records.

Decision: suitable for a supervised student pilot after a quick native Skyrail device check. Do not label this universally device-certified or deploy live student reporting based on these checks. The educator dashboards remain fictional-data previews, not an MTSS connection.
