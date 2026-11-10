# Math Build Arcade

Math Build Arcade is a browser-based math fluency arcade with ten student games, shared progress, five fluency pathways, an in-browser economy, and a fictional educator reporting preview.

The production website is deployed from the `dist/` directory through GitHub Pages. No build step or server runtime is required.

Live site: <https://mmassa01.github.io/math-build-arcade/>

## Play locally

From the repository root, serve `dist/` through any static HTTP server. For example:

```powershell
python -m http.server 8000 --directory dist
```

Then open `http://localhost:8000/`.

Do not open the HTML files directly from the filesystem. Several browser features require an HTTP origin.

## Validate changes

Run the complete release gate:

```powershell
node tests/release-gate.cjs
```

The gate checks all top-level regression suites, production JavaScript syntax, inline scripts, registered game routes, local assets, iframe message trust, storage recovery, duplicate rewards, demo isolation, and navigation safety.

## Repository layout

- `dist/`: production website and all media assets
- `tests/`: deterministic regression and release tests
- `notes/`: design and engineering review notes
- `.github/workflows/pages.yml`: validation and GitHub Pages deployment
- `.github/workflows/ci.yml`: pull-request validation
- `AGENTS.md`: shared working contract for coding agents
- `CLAUDE.md`: working instructions for Claude Code
- `CONTRIBUTING.md`: contributor workflow and quality expectations
- `ARCADE-EDITION.md`: fluency model and pilot criteria
- `THIRD_PARTY_NOTICES.md`: bundled dependency and asset notices

## Deployment

Every push to `main` runs the complete release gate. When it passes, GitHub Actions publishes `dist/` to GitHub Pages.

The site stores student progress only in the current browser. It does not contain student accounts or a live district reporting connection. The educator dashboard uses clearly labeled fictional data.

## Source and collaboration

The repository is intended for active development with GitHub, Claude Code, Codex, and human contributors. Make focused branches, keep commits scoped, and open a pull request for review before merging larger changes.

Claude Code should start with `CLAUDE.md`, which points to the same contracts used by other agents in `AGENTS.md`. Pull requests run the release gate before review, and accepted changes on `main` are deployed automatically.

No open-source license has been granted. All rights are reserved unless the repository owner adds a license later.
