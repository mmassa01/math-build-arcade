# Arcade review gates

This is a release checklist, not a claim of native GPU or device visual approval. The baseline v54 source tests pass despite the reported visual problems, so renderer and real-layout checks are required in addition to engine tests.

## Review matrix

| Adventure | Review focus | Required evidence before student trial |
| --- | --- | --- |
| Horse Race | Card console width/alignment, opponent separation, visible gain/loss, legs and reins | Actual card rectangles at desktop/phone/iPad; fast-right and wrong-answer sequences; pause during slide and restart |
| Wave Rider | Shared card placement, opponent gap and passing, water/bridge speed | Same layout checks; continuous passing rather than teleport; pause freezes water and racer state |
| Skyrail Subway Run | Train-front collision, roof support, lane-change clearance, overhead beams | Swept collision/clearance tests plus native GPU visual check on target devices; compatibility rendering alone is insufficient |
| Dirt Track | Wheel motion, road/fence movement, race gap, car overlap | Wheel phase differs over multiple frames and stops while paused; visible correct/wrong separation; tires remain within track |
| Star Defender | Card animation, bullets reaching live targets, impact reward timing | Full demo ends, visible impacts match targets; no rewards before impact or on timeout; paused clone and projectile remain stable |
| Dragon Quest | Card console, rival/shot impact, banking, coastline | Full demo with early inferno, one visible hit per target, no missed-fire coins; preserved detailed scenery and bank motion |
| Ping-Pong Rally | Paddle face contact, ball height, fireball, three-correct streak | Paddle contact point and ball endpoint agree in projection; power shot visible early in demo; stale victory timer cannot interrupt restart |
| Seed | Equal native piles, top-card FLIP, retry pile, native video | First correct triggers growth; card is readable for full 3 seconds; pause/restart during flight and video; native paused frame remains HD |
| Castle | Same native cards, missed-deck recycle, media pending/retry, final tour | Growth starts after metadata resolves; failed media has retry state; full demo and final tour finish; no low-resolution substitution while paused |
| Car Shop | Same native cards, milestone continuity, embedded watch mode | First correct builds; no separate-screen video; Watch freezes cards; return/resume retains earned state; restart cancels stale callbacks |

## Common gates

1. At 1100×780, 1024×650 and 390×760, all three live cards have equal width/height within 2 CSS pixels and aligned tops within 2 CSS pixels. Center problem, side counts, input and keypad remain visible. Phone may stack content, but no horizontal clipping or nested body scrollbars are acceptable.
2. Only the outgoing top card moves. It starts at the center card bounds, lands at the correct pile bounds, then disappears without a flash, hop, duplicate face or count replacement jump. Retry recycling has one smooth direction and never moves the cleared pile.
3. Each readable, active card receives 3000 ms. Transition, pause, hidden tab, computer-turn and loading intervals cannot consume an unseen card's window. Correct/wrong complete typed input resolves once; partial multi-digit input waits until completion or timeout.
4. Pause freezes motion and timers. Restart cancels flights, delayed end modals, demo answers and pending media continuations from the old session. No old result can mutate a fresh session.
5. Demos run to a visible conclusion, show each signature power effect early enough, and save no coins or academic progress. Gameplay uses the existing shared learning record without resetting it when changing adventures.
6. Race gains are proportional to demonstrated performance against the chosen pacer. Fast sustained correct answers visibly move ahead; a wrong answer/timeout visibly allows the pacer to gain. Do not add arbitrary rewards that contradict displayed pace.
7. Missing art/video cannot lock the controls at loading forever. Native video starts when ready and has a retry/fallback state. Graphics must remain finite and in bounds after resizing or orientation changes.
8. Native GPU visual review on actual iPad/phone remains a separate gate when the available browser falls back to a compatibility renderer. Do not certify collisions, wheel appearance or lighting from source geometry alone.

## Automated gate

Run `node tests/release-gate.cjs` after every integrated change. It executes the registered regression suites from repository-relative paths and performs production syntax and route checks. Tests with mocked canvas draw calls cannot establish visual quality, frame rate, or real asset loading, so the visual matrix above remains required for affected games.

## Coverage to add in this pass

- Shared WAAPI pause/resume, clone cancellation and layout equality from actual DOM measurements.
- Pacer correct-versus-wrong visible-distance changes at each viewport and both lead signs.
- Dirt wheel phase and pause-freeze assertions, not just finite geometry and draw count.
- Pong paddle-face center/ball-endpoint projection and guarded delayed finish modal.
- Skyrail train overlap/roof support across lane changes and large frame gaps, plus overhead structure above the runner's reachable height.
