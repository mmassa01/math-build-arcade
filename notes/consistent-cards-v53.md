# Consistent flashcard controls

The user's supplied seed-game screenshot is the visual reference: three equal landscape card spaces, Cleared on the left, current problem in the middle, Practice on the right, a restrained paper-like surface, a large vertical problem and automatic typed entry with a keypad beneath. Every active adventure uses that interaction style, with game-aware colors. Building-game video playback and action-game graphics remain independent of card styling.

Card response time is fixed at three seconds. There are no response-time sliders or alternate thinking-time choices. The existing round-duration selections and the separate common 90-second assessment are not silently replaced by this change. Complete typed answers resolve immediately, including incorrect answers; incomplete entries expire as misses. A miss cannot earn a coin or mastery milestone. No early question preview grants extra time.

Shared action-game controls support per-presentation result animation, remaining-time display and session reset. Existing building games retain their native left/middle/right piles rather than receiving duplicate piles. Animation copies only the top card, measures the source and destination rectangles, uses a stable top-left transform origin, and scales the visual to the pile dimensions. Restart/cancellation must remove clones and stale callbacks; reduced-motion users get a shortened transition.

Saved facts, coins, equipment and trophies are preserved. Site startup remains landing-first, including older saved game-hash links.

Verification: all ten real game pages passed browser typing checks at phone width. Building-game controls were inspected at 390px and 1100px widths. Automated tests cover fixed deadlines, late answers, partial typing, FLIP geometry, paused motion, restart cancellation, review queues, video milestones, rewards, saved pathways, timed sessions and landing-first startup. Native GPU rendering was not revalidated in the cloud browser, which has WebGL disabled; game artwork and renderers are unchanged by this update.
