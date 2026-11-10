# Claude Code Instructions

This repository contains a buildless static website. Production files live directly in `dist/`.

`AGENTS.md` is the shared repository contract and applies to every task. If this file and `AGENTS.md` appear to conflict, follow the safer requirement and call out the conflict in the pull request.

## Before editing

Read `AGENTS.md`, `README.md`, `CONTRIBUTING.md`, and the relevant game files and tests. Preserve existing game rules, rewards, artwork, progress storage, and educator-reporting boundaries unless the requested change explicitly alters them.

## Required verification

Run:

```powershell
node tests/release-gate.cjs
```

For visual changes, also inspect the affected game at desktop, tablet, phone, and short-landscape sizes. Test as a student playing and as a teacher observing feedback and progress.

## Important contracts

- Keep paths relative for GitHub Pages project hosting.
- Never award coins, trophies, or progress in demo mode.
- Keep rewards idempotent and reject untrusted iframe messages.
- Preserve the three-second answer contract.
- Pause timing when the game is paused or the page is hidden.
- Keep browser storage recovery defensive.
- Do not add real student data.
- Keep the educator dashboard explicitly fictional until a separately authorized live integration exists.
- Do not bypass or delete release tests.

## Working style

Use a focused branch and small commits. Add tests with behavior changes. Explain student impact, teacher impact, and verification in the pull request. Do not rewrite unrelated files or remove existing artwork to simplify a change.
