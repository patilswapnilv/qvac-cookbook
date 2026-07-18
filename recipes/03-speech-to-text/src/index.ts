/**
 * Recipe 03 — Speech-to-text, fully local.
 *
 * Load Whisper Tiny, transcribe a short WAV, print the text, then free the
 * model. The teaching point is the audio contract: extension must be in
 * SUPPORTED_AUDIO_FORMATS, and the shipped fixture is 16 kHz mono PCM WAV.
 *
 * Read top to bottom; the comments are the tutorial.
 * Tested against @qvac/sdk 0.15.0 · Node >= 20.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  loadModel,
  unloadModel,
  transcribe,
  WHISPER_TINY,
  SUPPORTED_AUDIO_FORMATS,
  type ModelProgressUpdate,
} from "@qvac/sdk";

const defaultWav = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "sample-data",
  "sample-16khz.wav",
);
const audioPath = process.argv[2] ? path.resolve(process.argv[2]) : defaultWav;

async function main(): Promise<void> {
  let modelId: string | undefined;

  try {
    // --- Preflight -------------------------------------------------------------
    // The decoder accepts several containers; list them from the SDK export so
    // the recipe never drifts from ground truth. Prefer 16 kHz mono PCM WAV.
    const ext = path.extname(audioPath).toLowerCase();
    if (!(SUPPORTED_AUDIO_FORMATS as readonly string[]).includes(ext)) {
      console.error(
        `✗ Unsupported audio format "${ext}". Allowed: ${SUPPORTED_AUDIO_FORMATS.join(", ")}.\n` +
          "  Prefer 16 kHz mono PCM in a WAV container (what the sample fixture uses).",
      );
      process.exitCode = 1;
      return;
    }

    // --- Load ------------------------------------------------------------------
    // WHISPER_TINY is ~77.7 MB on disk (registry expectedSize). modelType
    // "whisper" selects the whisper.cpp transcription addon.
    // Annotate `p`: loadModel does not propagate onProgress's parameter type.
    modelId = await loadModel({
      modelSrc: WHISPER_TINY,
      modelType: "whisper",
      onProgress: (p: ModelProgressUpdate) => {
        const mb = (n: number) => (n / 1_000_000).toFixed(0);
        process.stdout.write(
          `\r  downloading model… ${p.percentage.toFixed(1)}%  (${mb(p.downloaded)} / ${mb(p.total)} MB)`,
        );
        if (p.percentage >= 100) process.stdout.write("\n");
      },
    });

    // --- Transcribe ------------------------------------------------------------
    // audioChunk accepts a file path or a Buffer — path keeps the recipe simple.
    // Print a portable path for the default fixture so README samples stay stable.
    const displayPath = process.argv[2]
      ? audioPath
      : path.join(".", "sample-data", "sample-16khz.wav");
    console.log(`\nTranscribing ${displayPath}…\n`);
    const text = await transcribe({ modelId, audioChunk: audioPath });
    console.log(text.trim() || "(empty transcript)");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`\n✗ Recipe failed: ${msg}\n`);
    console.error(
      "Common causes:\n" +
        "  • Not enough RAM — Whisper Tiny wants ~0.5–1 GB free.\n" +
        "  • First run needs network to download WHISPER_TINY; check connectivity.\n" +
        "  • Wrong sample rate / layout — prefer 16 kHz mono PCM WAV.\n" +
        "  • Want SDK logs? Set QVAC_CONFIG_PATH to a JSON with\n" +
        '    { "loggerLevel": "info", "loggerConsoleOutput": true } and re-run.',
    );
    process.exitCode = 1;
  } finally {
    // Always free the model — skipping this leaks a large allocation for the process life.
    if (modelId) await unloadModel({ modelId });
  }
}

await main();
