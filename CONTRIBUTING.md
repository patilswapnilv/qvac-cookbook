# Contributing to QVAC Cookbook

Thank you for helping improve the cookbook. Contributions can be new recipes,
bug fixes, clearer explanations, platform-specific results, or well-documented
QVAC SDK feedback.

The guiding test is simple: **a reader should be able to clone one recipe,
understand why each step exists, and get a useful local-AI result without
reading the rest of the repository.**

## Before you start

1. Search existing issues and pull requests.
2. For a new recipe, open an issue describing the capability, model, expected
   download size, memory requirement, and supported platforms.
3. Keep one pull request focused on one recipe or one concern.
4. Verify SDK behavior against the installed TypeScript definitions and the
   [official QVAC documentation](https://docs.qvac.tether.io). Do not invent or
   infer undocumented API signatures.

## Recipe quality bar

Every recipe must meet all of these:

1. **Self-contained.** Runs from a clean clone with `npm i && npm start` inside
   its own folder. No repo-root install step, no shared build.
2. **Shows download progress.** First run prints model download progress via the
   SDK's `onProgress` callback. The README states model size, RAM needed, and
   rough CPU-only expectations.
3. **Comments teach the *why*.** For single-turn recipes, `src/index.ts` stays
   under ~100 lines and is heavily commented for someone's first hour with the
   SDK — the comments are the tutorial, not the code. Multi-turn or
   app-managed event-loop recipes (for example tool calling) may exceed that
   when the extra lines teach the contract; they must stay focused and
   comment-led, not grow into a framework.
4. **Actionable errors.** Failures produce a message a user can act on
   (e.g. "model needs ~2 GB RAM; try the Q4_0 variant"), not a raw stack trace.
5. **Resource hygiene.** `unloadModel` is always called in a `finally` block.
6. **Pinned SDK.** Depend on an exact `@qvac/sdk` version; the README badge states
   which version the recipe was tested against.
7. **Reproducible install.** Commit the recipe's `package-lock.json`.
8. **Honest documentation.** Distinguish measured results from estimates and
   name the machine when publishing benchmarks.
9. **Safe fixtures.** Include only small, redistributable sample data. Never
   commit user data, credentials, model weights, or generated caches.

Prefer a short executable over a miniature framework. If a recipe grows beyond
what a reader can understand in one sitting, split it or narrow its purpose.

## Recipe folder layout

```text
recipes/NN-name/
├── README.md        # what/why, run steps, expected output, model + RAM, gotchas
├── package.json     # standalone; npm i && npm start works in isolation
├── package-lock.json
├── tsconfig.json    # self-contained; inline compilerOptions (see tsconfig.base.json)
├── eslint.config.js
├── src/index.ts     # ~100 lines for single-turn; multi-turn may run longer
└── sample-data/     # tiny fixtures where needed (< 1 MB); optional
```

Use the templates already in `recipes/01-completion-streaming/` as your starting
point for `package.json`, `tsconfig.json`, and the README structure. Keep
`compilerOptions` aligned with the root [`tsconfig.base.json`](./tsconfig.base.json)
canonical template (CI checks this).

## Adding a recipe

1. Open an issue describing the capability, default model, download/RAM
   estimates, and platforms before substantial work.
2. Copy `recipes/01-completion-streaming/` to `recipes/NN-name/` and rename
   the package in `package.json`.
3. Implement `src/index.ts` against installed `@qvac/sdk` types and official
   docs; keep the load → infer → present → `unloadModel` in `finally` lifecycle.
4. Write the recipe README (requirements table including Measured speed,
   expected output, troubleshooting).
5. Add the folder name to the CI matrix in `.github/workflows/ci.yml`.
6. Add a row to the root README recipes table.
7. From the recipe folder: `npm ci --ignore-scripts && npm run typecheck && npm run lint`.
8. From the repo root: `./scripts/check-consistency.sh`.
9. Run the recipe locally (`npm install && npm start`) on a supported machine.
10. Open a focused pull request.

## Local checks before you open a PR

From inside your recipe folder:

```bash
npm ci --ignore-scripts
npm run typecheck   # tsc --noEmit, strict
npm run lint        # eslint
```

From the repository root (after adding or changing recipe config):

```bash
./scripts/check-consistency.sh
```

Then run the actual recipe on a supported local machine:

```bash
npm install
npm start
```

Confirm first-run download progress, expected output, failure messages, and
cleanup behavior. CI runs typecheck and lint per recipe; local inference testing
remains required because model downloads and native runtimes are too heavy for
hosted CI.

## Documentation checklist

- Explain what the recipe demonstrates and what it deliberately leaves out.
- List the exact default model, download estimate, free-memory estimate, and
  expected input format.
- Include copy-pasteable install and run commands.
- Show representative output, clearly noting values that vary by machine.
- Explain the important SDK calls rather than restating every source line.
- Include concrete troubleshooting steps and a link to the next relevant recipe.
- Update the root recipe table and CI matrix when adding a recipe.

If you encounter SDK friction, add a concise, reproducible entry to
[`FEEDBACK.md`](./FEEDBACK.md). Documentation gaps are valid feedback.

## Commit style

[Conventional Commits](https://www.conventionalcommits.org/) with these scopes:

- `feat(recipe-03): add local Whisper transcription`
- `fix(recipe-05): validate translation direction`
- `docs(readme): clarify first-run model caching`
- `ci: ...` — CI / workflow changes
- `chore(deps): bump @qvac/sdk to x.y.z` — dependency bumps

Use imperative, specific subjects. Explain surprising constraints or trade-offs
in the commit body.

## Pull request checklist

- [ ] The change is focused and contains no generated files or private data.
- [ ] Runtime dependencies are pinned where reproducibility requires it.
- [ ] `npm run typecheck` and `npm run lint` pass.
- [ ] The recipe was run locally when behavior changed.
- [ ] Documentation and expected output match the implementation.
- [ ] Root README and CI matrix are updated when applicable.

## License

By contributing you agree that your contributions are licensed under the
[Apache License 2.0](./LICENSE).
