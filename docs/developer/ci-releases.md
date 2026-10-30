---
description: The CI, documentation and release workflows of Family Insight and how to publish a new version.
---

# CI and releases

## Workflows

| Workflow                                      | Runs on                                                          | What it does                                                                                                                      |
| --------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **CI** (`.github/workflows/ci.yml`)           | every push to `main` and every pull request                      | **check** job: typecheck, lint, format check, unit tests, app build and docs build. **e2e** job: the Playwright suite under xvfb. |
| **Docs** (`.github/workflows/docs.yml`)       | pushes to `main` that touch `docs/` or the package files; manual | Builds the website and deploys it to GitHub Pages.                                                                                |
| **Release** (`.github/workflows/release.yml`) | tags `v*`; manual (`workflow_dispatch`)                          | Builds installers on Ubuntu, Windows and macOS; for a tag, creates the GitHub release with all files.                             |

Use the manual run of **Release** to check that the Windows and macOS builds still work without
publishing anything:

```sh
gh workflow run release.yml
gh run watch
```

## Publishing a release

1. Make sure `main` is green and the [changelog](https://github.com/K-u-r-c/family-insight/blob/main/CHANGELOG.md)
   has the changes under **Unreleased**.
2. Bump the version (this changes `package.json` and `package-lock.json`):

   ```sh
   npm version 1.0.1 --no-git-tag-version
   ```

3. In `CHANGELOG.md`, rename **Unreleased** to the version and date and update the links at the
   bottom. Update `.github/release-notes.md` if the highlights changed.
4. Commit (`chore(release): v1.0.1`), push and wait for CI.
5. Tag and push the tag:

   ```sh
   git tag v1.0.1
   git push origin v1.0.1
   ```

6. The **Release** workflow builds everything and creates the release. Check the files:

   ```sh
   gh release view v1.0.1 --json assets --jq '.assets[].name'
   ```

   Expected: `…-setup.exe`, `…-portable.exe`, `…-mac-x64.dmg`, `…-mac-arm64.dmg`,
   `…-linux-x86_64.AppImage`, `…-linux-amd64.deb` (plus `latest*.yml` metadata).

7. Download at least the build for your own system and start it.

## Code signing

The installers are not signed with paid certificates yet: macOS builds are ad-hoc signed
(`identity: '-'`, required on Apple Silicon) and users confirm the first start (see
[Installation](/guide/install)). Signing and notarisation are tracked in
[issue #36](https://github.com/K-u-r-c/family-insight/issues/36).
