# 06 — Tool / function calling

Define a local tool, let the model call it, execute the handler yourself, then
feed the result back for a final answer — fully offline after the first model
download. No API key, no cloud, no MCP.

**Tested against `@qvac/sdk` 0.15.0 · Node ≥ 20**

## What you'll learn
- Load an Instruct model with `modelConfig.tools: true` and a larger `ctx_size`.
- Pass Zod tool definitions (with optional `handler`) into `completion()`.
- Consume the canonical `events` / `final` surface (`toolCall` events).
- Call `toolCall.invoke()`, push `assistant` + `tool` turns, and complete again.

## Requirements

| Requirement | Value |
|-------------|-------|
| Runtime | Node.js 20+ |
| Model | `QWEN3_1_7B_INST_Q4` |
| Download | approximately 1.0 GB |
| Free RAM | approximately 3–4 GB |
| Measured speed | approximately 147 tok/s for the follow-up (illustrative — not tied to a named machine) |

Tool calling is **app-managed**: the SDK parses calls and can attach `invoke()`,
but it does **not** auto-loop tool → follow-up. You own that cycle. The recipe
source is longer than the usual ~100-line teaching target on purpose — the
extra lines walk the app-managed event loop.

## Run it

From the repository root:

```bash
cd recipes/06-tool-calling
npm install
npm start
```

Ask your own weather question:

```bash
npm start -- "What's the weather in Mumbai?"
```

First run downloads the model (progress shown). Subsequent runs are offline.

## Expected output
First run also shows download progress. Qwen3 may emit a short `<think>` block
before the tool call — that is normal. The important lines:

```
  downloading model… 100.0%  (1057 / 1057 MB)

> What's the weather in Tokyo?

▸ Tool: get_weather({"city":"Tokyo"})

▸ Executing tools…
  get_weather({"city":"Tokyo"})
  → {"city":"Tokyo","temperature":"22°C","condition":"Partly cloudy"}

▸ Follow-up:

The weather in Tokyo is currently 22°C with partly cloudy conditions.

[146.5 tok/s · 132 tokens]
```

## How it works
`src/index.ts` is commented as the tutorial. In short: `loadModel` enables tools
on Qwen3 1.7B. Turn 1 runs `completion({ tools })` and drains `run.events` until
`final.toolCalls` is populated. Each call’s `invoke()` runs the Zod-backed
handler (fixed mock weather JSON). Those results are pushed as `{ role: "tool" }`
messages, then turn 2 streams the grounded answer. `unloadModel` in `finally`
frees model memory.

## Troubleshooting
- **No logs?** Set `QVAC_CONFIG_PATH` to a JSON file containing
  `{ "loggerLevel": "info", "loggerConsoleOutput": true }` and re-run.
- **Out of memory?** Qwen3 1.7B Q4 wants ~3–4 GB free RAM.
- **No tool call emitted?** Small Instruct quants sometimes narrate instead of
  calling. Retry, or try `LLAMA_TOOL_CALLING_1B_INST_Q4_K` with
  `toolDialect: "pythonic"`.
- **`responseFormat` + tools?** Mutually exclusive in 0.15.0 — pick one.

## Going further
- Register a second tool and ask a multi-tool question.
- Plug MCP clients via `completion({ mcp })` (still app-invoked via `invoke()`).
- Previous: [**05 — Indic translation**](../05-translation-indic).
  Planned next recipes are tracked in the project [roadmap](../../ROADMAP.md).
