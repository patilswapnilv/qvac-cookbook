# 01 — Chat completion (streaming)

Stream a chat response from a local LLM, token by token — no API key, offline
after the first model download. The "hello world" of the QVAC SDK.

**Tested against `@qvac/sdk` 0.15.0 · Node ≥ 20**

## What you'll learn
- Load a bundled model with `loadModel` and show download progress via `onProgress`.
- Stream tokens as they generate with `completion({ stream: true })` and `run.tokenStream`.
- Read `run.stats` for a tokens-per-second footer.
- Free memory correctly with `unloadModel` in a `finally` block.

## Requirements

| Requirement | Value |
|-------------|-------|
| Runtime | Node.js 20+ |
| Model | `LLAMA_3_2_1B_INST_Q4_0` |
| Download | approximately 773 MB (registry `expectedSize`) |
| Free RAM | approximately 2 GB |
| Measured speed | approximately 80 tok/s warm (Apple M5 Max, 36 GB, macOS 26.5.1, SDK 0.15.0; see [BENCHMARKS.md](../../BENCHMARKS.md)) |
| Network | required for the first model download |

## Run it

From the repository root:

```bash
cd recipes/01-completion-streaming
npm install
npm start
```

Ask your own question by passing it through:

```bash
npm start -- "Write a haiku about offline AI"
```

First run downloads the model (progress shown). Subsequent runs are offline.

## Expected output

The exact response and throughput vary by machine and model sampling:

```
  downloading model… 100.0%  (… / … MB)

> Explain what a local LLM is in two sentences.

A local LLM runs directly on your device rather than sending prompts to a
hosted inference service. It can improve privacy and offline availability.

[… tok/s · … tokens]
```

## How it works
`src/index.ts` is ~90 lines and commented as the tutorial. In short: `loadModel`
downloads/loads the Llama 3.2 1B model and returns a `modelId`; `onProgress`
prints a one-line progress bar during the first-run download only. `completion`
is called with `stream: true`, and iterating `run.tokenStream` prints each text
chunk as it's generated — that's the whole streaming effect. After the stream
ends, `run.stats` gives tokens/sec. Everything is wrapped so `unloadModel` runs
in `finally`, freeing the model's memory even if inference throws.

## Troubleshooting
- **No logs?** Set `QVAC_CONFIG_PATH` to a JSON file containing
  `{ "loggerLevel": "info", "loggerConsoleOutput": true }` and re-run.
- **Out of memory / load failure?** This model wants ~2 GB free RAM. Close other
  apps, or point `modelSrc` at a smaller quantized variant.
- **First run hangs at 0%?** The initial download needs network; check connectivity.
  After it completes once, the model is cached and runs fully offline.

## Going further
- Add a second turn to `history` to hold a conversation.
- Swap `modelSrc` for another model constant or a Hugging Face URL to compare sizes.
- Next recipe: [**02 — embeddings + RAG**](../02-embeddings-rag), to search your
  own documents locally.
