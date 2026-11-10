# Contributing

## Development flow

1. Create a branch from `main`.
2. Make the smallest coherent change that solves the issue.
3. Run `node tests/release-gate.cjs`.
4. Review the affected games at desktop, tablet, phone, and short-landscape sizes.
5. Open a pull request describing the student impact, teacher impact, tests, and visual evidence.

## Product invariants

- A practice card has three seconds unless a documented mode explicitly differs.
- Demo mode must never award coins, trophies, or learning progress.
- Rewards must remain idempotent.
- Pausing or hiding the page must freeze answer timing and presentation motion.
- Embedded games must validate both the message origin and parent window.
- Student saves must recover safely from missing, blocked, malformed, or older browser storage.
- All controls must remain usable with keyboard input and touch.
- Keep all ten games visually usable at desktop, tablet, phone, and short landscape.
- The educator dashboard must label fictional data and must not imply a live district connection.

## Source conventions

- The production website is the contents of `dist/`.
- Keep asset URLs relative so GitHub Pages can host the project below a repository path.
- Do not commit credentials, private student information, browser profiles, local settings, or generated archives.
- Add or update focused tests for every behavior change.
- Do not weaken `tests/release-gate.cjs` to make a change pass.

## Pull request checklist

- [ ] Complete release gate passes
- [ ] No missing local assets or browser console errors
- [ ] Correct, incorrect, timeout, pause, resume, restart, and demo flows checked where relevant
- [ ] Student and teacher perspectives considered
- [ ] Mobile and short-landscape layout checked
- [ ] No student data or credentials added
