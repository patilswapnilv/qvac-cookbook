# 05 — Offline Indic translation

Translate English to Marathi or Hindi with IndicTrans2 — fully offline after the
first model download. No API key, no cloud. The differentiator recipe: on-device
neural MT for Indic languages.

**Tested against `@qvac/sdk` 0.15.0 · Node ≥ 20**

## What you'll learn
- Load an IndicTrans2 NMT model with `modelType: "nmt"` and `engine: "IndicTrans"`.
- Set direction at load time via ISO 15924 codes (`eng_Latn` → `mar_Deva` / `hin_Deva`).
- Call `translate({ stream: false })` and await `result.text`.
- Free the model with `unloadModel` in a `finally` block.

## Requirements

| Requirement | Value |
|-------------|-------|
| Runtime | Node.js 20+ |
| Model | `MARIAN_EN_HI_INDIC_200M_Q4_0` |
| Download | approximately 127 MB |
| Free RAM | approximately 0.5–1.5 GB |
| Measured speed | approximately 9 s (`stats.totalTime`) warm for the default short sentence (Apple M5 Max, 36 GB, macOS 26.5.1, SDK 0.15.0; see [BENCHMARKS.md](../../BENCHMARKS.md)) |

The constant name is legacy (`MARIAN_*`); the file is multilingual IndicTrans2
**en→Indic** (Hindi, Marathi, and ~20 other Indic languages share the same weights).

## Language codes
| Language | Code | CLI flag |
|----------|------|----------|
| English (source) | `eng_Latn` | — |
| Marathi (default) | `mar_Deva` | `--to mr` |
| Hindi | `hin_Deva` | `--to hi` |

There is **no public `transliterate()` API** — this recipe is neural machine
translation only. Direction is fixed at `loadModel`; change `to` by reloading.

## Run it

From the repository root:

```bash
cd recipes/05-translation-indic
npm install
npm start
```

Marathi (default) or Hindi, with your own sentence:

```bash
npm start -- "Welcome to the local AI cookbook."
npm start -- --to hi "How are you today?"
```

First run downloads the model (progress shown). Subsequent runs are offline.

## Expected output
First run also shows download progress (one updating line). Subsequent runs may jump straight to 100%:

```
  downloading model… 100.0%  (127 / 127 MB)

EN → Marathi (mar_Deva)
> Hello, how are you today? Welcome to Pune.

नमस्कार, आज तुम्ही कसे आहात? पुण्यात तुमचे स्वागत आहे.

[18.37 s · 13 tokens]
```

## How it works
`src/index.ts` is commented as the tutorial. In short: `loadModel` downloads the
~127 MB IndicTrans2 Q4 weights and bakes `from`/`to` into the NMT context.
`translate({ modelId, text, modelType: "nmt", stream: false })` returns a handle;
`await result.text` is the full Devanagari string. `unloadModel` in `finally`
frees model memory.

## Troubleshooting
- **No logs?** Set `QVAC_CONFIG_PATH` to a JSON file containing
  `{ "loggerLevel": "info", "loggerConsoleOutput": true }` and re-run.
- **Out of memory / load failure?** The 200M Q4 model wants ~0.5–1.5 GB free RAM.
  For a larger model try `MARIAN_EN_HI_INDIC_1B_Q4_0` (~637 MB download).
- **Empty / garbage output?** Confirm `engine: "IndicTrans"` and ISO 15924 codes
  (`eng_Latn`, not `en`).
- **Need Indic → English?** Load `MARIAN_HI_EN_INDIC_200M_Q4_0` with
  `from: "mar_Deva"` / `"hin_Deva"` and `to: "eng_Latn"`.

## Going further
- Pivot Hindi↔Marathi with `MARIAN_HI_HI_INDIC_320M_Q4_0` (`indic-indic` direction).
- Stream tokens with `stream: true` and iterate `tokenStream`.
- Previous: [**04 — text-to-speech**](../04-text-to-speech).
  Next: [**06 — tool calling**](../06-tool-calling).
