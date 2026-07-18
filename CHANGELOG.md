# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project uses a cookbook release tag scheme
`v<sdk-version>-cookbook.<n>` (for example `v0.15.0-cookbook.1`).

## [Unreleased]

### Planned

- Human listening sign-off for recipe 04 WAV intelligibility (technical checks already recorded in `BENCHMARKS.md`).

## [0.15.0-cookbook.1] — 2026-07-18

Release targeting `@qvac/sdk` **0.15.0** with six standalone recipes.

### Added

- Recipe config consistency gate (`scripts/check-consistency.sh`) and CI job
  (`consistency` in `.github/workflows/ci.yml`).
- Apache `NOTICE` with copyright attribution; LICENSE copyright line filled in.
- Named-machine runtime measurements in `BENCHMARKS.md` (Apple M5 Max /
  macOS 26.5.1 / Node 24 / SDK 0.15.0).
- SDK version-bump runbook at `docs/SDK-VERSION-BUMP.md`.
- Numbered “Adding a recipe” workflow in `CONTRIBUTING.md`.

### Changed

- Recipe `tsconfig.json` files inline `compilerOptions` (no `extends` outside
  the folder) so a copied recipe folder typechecks alone; `tsconfig.base.json`
  remains the canonical consistency template.
- CI runs on `develop` as well as `main`.
- Measured-speed / download rows use registry or named-machine figures
  (Whisper 77.7 MB confirmed; TTS ~252 MB; Llama ~773 MB; Qwen ~1.06 GB).
- Multi-turn / app-managed event-loop recipes may exceed the ~100-line teaching
  target when the extra lines teach the contract (`CONTRIBUTING` #3).
- Recipe 06 pins `zod` to an exact version (`4.4.3`).
- Recipe 04 keeps a local `.gitignore` for generated `output.wav` (and
  `node_modules/`).

### Fixed

- Feedback tracking: open items linked to own-repo issues #3–#6; upstream
  papercuts filed as tetherto/qvac #3323–#3324; links re-verified 2026-07-18.

### Security / hygiene

- No models, `~/.qvac` caches, credentials, or generated audio committed.

[Unreleased]: https://github.com/patilswapnilv/qvac-cookbook/compare/v0.15.0-cookbook.1...HEAD
[0.15.0-cookbook.1]: https://github.com/patilswapnilv/qvac-cookbook/compare/160b909...v0.15.0-cookbook.1
