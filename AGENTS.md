# Project instructions

## Project layout

- This is a single-player Canvas/Web Audio game using native JavaScript ES modules. Node.js 20+ is required for local tools; there are no npm dependencies or build step.
- `dist/` is the tracked application source and deployable static site. Edit it directly; do not treat it as generated build output.
- `dist/engine.mjs` owns simulation, combat, balance and collision; `dist/game.mjs` connects rendering, the DOM and the game loop.
- `dist/view.mjs` contains view helpers, `dist/input.mjs` handles controls, `dist/scenes.mjs` defines environments, and `dist/zombie-art.mjs` draws enemies.
- `dist/audio.mjs` handles playback; runtime recordings and attribution live in `dist/audio/`. Keep `dist/audio/CREDITS.md` accurate when changing recordings. `audio-source/` holds source clips and is not deployed.
- `dist/index.html` and `dist/style.css` define the interface. Preserve Thai labels, keyboard access and touch controls.
- `tests/*.test.mjs` uses the built-in Node.js test runner. `scripts/` contains version synchronization and legacy audio preparation tools.
- `.github/workflows/pages.yml` checks and deploys only `dist/` when `main` is pushed. `.openai/hosting.json` contains the Sites hosting configuration.

## Development and verification

- Run `npm run dev` and open `http://127.0.0.1:4173` for local play. The server serves `dist/` directly and synchronizes the version label before starting.
- Keep changes scoped to the requested behavior and follow the existing module boundaries. Update README instructions when controls, setup or release steps change.
- Run `npm run check` and `npm test` before committing. Add or update focused tests for gameplay or input changes.
- For visual or control changes, also check the affected flow in a browser on desktop and phone-sized portrait/landscape layouts. Report any checks that could not be performed.
- Do not add dependencies or a build pipeline unless the task requires them. Do not commit temporary recordings or unrelated generated files.

## Version and changelog

- Every completed code change must include a version update in `package.json` and the matching game version label in `dist/index.html`. Use `npm run version:patch` to bump the patch version and synchronize the label.
- Document the change in both `CHANGELOG.md` (the repository changelog) and `dist/changelog.mjs` (the in-game release notes).
- Keep the latest version, release date, and described changes consistent across both changelogs and `package.json`. Put the newest release first and use the date in Asia/Bangkok.
- Before committing, run `npm run check` and `npm test`, and verify that both changelogs include the new version and all changes in that release.
- Documentation-only changes do not require a version bump unless explicitly requested.

## Git commit and push

- After completing a requested change and verifying it appropriately, commit and push the work to the current branch's remote without asking for confirmation again.
- Commit only files relevant to the requested work. Do not include unrelated user changes.
- If the current branch has no upstream, set it when pushing.
- Do not force-push, delete branches, or rewrite Git history unless explicitly requested.
- If verification or pushing fails, report the failure and its cause. Do not claim success.

## Commit messages and descriptions

- Write concise commit messages and pull request descriptions that explain the change and its reason.
- Do not state or imply that AI created or co-authored the work.
- Do not add AI co-author trailers, signatures, credits, or attribution to commits or pull requests.
- Use the configured Git author name and email. Do not change them.
