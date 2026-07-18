# Benchmarks

Named-machine measurements for the six recipes. **Estimates** (README
requirements tables) stay separate from **measured** figures below.

## Machine

| Field | Value |
|-------|-------|
| CPU | Apple M5 Max |
| Cores | 18 (6 performance + 12 efficiency) |
| RAM | 36 GB |
| OS | macOS 26.5.1 (Darwin 25.5.0 arm64) |
| Node | v24.17.0 |
| SDK | `@qvac/sdk` 0.15.0 |
| Date (UTC) | 2026-07-18 |

Protocol: each recipe ran once **cold** (empty temporary `$HOME`, so the model
downloaded into an isolated cache) and once **warm** (same temporary `$HOME`).
`~/.qvac` was not deleted or moved. Peak RSS is from macOS `/usr/bin/time -l`
(process maximum resident set size). System free-RAM deltas from `vm_stat` were
noisy under memory compression and are **not** used as primary figures.

## Summary

| Recipe | Model file (bytes) | Progress total | Peak RSS (warm) | Warm wall | Measured speed (warm) |
|--------|--------------------:|----------------|----------------:|----------:|------------------------|
| 01 | 773 025 824 | 773 / 773 MB | 1.25 GB | 8.8 s | 80.4 tok/s · 83 tokens |
| 02 | 669 603 712 | 670 / 670 MB | 1.10 GB | 7.1 s | top-1 score 0.7981 (stable) |
| 03 | 77 691 713 | 78 / 78 MB | 0.56 GB | 4.9 s | ~1.1× realtime end-to-end (5.35 s audio, includes load) |
| 04 | 251 818 336 | 252 / 252 MB | 0.91 GB | 6.3 s | 227 654 samples → 5.16 s WAV @ 44.1 kHz |
| 05 | 127 339 617 | 127 / 127 MB | 0.66 GB | 13.3 s | 8.95 s · 13 tokens (stats) |
| 06 | 1 056 782 912 | 1057 / 1057 MB | 1.78 GB | 13.1 s | 53.8 tok/s · 132 tokens (two-turn); tool hit 5/5 |

Cold walls are dominated by download (about 1–4 minutes depending on model size
and network) and are omitted from the speed column on purpose.

## Per-recipe notes

### 01 — completion streaming

- Prompt: `Explain what a local LLM is in two sentences.`
- Cold also reported 152.7 tok/s (76 tokens); warm 80.4 tok/s (83 tokens).
  Throughput varies with token count and thermal/OS noise — cite the warm row.
- On-disk size matches registry `expectedSize` exactly (773 025 824).

### 02 — embeddings + RAG

- Default espresso query.
- Cold vs warm top hits were **identical**: ids and scores
  `0.7981` / `0.5608` / `0.5472` (same UUID ids after workspace reuse).
- Warm log: `already on disk — skipping ingest (reuse).`

### 03 — speech-to-text

- Fixture `sample-data/sample-16khz.wav` duration **5.355 s**.
- Transcript (cold and warm): `This is a test and this is another test.`
- On-disk size **77 691 713** bytes — exact match for registry
  `WHISPER_TINY.expectedSize` (77.7 MB). Progress UI rounds to **78 / 78 MB**.
- Warm end-to-end wall **4.93 s** ⇒ about **1.1× realtime including model load**.
  The recipe does not print an inference-only timer; older “~11× realtime”
  illustrative claims are superseded by this named-machine end-to-end figure.

### 04 — text-to-speech

- Runtime probe: `await textToSpeech(...).buffer` → `Array` of `number`
  (`Array.isArray === true`, `typeof samples[0] === "number"`).
- WAV header: PCM format 1, mono, **44100 Hz**, 16-bit; duration **5.162 s**
  for 227 654 samples.
- `afplay` accepts the file (player starts successfully).
- **Human listening checkpoint:** confirm intelligibility / non-chipmunked pitch
  with `afplay recipes/04-text-to-speech/output.wav` (subjective; not claimed
  by automation).
- On-disk size **251 818 336** bytes (~252 MB). Older “~240 MB” README rows
  referred to a rounded/MiB-style figure; docs now use the registry/measured MB.

### 05 — translation Indic

- Default EN→Marathi (`mar_Deva`).
- Output (cold and warm): `नमस्कार, आज तुम्ही कसे आहात? पुण्यात तुमचे स्वागत आहे.`
  (coherent Devanagari for the default English prompt).
- Recipe passes `stream: false` explicitly. Installed client code takes the
  non-streaming path when `params.stream` is falsy, while JSDoc still says
  “Defaults to true” — see `FEEDBACK.md`.

### 06 — tool calling

- Prompt: `What's the weather in Tokyo?` with recipe `temp: 0`, `seed: 42`.
- Cold and warm both emitted `▸ Tool: get_weather({"city":"Tokyo"})`.
- Five additional warm runs against the real `~/.qvac` cache: **5/5 hits**.
- Follow-up footer on the instrumented warm run: **53.8 tok/s · 132 tokens**.
  Five hit-rate runs ranged **31.3–63.2 tok/s** for the same token count —
  supersedes the older illustrative “~147 tok/s” figure.

## Re-running

```bash
# Example: warm run for recipe 03 (uses your ~/.qvac cache)
cd recipes/03-speech-to-text
/usr/bin/time -l npm start

# True cold without touching ~/.qvac
HOME=/tmp/qvac-bench-home-manual mkdir -p "$HOME"
HOME=/tmp/qvac-bench-home-manual /usr/bin/time -l npm start
```
