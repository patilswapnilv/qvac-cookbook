# SDK Feedback Log

Friction, surprises, and suggestions encountered while building these recipes.
Filed items link to their GitHub issue. (`@qvac/sdk` version noted per entry.)

Rule: log everything within 5 minutes of hitting it, however small. Docs-gaps
are as valuable as bugs.

Link check (2026-07-18): own-repo [#3](https://github.com/patilswapnilv/qvac-cookbook/issues/3)–[#6](https://github.com/patilswapnilv/qvac-cookbook/issues/6)
and upstream [#3323](https://github.com/tetherto/qvac/issues/3323)–[#3324](https://github.com/tetherto/qvac/issues/3324)
all resolve and match the entries below in substance.

## Open

### [0.15.0] Docs say Whisper Tiny is ~39 MB; registry `expectedSize` is 77.7 MB
- **What I was doing:** Building recipe 03 (speech-to-text). Picking
  `WHISPER_TINY` and writing the README download-size row from docs vs types.
- **Expected:** One consistent size for `ggml-tiny.bin` across docs and the
  model registry constant.
- **Actual:** Some addon/docs blurbs still say ~39 MB for tiny Whisper; the
  installed registry constant has `expectedSize: 77691713` (~77.7 MB) for
  `WHISPER_TINY` / `ggml-tiny.bin`. The recipe README uses the registry figure.
- **Repro:** Compare docs addon size claims with
  `WHISPER_TINY.expectedSize` from `@qvac/sdk` 0.15.0.
- **Suggestion:** Align docs (and any “39MB” marketing copy) with the registry
  `expectedSize`, or document that 39 MB referred to a different quant/build.
- **Severity:** docs-gap
- **Status:** tracked → [#3](https://github.com/patilswapnilv/qvac-cookbook/issues/3)

### [0.15.0] `ragIngest` takes bare strings; `chunk` defaults to true
- **What I was doing:** Building recipe 02 (embeddings + built-in RAG). The
  exported `RagDoc` type is `{ id, content }`, so I expected to pass documents
  with stable caller-chosen ids (e.g. filenames) into `ragIngest`.
- **Expected:** `documents: RagDoc[]` (or at least optional ids), and for a
  handful of short sample paragraphs, ingest-as-whole without thinking about
  chunking.
- **Actual:** `ragIngest({ documents })` accepts `string | string[]` only — the
  SDK assigns ids. `chunk` defaults to `true` (256-token / paragraph strategy),
  so short teaching docs need an explicit `chunk: false` or they may still be
  split. Search hits expose `id` / `content` / `score`, but you cannot round-trip
  a filename as the id through the managed ingest path.
- **Repro:**
  ```ts
  await ragIngest({
    modelId,
    workspace: "demo",
    documents: ["Espresso\n…", "Sourdough\n…"], // not { id, content }[]
    // omit chunk → defaults true
  });
  ```
- **Suggestion:** Document the managed-ingest shape next to `RagDoc` (when ids
  are assigned vs when you supply them via `ragSaveEmbeddings`). Call out
  `chunk: false` for short docs in the quickstart example.
- **Severity:** docs-gap
- **Status:** tracked → [#4](https://github.com/patilswapnilv/qvac-cookbook/issues/4)

### [0.15.0] `npm init -y` writes `"type": "commonjs"`, muddying the ESM quickstart
- **What I was doing:** Scaffolding a fresh recipe folder the way the SDK
  quickstart describes — `npm init -y`, then `npm pkg set type=module` before
  installing `@qvac/sdk` (which is ESM-only, `"type": "module"`).
- **Expected:** Either a clean starting `package.json` with no `type` field, or
  guidance that acknowledges the intermediate state.
- **Actual:** On current npm, `npm init -y` now emits `"type": "commonjs"` in
  its printed output (and in `package.json`). A first-time reader following the
  quickstart sees `commonjs` right after being told the SDK is ESM, and
  reasonably concludes the `type=module` step failed or that they set it up
  wrong — before ever reaching `npm pkg set type=module`.
- **Repro:**
  ```bash
  npm init -y
  # -> package.json now contains:  "type": "commonjs"
  npm pkg set type=module
  # -> only now is it "module"
  ```
- **Suggestion:** In the quickstart, either (a) show the `package.json` with
  `"type": "module"` already set and skip `npm init -y`, or (b) add a one-line
  note: "recent npm writes `type: commonjs` by default; the next command flips
  it to `module` — this is expected."
- **Severity:** docs-gap
- **Status:** tracked → [#5](https://github.com/patilswapnilv/qvac-cookbook/issues/5)

### [0.15.0] `loadModel` doesn't propagate the `onProgress` callback param type
- **What I was doing:** `loadModel({ modelSrc, modelType: "llm", onProgress: (p) => {...} })`.
- **Expected:** `p` is contextually typed as `ModelProgressUpdate`.
- **Actual:** Under `strict`, `p` is an implicit `any` (`TS7006`) — the generic
  `loadModel<S extends ModelDescriptor>` signature doesn't flow the callback
  param type from the options object. Workaround: annotate explicitly,
  `onProgress: (p: ModelProgressUpdate) => {...}` (and import the type).
- **Severity:** papercut
- **Status:** tracked → [#6](https://github.com/patilswapnilv/qvac-cookbook/issues/6)

## Filed

### [0.15.0] Model constants don't resolve under `moduleResolution: nodenext` (types only)
- **What I was doing:** Typechecking recipe 01 with a standard Node-ESM
  `tsconfig` (`"module": "nodenext"`, `"moduleResolution": "nodenext"`), importing
  a bundled model constant: `import { LLAMA_3_2_1B_INST_Q4_0 } from "@qvac/sdk"`.
- **Expected:** The constant type-resolves, since it exists and the docs/JSDoc
  show exactly this import.
- **Actual:** `tsc` errors `TS2305: Module '"@qvac/sdk"' has no exported member
  'LLAMA_3_2_1B_INST_Q4_0'`. Same for the `@qvac/sdk/models` subpath and for
  every model constant tried (`GTE_LARGE_FP16`, `BCI_EMBEDDER`, …). At **runtime**
  the exports are present — `import('@qvac/sdk/models')` yields 448 exports
  including the constant. So it's a **types-vs-runtime** gap under nodenext.
- **Repro:**
  ```ts
  // tsconfig: module=nodenext, moduleResolution=nodenext, skipLibCheck=true
  import { LLAMA_3_2_1B_INST_Q4_0 } from "@qvac/sdk"; // TS2305
  ```
  ```bash
  node --input-type=module -e "import('@qvac/sdk/models').then(m => \
    console.log('LLAMA_3_2_1B_INST_Q4_0' in m))"   # -> true
  ```
- **Cause (likely):** the registry barrel re-exports constants via extensionless
  `export * from './models'` in its shipped `.d.ts`; nodenext's stricter ESM
  type resolution doesn't follow it. `moduleResolution: bundler` resolves it
  cleanly (and matches how `tsx`/esbuild resolves at runtime), so that's what the
  cookbook's `tsconfig.base.json` uses.
- **Suggestion:** ship `.d.ts` re-exports with explicit `.js` extensions (or a
  types entry that nodenext can follow) so `@qvac/sdk` typechecks under
  `moduleResolution: nodenext`, the default for Node-ESM projects.
- **Severity:** papercut (clean workaround exists)
- **Status:** filed → [#3323](https://github.com/tetherto/qvac/issues/3323)

### [0.15.0] Cookbook/SDK notes still describe Piper TTS + `eSpeakDataPath`
- **What I was doing:** Building recipe 04 (text-to-speech). Verifying
  `loadModel` against installed `@qvac/sdk` 0.15.0 types and the official QVAC
  documentation using the cookbook’s old
  Piper/`configSrc`/`eSpeakDataPath` hints.
- **Expected:** Piper ONNX constants (`TTS_PIPER_*`), a config companion
  constant, and a documented/bundled `eSpeakDataPath` for phonemization.
- **Actual:** Zero Piper/`eSpeakDataPath`/`configSrc` matches in installed
  types or current official documentation. TTS is `@qvac/tts-ggml` (Chatterbox /
  Supertonic GGUF) with `modelType: "tts"` → `"tts-ggml"`, plus
  `modelConfig.language` / `ttsEngine`. Legacy ONNX `modelConfig` fields are
  rejected (`LEGACY_TTS_MODEL_DEPRECATED`, 52211). Stale Piper snippets lived
  in earlier cookbook drafts and have been corrected here; upstream docs
  should match if any page still shows Piper.
- **Repro:** Search installed `@qvac/sdk` `.d.ts` for `eSpeakDataPath` /
  `TTS_PIPER`; compare with the official Text-to-Speech documentation.
- **Suggestion:** Purge Piper/eSpeak from any remaining public docs; document
  that `textToSpeech().buffer` is mono int16 PCM and sample rate is
  engine-default (Supertonic 44100 / Chatterbox 24000), not on the response.
- **Severity:** docs-gap
- **Status:** filed → [#3324](https://github.com/tetherto/qvac/issues/3324)

## Resolved

_(none yet)_
