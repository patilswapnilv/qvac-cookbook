# 04 — Text-to-speech

Synthesize a short sentence with Supertonic EN and write a playable WAV —
fully offline after the first model download. No API key, no cloud.

**Tested against `@qvac/sdk` 0.15.0 · Node ≥ 20**

## What you'll learn
- Load a TTS model (`TTS_EN_SUPERTONIC_Q8_0`) with `loadModel`, `modelType: "tts"`, and `onProgress`.
- Call `textToSpeech` (non-streaming) and await `result.buffer` for mono int16 PCM samples.
- Wrap those samples in a RIFF WAV header at 44.1 kHz and write `output.wav`.
- Free the model with `unloadModel` in a `finally` block.

## Requirements

| Requirement | Value |
|-------------|-------|
| Runtime | Node.js 20+ |
| Model | `TTS_EN_SUPERTONIC_Q8_0` |
| Download | approximately 240 MB |
| Free RAM | approximately 1–2 GB |
| Measured speed | not benchmarked |
| Output | mono, 16-bit PCM WAV at 44.1 kHz |

## Run it

From the repository root:

```bash
cd recipes/04-text-to-speech
npm install
npm start
```

Synthesize custom text:

```bash
npm start -- "Your sentence here."
```

First run downloads the model (progress shown). Subsequent runs are offline.
The recipe writes `output.wav` in this folder (gitignored).

## Expected output

The sample count and absolute path depend on the input and checkout location:

```
Synthesizing 68 characters…

Wrote … samples → /absolute/path/to/recipes/04-text-to-speech/output.wav
Play it:  afplay "/absolute/path/to/output.wav"   # macOS
          ffplay -nodisp -autoexit "/absolute/path/to/output.wav"
          aplay "/absolute/path/to/output.wav"   # Linux ALSA
```

## How it works
`src/index.ts` is commented as the tutorial. In short: `loadModel` downloads/loads
Supertonic EN (`ttsEngine: "supertonic"`, `language: "en"`, `voice: "F1"`) and
returns a `modelId`. `textToSpeech({ modelId, text, inputType: "text", stream: false })`
resolves `buffer` to a `number[]` of mono int16 PCM samples — the sample rate is
**not** on the response, so the recipe stamps **44100** into a minimal WAV header
and writes `output.wav`. `unloadModel` in `finally` frees model memory.

## Troubleshooting
- **No logs?** Set `QVAC_CONFIG_PATH` to a JSON file containing
  `{ "loggerLevel": "info", "loggerConsoleOutput": true }` and re-run.
- **Out of memory / load failure?** Supertonic EN wants ~1–2 GB free RAM.
- **Garbled or chipmunk audio?** Use 44.1 kHz for Supertonic (not Chatterbox’s 24 kHz).
- **First run hangs at 0%?** The initial download needs network; check connectivity.

## Going further
- Pass `stream: true` and iterate `bufferStream` for incremental PCM.
- Try Chatterbox (`TTS_T3_TURBO_EN_CHATTERBOX_Q8_0` + `s3genModelSrc`) for voice
  cloning with optional `referenceAudioSrc` — larger download, 24 kHz output.
- Optional LavaSR denoiser/enhancer GGUFs via `lavasrDenoiserModelSrc` /
  `lavasrEnhancerModelSrc` (enhancer → 48 kHz).
- Previous: [**03 — speech-to-text**](../03-speech-to-text).
  Next: [**05 — Indic translation**](../05-translation-indic).
