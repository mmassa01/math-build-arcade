# Wave Riders Bluewater Cup artwork

The new artwork was created with built-in image generation and optimized to WebP. Rendering is an art-only layer on the existing race engine. Shared facts, four answer choices, the pace opponent, coins, timed rounds, saved gear and isolated demos retain their existing logic.

## Rider poses

`rider-poses-v38.webp`: four complete rear-view rider and watercraft poses in a 2×2 atlas. The blue starter craft banks left and right and rides over wave crests. A gold variant identifies the pace rider. Purchased craft, including the exact original Neptune X, are still rendered through their original store artwork rather than substituted with this atlas.

Prompt: A transparent 2×2 sprite atlas of the same athletic rider and sleek elongated blue-and-white sit-down racing jet ski, viewed from behind and slightly above. Neutral forward crouch, gentle left bank, gentle right bank, and a small nose rise over a wave. Realistic premium sports game rendering, glossy fiberglass, dark traction pads, black seat, small stern jet nozzle, blue life jacket and watersports helmet. Fixed scale and camera, transparent margins. No water, spray, wake, shadow, text or dividing lines.

## Ocean surface

`ocean-surface-v38.webp`: high-detail turquoise ocean texture, used as a subtle moving flow layer over the existing HD coastline and water. Reflected edge tiles avoid hard repetitions; wave refraction and dynamic highlights provide motion while preserving the sharp base imagery.

Prompt: A square seamless overhead photograph-quality tropical seawater surface with deep turquoise and cobalt channels, intricate small wind-driven waves, sparse delicate white crests, tiny sunlight glints and translucent caustics. Even natural lighting, no large sun glare, no horizon, land, craft, people, text, or interface. Match all four tile edges.

## Foam wake

`foam-wake-v38.webp`: transparent, detailed turbulent whitewater. It follows each craft's stern, expands under boost and combines with animated spray. A small contact patch overlaps the stern to seat the hull in the water.

Prompt: A single realistic jet-ski wake, viewed from an elevated chase camera behind an unseen craft. Narrow turbulent whitewater begins at top center and opens into a broad V toward the lower corners. Fine lacy foam, aerated bubbles, feathered spray, subtle translucent turquoise, broken fading edges. Genuinely transparent background; no boat, person, opaque ocean rectangle, horizon, shadow, words or border.

## Real-time 3D scene

Wave Riders now draws its race as a live 3D scene. It is still an art-only layer: `../scene3d.mjs` wraps `WaveCinema.draw`, the one hook the shared race loop (`../../dirt/game.js`) already calls, and reads the same state object the 2D painter receives. Cards, the three-second timer, coins, the pace rider, demo isolation and saved gear are untouched. Dirt Track does not load it.

- `../scene3d.mjs`: renderer, water and sky shaders, chase camera, spray, buoy gates, start/lap/finish gate, rider tags and the bridge to the game. Uses the three.js already vendored in `../../store/vendor/`; nothing is loaded from another origin.
- `../models.mjs`: procedural craft and seated or standing riders, one hull per store craft (starter, Wave Jumper, Ocean Cruiser, Reef Racer). Neptune X reuses the exact store sculpt from `../../store/models.mjs`, merged into a few draw calls. The pace rider is always gold.
- Reused art: `ocean-surface-v38.webp` is the water detail texture (mirrored repeat) and `foam-wake-v38.webp` is each craft's wake. If either fails to load, small generated textures stand in.
- Sky, sun, clouds, far shore, islands, buoys, contact shadows and hull foam are generated in code; there are no shadow maps and no post-processing passes.

Fallback: the original 2D picture above (rider atlas, painted bay) is kept and takes over automatically when WebGL 2 is unavailable, the module fails to load, the graphics context is lost, the 3D frame throws, or the measured frame rate stays very low. The frame-rate guard first lowers the render resolution (1.5x, 1x, 0.75x of CSS pixels) and only then switches to 2D. Rendering stops while the race is paused. `prefers-reduced-motion` removes camera sway, the field-of-view kick, spray and speed streaks.

For review, add `?scene=2d` or `?scene=3d` to the page address, or call `WaveRiders3D.setMode('2d' | '3d' | 'auto')`; `WaveRiders3D.stats()` reports the active renderer, draw calls and triangles. Tests: `tests/wave-3d.mjs` and `tests/wave-3d-bridge.cjs`.
