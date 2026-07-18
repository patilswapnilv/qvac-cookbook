# 03 — Speech-to-text

Transcribe a short local audio file with Whisper Tiny — fully offline after the
first model download. No API key, no cloud.

**Tested against `@qvac/sdk` 0.15.0 · Node ≥ 20**

## What you'll learn
- Load a Whisper model (`WHISPER_TINY`) with `loadModel` and `onProgress`.
- Check the file extension against `SUPPORTED_AUDIO_FORMATS` before calling `transcribe`.
- Pass a file path as `audioChunk` and print the transcript.
- Free the model with `unloadModel` in a `finally` block.

## Requirements

| Requirement | Value |
|-------------|-------|
| Runtime | Node.js 20+ |
| Model | `WHISPER_TINY` |
| Download | approximately 77.7 MB |
| Free RAM | approximately 0.5–1 GB |
| Measured speed | approximately 11× realtime on the author's warm CPU |

## Audio input
Ground truth is the SDK export `SUPPORTED_AUDIO_FORMATS`:

`.mp3`, `.m4a`, `.ogg`, `.wav`, `.flac`, `.aac`, `.raw`

Docs expect **16 kHz mono PCM in a WAV container** for reliable ASR. The shipped
fixture `sample-data/sample-16khz.wav` matches that (~171 KB, ~5 s). Source:
[tetherto/qvac `packages/sdk/examples/audio/sample-16khz.wav`](https://github.com/tetherto/qvac/blob/main/packages/sdk/examples/audio/sample-16khz.wav).

## Run it

From the repository root:

```bash
cd recipes/03-speech-to-text
npm install
npm start
```

Transcribe your own file (must use a supported extension):

```bash
npm start -- /path/to/clip.wav
```

First run downloads the model (progress shown). Subsequent runs are offline.

## Expected output
First run also shows download progress (one updating line). Subsequent runs may jump straight to 100%:

```
  downloading model… 100.0%  (78 / 78 MB)

Transcribing sample-data/sample-16khz.wav…

This is a test and this is another test.
```

## How it works
`src/index.ts` is commented as the tutorial. In short: the recipe resolves the
sample WAV (or a CLI path), rejects unsupported extensions using
`SUPPORTED_AUDIO_FORMATS`, then `loadModel` downloads/loads Whisper Tiny and
returns a `modelId`. `transcribe({ modelId, audioChunk: path })` returns the
full transcript as a string. `unloadModel` in `finally` frees model memory.

## Troubleshooting
- **No logs?** Set `QVAC_CONFIG_PATH` to a JSON file containing
  `{ "loggerLevel": "info", "loggerConsoleOutput": true }` and re-run.
- **Out of memory / load failure?** Whisper Tiny wants ~0.5–1 GB free RAM.
- **Empty or garbage transcript?** Prefer 16 kHz mono PCM WAV; re-encode if needed.
- **First run hangs at 0%?** The initial download needs network; check connectivity.

## Going further
- Pass `metadata: true` to `transcribe` for timed `TranscribeSegment[]` (Whisper) —
  see `packages/sdk/examples/transcription/whispercpp-filesystem.ts` in the
  [tetherto/qvac](https://github.com/tetherto/qvac) monorepo for a fuller config.
- Try a duplex `transcribeStream` session and feed audio with `write()`.
- Swap `WHISPER_TINY` for a Parakeet GGUF constant (e.g. CTC / TDT) for diarization
  experiments — larger download, different `modelType: "parakeet"` (see
  `examples/transcription/parakeet-*.ts` in the same repo).
- Previous: [**02 — embeddings + RAG**](../02-embeddings-rag).
  Next: [**04 — text-to-speech**](../04-text-to-speech).
