# QVAC Cookbook

Practical, runnable TypeScript recipes for local-first, on-device AI with the
[QVAC SDK](https://docs.qvac.tether.io).

[![CI](https://github.com/patilswapnilv/qvac-cookbook/actions/workflows/ci.yml/badge.svg)](https://github.com/patilswapnilv/qvac-cookbook/actions/workflows/ci.yml)
[![QVAC SDK 0.15.0](https://img.shields.io/badge/QVAC%20SDK-0.15.0-2563eb)](https://www.npmjs.com/package/@qvac/sdk/v/0.15.0)
[![Node.js 20+](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](./LICENSE)

Every recipe is intentionally small, self-contained, and designed to teach one
QVAC capability. Models are downloaded with visible progress on first use and
cached locally. Inference then runs on your machine without API keys or a hosted
inference service.

> [!IMPORTANT]
> This is an independent community project and is not affiliated with or
> endorsed by Tether. QVAC and its SDK are maintained by their respective
> owners.

## Why this cookbook?

SDK references explain individual APIs; these recipes show the complete path
from installation to cleanup:

- one focused capability per folder;
- strict TypeScript and ESM throughout;
- exact SDK versions for reproducibility;
- realistic model, memory, and input requirements;
- progress reporting, actionable errors, and guaranteed model cleanup;
- no shared runtime dependency between recipes.

You can copy a single recipe into another project without adopting the rest of
the repository.

## Quick start

### Prerequisites

- Node.js 20 or newer
- npm 10 or newer
- enough free disk space for the selected model
- internet access for the first model download

```bash
git clone https://github.com/patilswapnilv/qvac-cookbook.git
cd qvac-cookbook/recipes/01-completion-streaming
npm install
npm start
```

Pass a custom prompt after `--`:

```bash
npm start -- "Explain local-first AI in two sentences."
```

The first run downloads approximately 0.7 GB for the default Llama model.
Later runs reuse the local cache.

## Recipes

| # | Goal | Default model | Approx. download | Free RAM |
|---|------|---------------|------------------|----------|
| [01](./recipes/01-completion-streaming) | Stream a local chat completion | `LLAMA_3_2_1B_INST_Q4_0` | 0.7 GB | 2 GB |
| [02](./recipes/02-embeddings-rag) | Embed documents and run semantic search | `GTE_LARGE_FP16` | 0.67 GB | 1–1.5 GB |
| [03](./recipes/03-speech-to-text) | Transcribe a local audio file | `WHISPER_TINY` | 77.7 MB | 0.5–1 GB |
| [04](./recipes/04-text-to-speech) | Synthesize speech into a WAV file | `TTS_EN_SUPERTONIC_Q8_0` | 240 MB | 1–2 GB |
| [05](./recipes/05-translation-indic) | Translate English to Marathi or Hindi | `MARIAN_EN_HI_INDIC_200M_Q4_0` | 127 MB | 0.5–1.5 GB |
| [06](./recipes/06-tool-calling) | Let a local model call application tools | `QWEN3_1_7B_INST_Q4` | 1.0 GB | 3–4 GB |

Download and memory figures are practical estimates, not guarantees. Runtime
speed depends on CPU, acceleration support, thermal limits, and current memory
pressure.

## How recipes are structured

```text
recipes/NN-capability/
├── README.md          # setup, usage, concepts, expected output, troubleshooting
├── package.json       # standalone scripts and pinned runtime dependencies
├── package-lock.json  # reproducible dependency graph
├── tsconfig.json      # strict TypeScript configuration
├── eslint.config.js   # lint configuration
├── sample-data/       # small, redistributable fixtures when needed
└── src/index.ts       # executable tutorial
```

Each `src/index.ts` follows the same lifecycle:

```text
select input → download/load model → run inference → present result → unload model
```

`unloadModel` belongs in a `finally` block so native model memory is released
even when inference fails.

## Running quality checks

Each recipe is validated independently:

```bash
cd recipes/03-speech-to-text
npm ci --ignore-scripts
npm run typecheck
npm run lint
```

GitHub Actions runs the same typecheck and lint commands for all recipes on
every push and pull request. Inference is intentionally not run in hosted CI
because it requires large model downloads and machine-specific native runtimes.

## Privacy and local storage

- No recipe requires an API key.
- Model files and QVAC caches are excluded from Git.
- The first run needs network access to retrieve model weights.
- Recipe inputs are passed to local inference code, not a hosted model endpoint.
- Recipe 02 persists its named RAG workspace locally so later runs can reuse it.

Review QVAC's own implementation and policies before using sensitive production
data; this cookbook demonstrates development patterns and is not a security
assessment of the SDK.

## Troubleshooting

Start with the recipe's own troubleshooting section. Common fixes:

- **Download stalls:** confirm network access and available disk space.
- **Model load fails:** close memory-heavy applications or choose a smaller
  quantized model.
- **Need SDK diagnostics:** set `QVAC_CONFIG_PATH` to a JSON file containing
  `{ "loggerLevel": "info", "loggerConsoleOutput": true }`.
- **Type resolution differs from NodeNext:** this repository deliberately uses
  `moduleResolution: "Bundler"`; the reason is documented in
  [`FEEDBACK.md`](./FEEDBACK.md).

If the issue is reproducible, include your OS, architecture, Node version, SDK
version, model constant, command, and complete error message in a GitHub issue.

## Contributing

Corrections, platform results, and focused recipes are welcome. Read
[`CONTRIBUTING.md`](./CONTRIBUTING.md) before opening a pull request. Planned
capabilities and contribution opportunities live in [`ROADMAP.md`](./ROADMAP.md).

SDK-specific friction discovered while building the recipes is documented in
[`FEEDBACK.md`](./FEEDBACK.md), with links to upstream issues where available.

## Official QVAC resources

- [Documentation](https://docs.qvac.tether.io)
- [Source repository](https://github.com/tetherto/qvac)
- [`@qvac/sdk` on npm](https://www.npmjs.com/package/@qvac/sdk)
- [Model catalog](https://qvac.tether.io/models)
- [Community Discord](https://discord.com/invite/tetherdev)

## License

The cookbook is licensed under the [Apache License 2.0](./LICENSE).
