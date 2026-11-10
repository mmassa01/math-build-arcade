# Dragon Fjord Flight, version 45

Rebuilt from the user's uploaded 21.87-second reference showing rear-view dragon flight over an alpine lake. This replaces floating islands for Dragon only. Subway and the other arcade games are unchanged.

## Rendering

- `flight3d.mjs` uses the existing local Three.js runtime, articulated dragon model, moving shoreline meshes, instanced spruce trees, image-generated terrain texture, mist and a lake shader.
- `flight-model.mjs` supplies five palette-matched dragon rigs, independent wing joints and membrane flex, scale bump detail, articulated tails, horns, legs and claws. Rigid meshes are batched.
- `cinema.js` is the compatible Canvas view, using generated lake and dragon imagery, water movement and wing hinges. It also runs if WebGL is lost or unavailable.
- Original purchased skin images still drive the compatibility view. The 3D rig maps the five existing skin identities to corresponding material palettes. It is not an exact 3D reconstruction of their store artwork.
- Generated files are versioned in `dist/dragon/art`: `fjord-v45.webp`, `terrain-v45.webp`, `dragon-flight-v45.webp`, `cover-v45.webp`.

## Encounters

`encounters.js` replaces the historical engine in the active HTML entry. Each problem has a fixed three-second answer window. A rival enters from the side for each new question. Wrong answers and timeouts fire a visible miss and award no coins. Correct shots award coins only when their projectile arrives. Four consecutive correct answers launch an inferno against three targets. The demo shows correct hits, inferno, a wrong answer and a timeout, completes twelve hits, and saves no rewards. Existing timed sessions and shared practice recording are retained.

## Verification

Passed: exact deadline and late-answer rejection, no coins on misses, impact-only rewards, practice recording once, fresh side entries, inferno, full demo, shared rewards, all six timed-game durations, 25 pathway/game combinations, finite 3D geometry, bounded model draw calls, wings and tail poses, lake/shore heights and compatible Canvas presentation.

The cloud preview browser explicitly reports WebGL disabled. Browser screenshots verify the compatibility renderer, not the full GPU shader output. The full 3D view needs visual/performance verification on the user's iPhone, iPad or GPU-enabled desktop.

## Image-generation briefs

Built-in image generation was used for an unobstructed photoreal alpine fjord plate, seamless overhead moss/grass/granite texture, rear-view blue-and-bronze dragon flight atlas, and a matching lake-flight cover. No paid external service was used. Full prompts are retained in this conversation.
