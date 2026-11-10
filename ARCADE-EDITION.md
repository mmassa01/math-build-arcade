# Arcade Edition

Five open pathways share a universal 599-fact bank. There is no student grade selector. Existing games, artwork, duration selectors, store, coin saves, and game trophies are retained. Fluency trophies are separate.

## Pilot criteria

A common answer-entry check lasts 90 seconds and requires at least 30 correct and 95% accuracy, including skips as incorrect attempts. Three first-of-day passing checks must occur on different days with at least seven calendar days from the first to the last. There is no 30-item cap.

Mixed uses a repeated addition/subtraction/multiplication/division cycle and balanced difficulty strata. It additionally requires at least seven correct and 90% accuracy in EACH operation. Its trophy requires the four operation trophies plus its own three retained passing checks. Mixed is open from the beginning.

Each operation also requires every fact confirmed: four independent first-response successes within five seconds, spaced by at least 1, 3, and 7 days. Same-day retries cannot advance a fact. Confirmed facts return for 14-day maintenance; a miss requires fresh success on another day and again at least three days later. Earned trophies are retained with current review needs visible. The fact bar tracks practice milestones; passing checks are shown separately.

Checks precede the first game practice in a pathway each day. A failed completed check still opens all games. Subsequent checks that day are practice only. Interruptions cannot pass. Every game keeps its original 2/3/4/5-minute choices where supported. Practice after the check continues to count.

## Storage and boundaries

The new record is mathArcadePathways.v2 in browser storage. Old practice and economy keys are never erased. Legacy practice can establish at most one starting milestone per fact. No legacy entry awards retention or check passes. There are no student accounts, district database integration, or cross-device monitoring in this edition. Criteria are pilot settings, not national norms.

See the trophy journey uses the production progression engine with an isolated in-memory learner and simulated dates. It does not change a player's saved facts, checks, coins, or trophies.

## Validation

- node tests/pathways.cjs: 23 behavior scenarios for spacing, retention, first-response rules, stale attempts, checks, complete trophies, persistence, and legacy migration.
- node tests/pathway-game-integration.cjs: 25 actual engine/pathway combinations.
- Existing game, reward, store, playback and timer suites retained. Run the repository-relative complete gate with `node tests/release-gate.cjs`.

Browser verification includes the seven-step isolated trophy journey, a real 90-second mixed check, persisted score after reload, game launch, and responsive layout inspection.

Horse startup now initializes the pace racer before rendering its label, preventing a null-element failure before the first question.
