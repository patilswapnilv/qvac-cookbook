/**
 * Recipe 01 — Streaming chat completion, fully local.
 *
 * The whole point of QVAC: the model runs on *your* machine. No API key, no
 * network after the first download. This file is the smallest honest example of
 * that — load a small LLM, stream a reply token-by-token, then clean up.
 *
 * Read top to bottom; the comments are the tutorial.
 * Tested against @qvac/sdk 0.15.0 · Node >= 20.
 */

import {
  loadModel,
  unloadModel,
  completion,
  LLAMA_3_2_1B_INST_Q4_0,
  type ModelProgressUpdate,
} from "@qvac/sdk";

// The prompt. Pass one on the CLI (`npm start -- "your question"`) or use this.
const prompt = process.argv.slice(2).join(" ") || "Explain what a local LLM is in two sentences.";

async function main(): Promise<void> {
  // `loadModel` resolves to a string modelId once the model is downloaded (first
  // run) and loaded into memory. We keep it in a variable declared *outside* the
  // try so the `finally` below can always unload it, even if inference throws.
  let modelId: string | undefined;

  try {
    // --- Load ------------------------------------------------------------------
    // `modelSrc` is a bundled model constant. It could also be a Hugging Face /
    // Pear / HTTP URL — the constant just resolves to a known-good source.
    // `modelType: "llm"` selects the llama.cpp completion addon.
    // `onProgress` fires only on the *first* run while the ~0.7 GB file downloads;
    // afterwards the model is cached and load is near-instant (no progress ticks).
    modelId = await loadModel({
      modelSrc: LLAMA_3_2_1B_INST_Q4_0,
      modelType: "llm",
      // We annotate `p` explicitly: on this SDK version the generic `loadModel`
      // doesn't propagate the callback's parameter type, so without this the
      // param would be an implicit `any` under strict mode.
      onProgress: (p: ModelProgressUpdate) => {
        // p.percentage / p.downloaded / p.total are bytes-based numbers.
        const mb = (n: number) => (n / 1_000_000).toFixed(0);
        // \r keeps it on one line so it reads like a real progress bar.
        process.stdout.write(
          `\r  downloading model… ${p.percentage.toFixed(1)}%  (${mb(p.downloaded)} / ${mb(p.total)} MB)`,
        );
        if (p.percentage >= 100) process.stdout.write("\n");
      },
    });

    // --- Infer (streaming) -----------------------------------------------------
    // `completion` returns synchronously with a run handle. Setting `stream: true`
    // means tokens arrive incrementally instead of all at once — that's what makes
    // a chat UI feel alive. `history` is the conversation so far; here, one turn.
    console.log(`\n> ${prompt}\n`);
    const run = completion({
      modelId,
      history: [{ role: "user", content: prompt }],
      stream: true,
    });

    // `run.tokenStream` is an async generator of plain-text chunks. Writing each
    // as it arrives is the entire streaming trick.
    for await (const token of run.tokenStream) {
      process.stdout.write(token);
    }
    process.stdout.write("\n");

    // `run.stats` resolves after the stream ends — handy for a tok/s footer.
    const stats = await run.stats;
    if (stats?.tokensPerSecond !== undefined) {
      console.log(`\n[${stats.tokensPerSecond.toFixed(1)} tok/s · ${stats.generatedTokens ?? "?"} tokens]`);
    }
  } catch (err) {
    // Actionable errors > raw stack traces. The most common first-run failure is
    // running out of RAM loading the model, so point at the concrete fix.
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`\n✗ Recipe failed: ${msg}\n`);
    console.error(
      "Common causes:\n" +
        "  • Not enough RAM — this model wants ~2 GB free. Close apps, or try a\n" +
        "    smaller quant (e.g. a Q4_0 variant) via `modelSrc`.\n" +
        "  • First run needs network to download the model; check connectivity.\n" +
        "  • Want SDK logs? Set QVAC_CONFIG_PATH to a JSON with\n" +
        '    { "loggerLevel": "info", "loggerConsoleOutput": true } and re-run.',
    );
    process.exitCode = 1;
  } finally {
    // --- Clean up --------------------------------------------------------------
    // Always free the model's memory. Skipping this leaks a multi-GB allocation
    // for the life of the process — the #1 resource-hygiene mistake with the SDK.
    if (modelId) await unloadModel({ modelId });
  }
}

await main();
