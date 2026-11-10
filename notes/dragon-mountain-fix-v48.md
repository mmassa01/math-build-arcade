# Mountain-side replacement, version 48

The earlier near-shore fixes still placed photographic colors over synthetic hill geometry. This version removes that foreground hill mesh, separate tree geometry and scattered boulder geometry from the active game entirely. It does not increase their resolution or repaint them again.

Two layered photographic shores reuse the existing approved fjord artwork. Native Canvas compositing removes the sky and photo water with feathered masks; the resulting transparent textures are mounted on camera-facing depth layers. Rock formations and trees are now part of the same detailed photographic visual language as the distant mountains. The lake contact is aligned at world Y = -3.4, preserving the native animated water and reflected scenery. Layer depth changes gradually without respawning or visible loops. This is an intentional 2.5D photographic approach, not a claim of new scanned 3D rocks or trees.

Dragon motion, banking, skin upgrades, camera, water shader, encounter rules, timing, facts, rewards and demo behavior are unchanged.

`shore-review.html` is a development review of the exact runtime shore textures projected through the game camera. It provides phone and wide views, including a hide/show comparison, without requiring WebGL. It verifies the actual replacement mountain-side art rather than showing the unrelated compatibility background. It does not simulate the unchanged water shader or final lighting/fog.

The cloud browser still lacks WebGL, so full GPU integration remains a device check. Regression tests cover the unchanged game logic and motion. New tests verify no legacy hill/tree meshes in the active renderer, sky/water masking, a clear central channel, stable layer motion and exact waterline placement. No new generative image or paid plugin was used.
