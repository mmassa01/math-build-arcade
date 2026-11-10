# Dragon Sky Quest: The Great Sky Chase

References reviewed: Century: Age of Ashes developer interview (Unreal Engine), and the official Nintendo Panzer Dragoon: Remake description. Design ideas: animated dragon flight, open scenery with depth, readable lock-on targeting and traveling flame attacks. No third-party game artwork is used.

The original blue-and-orange player dragon, original sky world, and all equipped store dragons remain the actual source artwork. Wing sections hinge separately while the torso stays stable. New rear-view rivals preserve the purple and orange enemy designs. Perspective scenery flies past, with camera banking, cloud parallax, golden sky gates and an end-of-demo fly-away.

Math/coin/timer engine is unchanged. Correct answers launch homing flame strikes, coins still arrive only on engine-confirmed impacts, four correct charge inferno, and timed rounds retain 2/3/4/5-minute choices. Demo pacing is slower than the previous rapid-fire version so chase and impacts can be seen, with an early inferno and no persisted rewards.

## Built-in image generation

- `dist/dragon/art/islands-v43.webp`: 2x2 transparent floating-island cutouts derived from the original sky artwork, green trees, marble arches, waterfalls, rocky undersides, same warm realistic style.
- `dist/dragon/art/rivals-v43.webp`: 2x2 rear views of the original purple and orange rivals, extended/raised wings, same detailed scales and horns, transparent background.
- `dist/dragon/art/cover-v43.webp`: original blue-and-orange dragon chasing purple/orange rivals through the original island style, rear camera, a golden firebolt, no text/UI.

An additional island-background-cleanup variant was evaluated and not selected. All selected assets use the built-in image-generation tool, with original images as references. Optimized WebP derivatives are committed with the Site.

## Verification

Finite flight and projectile geometry, target framing on phone/tablet/desktop, original skin source rendering, paused effects, reduced motion, unchanged game state, 12 impact-confirmed demo tags, early inferno, no saved demo coins. Existing shared-practice and timed-round suites pass.
