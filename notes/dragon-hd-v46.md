# Dragon environment and upgrades, version 46

Action, timing, wingbeat cadence, chase camera follow, fire hit/miss rules, practice and rewards are unchanged. No new AI images were generated in this pass.

- Native rendering up to device pixel ratio 3, including the compatible view.
- 96 by 154 terrain subdivisions per shoreline tile, periodic ridged mountain geometry, granite texture generated in code, slope-aware rock and snow shading.
- Layered spruce silhouettes replace single cones.
- Planar water reflections render the real scene with a mirrored camera, with four scales of animated wave normals, Fresnel reflectance and tighter sunlight highlights. Reflection buffers are capped for mobile memory. Half-float is used only when supported.
- Existing background artwork is reused, with reduced distant fog, anisotropic texture filtering and sharper compatible-view sampling. This is not a claim that the source bitmap has gained new native detail.
- Frostwing, Stormfire, Obsidian Ember and Sunforge Sovereign have distinct crown horns, wing sizes and vein details. Obsidian gains molten seams and armor. Legendary gold has six crown horns, emerald eyes, neck armor, gilded wing ribs, a broader silhouette, more reflective gold materials and a restrained gold trail. Compatible view retains the existing purchased art and adds the distinct trails and legendary size change.

The cloud browser still has WebGL disabled. Automated tests validate the new geometry, shader composition, reflection plumbing, upgrade differences and unchanged game logic. Browser QA validates the compatible view only. Full GPU visual/performance verification remains a device check.
