# Natural shores and banking, version 47

Addresses the user's phone screenshot showing folded grey side walls, sparse cone-like trees and a stiff-looking turn.

- Replaces the high-frequency ridged foreground height function with smooth periodic noise and lower, irregular forested shores. The lake is wider so the photographic distant mountains remain the main landscape.
- Reuses the existing fjord photograph as a surface projection for rock and forest coloration on the nearby shores. No new AI image was generated. MeshBasicMaterial avoids double-lighting a photograph that already has baked lighting.
- Replaces solid foliage cones with dense, crossed-plane pines using a native Canvas texture of individual branch sprays and needles. The forest contains over 3,000 grounded, varied trees rather than evenly spaced giant cones. Rocks break up the waterline.
- Adds shared flight motion with damped lateral glide, velocity-based roll up to about 25 degrees, subtle yaw and heave, gentle idle turns and a following camera. Both rendering paths bank smoothly; pause and reduced motion are respected.
- Does not change encounter timing, cards, coins, mastery, enemy hits, inferno charge, or the existing upgraded dragon identities.

Checks cover shoreline continuity and smoothness, forest grounding/density, photo shader integration, both turn directions without roll snaps, 30/60 fps consistency, pause/reduced motion, model geometry and game regressions. Cloud browser WebGL remains disabled, so browser QA is for the compatibility renderer. The full 3D shore appearance requires the user's device for final visual confirmation.
