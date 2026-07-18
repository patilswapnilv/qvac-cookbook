/**
 * Recipe 04 — Text-to-speech, fully local.
 *
 * Load Supertonic EN → textToSpeech → wrap mono int16 PCM as WAV @ 44.1 kHz
 * → write output.wav → unloadModel. Sample rate is engine-known, not on the
 * response. Comments are the tutorial. @qvac/sdk 0.15.0 · Node >= 20.
 */

import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  loadModel,
  unloadModel,
  textToSpeech,
  TTS_EN_SUPERTONIC_Q8_0,
  type ModelProgressUpdate,
} from "@qvac/sdk";

const SAMPLE_RATE = 44_100; // Supertonic native (docs); not on result.buffer
const text =
  process.argv[2]?.trim() ||
  "Hello from QVAC. This recipe turns text into speech on your machine.";
const outPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "output.wav");

/** Mono s16le WAV — createWav is not a public SDK export. */
function pcmToWav(samples: number[], sampleRate: number): Buffer {
  const pcm = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) {
    pcm.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(samples[i] ?? 0))), i * 2);
  }
  const h = Buffer.alloc(44);
  h.write("RIFF", 0);
  h.writeUInt32LE(36 + pcm.length, 4);
  h.write("WAVE", 8);
  h.write("fmt ", 12);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20); // PCM
  h.writeUInt16LE(1, 22); // mono
  h.writeUInt32LE(sampleRate, 24);
  h.writeUInt32LE(sampleRate * 2, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write("data", 36);
  h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}

async function main(): Promise<void> {
  let modelId: string | undefined;
  try {
    // --- Load: ~252 MB; "tts" → tts-ggml; no Piper/eSpeak -------------------
    modelId = await loadModel({
      modelSrc: TTS_EN_SUPERTONIC_Q8_0,
      modelType: "tts",
      modelConfig: { ttsEngine: "supertonic", language: "en", voice: "F1" },
      onProgress: (p: ModelProgressUpdate) => {
        const mb = (n: number) => (n / 1_000_000).toFixed(0);
        process.stdout.write(
          `\r  downloading model… ${p.percentage.toFixed(1)}%  (${mb(p.downloaded)} / ${mb(p.total)} MB)`,
        );
        if (p.percentage >= 100) process.stdout.write("\n");
      },
    });

    // --- Synthesize: stream:false → await buffer; bufferStream empty -------
    console.log(`\nSynthesizing ${text.length} characters…\n`);
    const { buffer } = textToSpeech({ modelId, text, inputType: "text", stream: false });
    const samples = await buffer;

    writeFileSync(outPath, pcmToWav(samples, SAMPLE_RATE));
    const abs = path.resolve(outPath);
    console.log(`Wrote ${samples.length} samples → ${abs}`);
    console.log(
      `Play it:  afplay "${abs}"   # macOS\n` +
        `         ffplay -nodisp -autoexit "${abs}"\n` +
        `         aplay "${abs}"   # Linux ALSA`,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`\n✗ Recipe failed: ${msg}\n`);
    console.error(
      "Common causes:\n" +
        "  • RAM — Supertonic EN wants ~1–2 GB free.\n" +
        "  • First run needs network for TTS_EN_SUPERTONIC_Q8_0.\n" +
        "  • Garbled audio? Use 44.1 kHz (not Chatterbox 24 kHz).\n" +
        '  • Logs: QVAC_CONFIG_PATH → { "loggerLevel": "info", "loggerConsoleOutput": true }',
    );
    process.exitCode = 1;
  } finally {
    // Always free the model — skipping this leaks for the process life.
    if (modelId) await unloadModel({ modelId });
  }
}

await main();
