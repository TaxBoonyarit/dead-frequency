# Project instructions

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
