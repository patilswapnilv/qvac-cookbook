/**
 * Recipe 05 — Offline Indic translation (IndicTrans2).
 *
 * Load a multilingual en→Indic NMT model, translate English to Marathi
 * (default) or Hindi, print Devanagari, then free the model. Direction is
 * fixed at loadModel via modelConfig.from/to — translate() only needs text.
 *
 * Read top to bottom; the comments are the tutorial.
 * Tested against @qvac/sdk 0.15.0 · Node >= 20.
 */

import {
  loadModel,
  unloadModel,
  translate,
  MARIAN_EN_HI_INDIC_200M_Q4_0,
  type ModelProgressUpdate,
} from "@qvac/sdk";

/** CLI: `npm start -- [--to mr|hi] Your English sentence` */
const args = process.argv.slice(2);
let toFlag = "mr";
const textParts: string[] = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--to") {
    const next = args[++i]?.toLowerCase();
    if (next !== "mr" && next !== "hi") {
      console.error('✗ --to must be "mr" (Marathi) or "hi" (Hindi).');
      process.exitCode = 1;
      process.exit();
    }
    toFlag = next;
  } else if (a) {
    textParts.push(a);
  }
}

const text =
  textParts.join(" ").trim() || "Hello, how are you today? Welcome to Pune.";
// IndicTrans uses ISO 15924 codes (not ISO 639-1). mar_Deva = Marathi Devanagari.
const to = toFlag === "hi" ? "hin_Deva" : "mar_Deva";
const toLabel = toFlag === "hi" ? "Hindi" : "Marathi";

async function main(): Promise<void> {
  let modelId: string | undefined;

  try {
    // --- Load ------------------------------------------------------------------
    // MARIAN_* is a legacy constant name; the file is IndicTrans2 en→indic 200M
    // Q4 (~127 MB). Same weights cover Hindi, Marathi, and ~20 other Indic langs.
    // engine + from/to are baked at load — changing direction needs unload+reload.
    modelId = await loadModel({
      modelSrc: MARIAN_EN_HI_INDIC_200M_Q4_0,
      modelType: "nmt",
      modelConfig: {
        engine: "IndicTrans",
        from: "eng_Latn",
        to,
      },
      onProgress: (p: ModelProgressUpdate) => {
        const mb = (n: number) => (n / 1_000_000).toFixed(0);
        process.stdout.write(
          `\r  downloading model… ${p.percentage.toFixed(1)}%  (${mb(p.downloaded)} / ${mb(p.total)} MB)`,
        );
        if (p.percentage >= 100) process.stdout.write("\n");
      },
    });

    // --- Translate -------------------------------------------------------------
    // Pass stream: false explicitly (docs/JSDoc disagree on the default).
    // There is no public transliterate() API — this is neural MT only.
    console.log(`\nEN → ${toLabel} (${to})\n> ${text}\n`);
    const result = translate({
      modelId,
      text,
      modelType: "nmt",
      stream: false,
    });
    const out = await result.text;
    console.log(out.trim() || "(empty translation)");

    const stats = await result.stats;
    if (stats?.totalTime !== undefined) {
      console.log(`\n[${stats.totalTime.toFixed(2)} s · ${stats.totalTokens ?? "?"} tokens]`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`\n✗ Recipe failed: ${msg}\n`);
    console.error(
      "Common causes:\n" +
        "  • Not enough RAM — the 200M Q4 model wants ~0.5–1.5 GB free.\n" +
        "  • First run needs network for MARIAN_EN_HI_INDIC_200M_Q4_0.\n" +
        "  • Wrong language codes — use eng_Latn / mar_Deva / hin_Deva (not en/mr/hi).\n" +
        "  • Want SDK logs? Set QVAC_CONFIG_PATH to a JSON with\n" +
        '    { "loggerLevel": "info", "loggerConsoleOutput": true } and re-run.',
    );
    process.exitCode = 1;
  } finally {
    if (modelId) await unloadModel({ modelId });
  }
}

await main();
