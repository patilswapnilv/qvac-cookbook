# SDK version bump runbook

Use this when `@qvac/sdk` publishes a new version and the cookbook should
follow. Keep every recipe **copy-independent**: bump the exact pin + lockfile
inside each recipe folder (no root install, no shared runtime).

## Preconditions

- Working tree clean on `develop` (or a dedicated bump branch).
- Node ≥ 20, npm ≥ 10.
- Read the new SDK changelog / docs at https://docs.qvac.tether.io before
  changing call sites. Prefer installed `.d.ts` types over memory.

## 1. Branch

```bash
git checkout develop
git pull origin develop
git checkout -b chore/bump-qvac-sdk-X.Y.Z
```

Replace `X.Y.Z` with the target SDK version.

## 2. Bump exact pin + lockfile in all six recipes

```bash
NEW=X.Y.Z
for d in \
  recipes/01-completion-streaming \
  recipes/02-embeddings-rag \
  recipes/03-speech-to-text \
  recipes/04-text-to-speech \
  recipes/05-translation-indic \
  recipes/06-tool-calling
do
  (
    cd "$d"
    npm install "@qvac/sdk@$NEW" --save-exact
    # Recipe 06 only: keep zod exact-pinned (do not introduce ^/~ ranges)
    npm run typecheck
    npm run lint
  ) || exit 1
done
```

Confirm each `package.json` has `"@qvac/sdk": "X.Y.Z"` (no caret) and that
`package-lock.json` files are updated and committed.

## 3. Update version badges and “Tested against” lines

```bash
# Root README badge (adjust the URL + label)
# [![QVAC SDK X.Y.Z](https://img.shields.io/badge/QVAC%20SDK-X.Y.Z-2563eb)](https://www.npmjs.com/package/@qvac/sdk/v/X.Y.Z)

rg -n '0\.15\.0|Tested against|QVAC SDK' README.md recipes/*/README.md recipes/*/src/index.ts FEEDBACK.md BENCHMARKS.md
```

Update:

- Root `README.md` SDK badge.
- Every recipe README `**Tested against @qvac/sdk …**` line.
- File-header “Tested against” comments in each `src/index.ts`.
- `FEEDBACK.md` version tags on open/filed entries (add new `[X.Y.Z]` notes for
  freshly discovered friction; leave historical `[0.15.0]` entries intact).
- `BENCHMARKS.md` machine table SDK field **only after** you re-measure (do not
  copy old numbers onto a new SDK).

## 4. Consistency + quality gates

```bash
./scripts/check-consistency.sh

for d in recipes/*/; do
  (cd "$d" && npm run typecheck && npm run lint) || exit 1
done
```

Both must be green before opening the PR.

## 5. Smoke-run at least one recipe locally

Prefer a warm run against an already-cached model:

```bash
cd recipes/01-completion-streaming
npm start -- "Say hello in one short sentence."
```

If the bump changes TTS / STT / NMT / tools surfaces, smoke the affected recipe
instead (or as well). Capture any new friction in `FEEDBACK.md` within five
minutes.

## 6. Changelog + release tag

1. Add a `## [X.Y.Z-cookbook.N]` section to `CHANGELOG.md` (Keep a Changelog).
2. Open a focused PR; merge to `develop` after CI is green.
3. Tag from the merge commit on `develop`:

```bash
git checkout develop
git pull origin develop
git tag -a "vX.Y.Z-cookbook.N" -m "Cookbook release for @qvac/sdk X.Y.Z"
git push origin "vX.Y.Z-cookbook.N"
```

Do **not** tag if consistency, typecheck, lint, or a required smoke-run is red.
Do **not** commit models, `~/.qvac`, `output.wav`, credentials, or user data.

## Invariants to preserve

1. Copy-one-folder independence (inlined recipe `tsconfig.json`, no cross-recipe imports).
2. No invented SDK APIs — verify against `.d.ts` + docs.
3. `unloadModel` stays in `finally` in every recipe.
4. Exact `@qvac/sdk` pin; exact `zod` pin in recipe 06 only; lockfiles committed.
5. `./scripts/check-consistency.sh` exits 0 after any config change.
