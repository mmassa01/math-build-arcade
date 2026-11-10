# Agent Working Contract

This repository contains a student-facing math arcade and a fictional educator preview. Treat gameplay, accessibility, privacy, and deployment behavior as production contracts.

## Start here

1. Read `README.md`, `CONTRIBUTING.md`, and the files and tests for the game being changed.
2. Work on a focused branch. Do not rewrite unrelated files or remove assets to simplify a task.
3. Run `node tests/release-gate.cjs` before opening or updating a pull request.
4. Describe student impact, teacher impact, visual evidence, and test results in the pull request.

## Preserve these contracts

- Production files live in `dist/` and all runtime URLs must remain relative so the site works from a GitHub Pages project path.
- A readable active answer card receives three seconds. Loading, transitions, pauses, hidden tabs, and computer turns cannot consume that window.
- Demo mode never saves coins, trophies, academic progress, or educator evidence.
- Rewards and completion messages are idempotent. Iframe messages must pass origin and source checks.
- Pause freezes gameplay motion and timing. Restart cancels callbacks and media continuations from the prior session.
- Browser storage must recover safely from missing, malformed, or unavailable data.
- Keyboard, touch, reduced-motion behavior, focus visibility, and responsive layouts are product requirements.
- Educator data remains clearly fictional. Never add real student records, credentials, secrets, or private district exports.
- Do not change scoring, difficulty, pacing, rewards, or progression as a side effect of a visual fix.

## Visual review

For visual or interaction work, review the affected game as both a student playing and a teacher observing. Check at minimum:

- Desktop at 1100 by 780
- Tablet at 1024 by 650
- Phone at 390 by 760
- A short landscape viewport

Verify card alignment and motion, correct and incorrect feedback, pacing separation, pause and restart behavior, completion, demo isolation, and navigation back to the arcade. Record any limit caused by unavailable hardware or browser rendering.

## Source and release discipline

- Add or update deterministic tests for behavior changes.
- Keep generated art notes and third-party notices with the assets they describe.
- Do not commit environment files, local agent settings, browser profiles, test output, or secrets.
- Do not bypass, weaken, or delete release tests to make a change pass.
- Changes merged to `main` deploy automatically after the release gate passes.
