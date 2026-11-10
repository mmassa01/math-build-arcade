# Track projection and motion correction

Official reference reviewed: World of Outlaws Dirt Racing 24, Sprint Car User Manual, driving tips (page 3). https://worldofoutlawsgame.com/wp-content/uploads/sites/3/2024/09/WoO24-Manual-Sprint-Car-305-360-410.pdf

The prior cars used fixed screen lanes while the barrier used a different road projection. The photograph also supplied a second, static road, and the texture's scroll sign opposed the moving trackside geometry.

Changes: shared projected boundaries and car positions; an outside barrier beyond both racing lines; no static photographed road; no floating curb discs; shared forward world travel for texture, fence posts and ground features; continuous yaw instead of pose changes on nitro; smoother visual speed tied to pace advantage and boost. Math, coin awards, equipment and timed-round logic stay unchanged.

Built-in generated asset: `dist/dirt/art/clay-v42.webp`. Prompt: overhead seamless fine-grain compact reddish racing-clay albedo, uniform lighting, tiny granules and subtle scuffs, no perspective, strong grooves, track edges, sky, vehicles or shadows. Original sprites and artwork retained.

Regression: phone/tablet/desktop bounds on straights and bends, both passing directions, car tire clearance from both track edges, forward clay motion, pause, unchanged race engine and shared practice, timers and isolated demos.
