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
   `…-linux-x86_64.AppImage`, `…-linux-amd64.deb`, the update metadata `latest.yml`,
   `latest-mac.yml`, `latest-linux.yml`, and the `*.blockmap` files.

7. Download at least the build for your own system and start it.

`gh workflow run release.yml` runs the same builds without publishing (artifacts only) – use it to
check the installers of every OS before tagging.

## Updates {#updates}

Installed apps find new versions through the release itself:

- **Windows installer and AppImage** use electron-updater with the GitHub provider: they read
  `latest.yml` / `latest-linux.yml` from the latest release, download the installer (differentially
  where the blockmap allows) and install it on restart. The `publish` section of
  `electron-builder.yml` makes electron-builder write these files; the release workflow uploads
  them with the blockmaps.
- **Portable exe, deb and macOS** can't replace themselves (macOS would need a Developer ID
  signature, #36); they ask the GitHub releases API for the latest tag and open the release page.
- A release must therefore keep the file names produced by `artifactName` and include every
  `latest*.yml` – otherwise installed apps don't see it.

**Testing** without the internet (`e2e/updates.spec.ts`): the built app runs with
`FAMILY_INSIGHT_UPDATE_TEST=1` and

- `FAMILY_INSIGHT_UPDATE_TARGET=appimage`, `FAMILY_INSIGHT_UPDATE_CONFIG` pointing to a
  `provider: generic` config for a local server that serves `latest-linux.yml` for version 9.9.9 and
  a fake AppImage (a script). The test checks the notice, the release notes, the download, and that
  "Restart now" replaces the file at `APPIMAGE` and starts it (the script writes a marker);
- `FAMILY_INSIGHT_UPDATE_TARGET=deb` and `FAMILY_INSIGHT_UPDATE_API` pointing to a fake releases API:
  the notice offers the download page and opens it.

Windows (NSIS) and macOS updates can only be checked on those systems with a real release.

## Code signing

The installers are not signed with paid certificates yet: macOS builds are ad-hoc signed
(`identity: '-'`, required on Apple Silicon) and users confirm the first start (see
[Installation](/guide/install)). Signing and notarisation are tracked in
[issue #36](https://github.com/K-u-r-c/family-insight/issues/36).
