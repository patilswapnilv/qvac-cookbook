#!/usr/bin/env bash
# Assert recipe config stays aligned with the canonical templates.
# - eslint.config.js: byte-identical across recipes
# - tsconfig.json compilerOptions: match root tsconfig.base.json
# - package.json scripts + shared devDependencies: match recipe 01
#   (recipe 06 may add an exact-pinned zod runtime dependency)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RECIPES_DIR="$ROOT/recipes"
CANONICAL_TSCONFIG="$ROOT/tsconfig.base.json"
REF_RECIPE="$RECIPES_DIR/01-completion-streaming"

fail() {
  echo "consistency: $*" >&2
  exit 1
}

[[ -d "$RECIPES_DIR" ]] || fail "missing recipes directory"
[[ -f "$CANONICAL_TSCONFIG" ]] || fail "missing tsconfig.base.json"
[[ -f "$REF_RECIPE/package.json" ]] || fail "missing reference recipe 01"

RECIPES=()
while IFS= read -r dir; do
  RECIPES+=("$dir")
done < <(find "$RECIPES_DIR" -mindepth 1 -maxdepth 1 -type d | sort)
[[ ${#RECIPES[@]} -gt 0 ]] || fail "no recipe folders found"

REF_ESLINT="$REF_RECIPE/eslint.config.js"
[[ -f "$REF_ESLINT" ]] || fail "missing $REF_ESLINT"

for recipe in "${RECIPES[@]}"; do
  name="$(basename "$recipe")"
  eslint="$recipe/eslint.config.js"
  [[ -f "$eslint" ]] || fail "$name: missing eslint.config.js"
  if ! cmp -s "$REF_ESLINT" "$eslint"; then
    fail "$name: eslint.config.js drifts from 01-completion-streaming"
  fi
done

node --input-type=module - "$CANONICAL_TSCONFIG" "${RECIPES[@]}" <<'NODE'
import { readFileSync } from "node:fs";

const [canonicalPath, ...recipeDirs] = process.argv.slice(2);
const canonical = JSON.parse(readFileSync(canonicalPath, "utf8"));

function stableStringifyObject(obj) {
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) return JSON.stringify(obj);
  const out = {};
  for (const key of Object.keys(obj).sort()) out[key] = obj[key];
  return JSON.stringify(out);
}

const want = stableStringifyObject(canonical.compilerOptions);

for (const dir of recipeDirs) {
  const path = `${dir}/tsconfig.json`;
  const cfg = JSON.parse(readFileSync(path, "utf8"));
  if (typeof cfg.extends === "string") {
    console.error(`consistency: ${dir.split("/").pop()}: tsconfig.json must not use \"extends\" (recipes must be copyable)`);
    process.exit(1);
  }
  const got = stableStringifyObject(cfg.compilerOptions);
  if (got !== want) {
    console.error(`consistency: ${dir.split("/").pop()}: tsconfig compilerOptions drift from tsconfig.base.json`);
    process.exit(1);
  }
  if (!Array.isArray(cfg.include)) {
    console.error(`consistency: ${dir.split("/").pop()}: tsconfig.json must include an \"include\" array`);
    process.exit(1);
  }
}
NODE

node --input-type=module - "$REF_RECIPE/package.json" "${RECIPES[@]}" <<'NODE'
import { readFileSync } from "node:fs";

const [refPath, ...recipeDirs] = process.argv.slice(2);
const ref = JSON.parse(readFileSync(refPath, "utf8"));

const requiredScripts = ["start", "typecheck", "lint"];
for (const key of requiredScripts) {
  if (typeof ref.scripts?.[key] !== "string") {
    console.error(`consistency: reference recipe missing scripts.${key}`);
    process.exit(1);
  }
}

for (const dir of recipeDirs) {
  const name = dir.split("/").pop();
  const pkg = JSON.parse(readFileSync(`${dir}/package.json`, "utf8"));

  for (const key of requiredScripts) {
    if (pkg.scripts?.[key] !== ref.scripts[key]) {
      console.error(`consistency: ${name}: scripts.${key} must match recipe 01`);
      process.exit(1);
    }
  }

  const refDev = ref.devDependencies ?? {};
  const gotDev = pkg.devDependencies ?? {};
  const refKeys = Object.keys(refDev).sort();
  const gotKeys = Object.keys(gotDev).sort();
  if (JSON.stringify(gotKeys) !== JSON.stringify(refKeys)) {
    console.error(`consistency: ${name}: devDependencies keys must match recipe 01`);
    process.exit(1);
  }
  for (const key of refKeys) {
    if (gotDev[key] !== refDev[key]) {
      console.error(`consistency: ${name}: devDependencies.${key} must match recipe 01 (${refDev[key]})`);
      process.exit(1);
    }
  }

  if (pkg.dependencies?.["@qvac/sdk"] !== ref.dependencies["@qvac/sdk"]) {
    console.error(`consistency: ${name}: @qvac/sdk must be pinned to ${ref.dependencies["@qvac/sdk"]}`);
    process.exit(1);
  }

  const depKeys = Object.keys(pkg.dependencies ?? {}).sort();
  const allowed = new Set(["@qvac/sdk", "zod"]);
  for (const key of depKeys) {
    if (!allowed.has(key)) {
      console.error(`consistency: ${name}: unexpected dependency ${key}`);
      process.exit(1);
    }
  }

  if (name === "06-tool-calling") {
    const zod = pkg.dependencies?.zod;
    if (typeof zod !== "string" || zod.startsWith("^") || zod.startsWith("~")) {
      console.error(`consistency: ${name}: zod must be an exact version pin`);
      process.exit(1);
    }
  } else if (pkg.dependencies?.zod !== undefined) {
    console.error(`consistency: ${name}: only recipe 06 may depend on zod`);
    process.exit(1);
  }
}
NODE

echo "consistency: ok (${#RECIPES[@]} recipes)"
