# Dirt Track Championship, version 41

Replaces only the dirt-track presentation and demo cadence. Shared math, coins, equipped store vehicles, pace settings and 2/3/4/5-minute rounds remain compatible. Wave Riders retains its own graphics hook.

## Built-in image generation assets

- `dist/dirt/art/sprint-poses-v41.webp`: transparent 2x2 photorealistic rear-view blue/cyan 410 winged sprint-car atlas, straight/left/right/drift angles. The first front-facing result was rejected. Edit prompt preserved the model and rotated it 180 degrees into the correct rear-chase viewpoint, with rear axle, fuel tank and back of the driver visible.
- `dist/dirt/art/raceway-v41.webp`: wide realistic clay oval, grandstands, white/red barrier, safety fence, late-afternoon blue sky and warm sunshine, no cars or text.
- `dist/dirt/art/cover-v41.webp`: dynamic blue/cyan winged sprint car drifting on red clay, separate golden rival, dust, filled grandstands, no text or logos.

The built-in image-generation tool created all three assets. Optimized WebP derivatives are committed alongside the renderer. No paid external generation service is required.

## Verification

- Dirt presentation: finite geometry at phone/tablet/desktop sizes, non-overlapping cars, passing direction, sprite-cell bounds, unchanged race state, pause, reduced motion and equipped gear.
- Actual demo runtime: both racers lead, multiple nitro boosts, full completion, no persistent rewards.
- Existing shared-practice, timer, Wave Riders, horse and ping-pong regressions.
