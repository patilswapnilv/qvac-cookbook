/**
 * Recipe 02 — Embeddings + built-in RAG, fully local.
 *
 * Load an embeddings model, ingest a tiny corpus into a named RAG workspace,
 * run one semantic query, and print scored hits. Re-runs skip re-embedding
 * when the workspace already exists on disk — that reuse is the teaching point.
 *
 * Read top to bottom; the comments are the tutorial.
 * Tested against @qvac/sdk 0.15.0 · Node >= 20.
 */

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  loadModel,
  unloadModel,
  GTE_LARGE_FP16,
  ragIngest,
  ragSearch,
  ragListWorkspaces,
  ragCloseWorkspace,
  type ModelProgressUpdate,
} from "@qvac/sdk";

const WORKSPACE = "cookbook-02-embeddings-rag";
const query =
  process.argv.slice(2).join(" ") || "How is espresso coffee made under pressure?";

async function loadCorpus(): Promise<string[]> {
  // Documents are bare strings — the SDK assigns ids. Titles in each file make
  // printed hits easy to recognise when teaching semantic retrieval.
  const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "sample-data");
  const files = (await readdir(dir)).filter((f) => f.endsWith(".txt")).sort();
  return Promise.all(files.map((f) => readFile(path.join(dir, f), "utf8")));
}

async function main(): Promise<void> {
  let modelId: string | undefined;

  try {
    // --- Load ------------------------------------------------------------------
    // GTE Large (~670 MB) produces 1024-dim vectors via the embeddings addon.
    // Annotate `p`: loadModel does not propagate onProgress's parameter type.
    modelId = await loadModel({
      modelSrc: GTE_LARGE_FP16,
      modelType: "embeddings",
      onProgress: (p: ModelProgressUpdate) => {
        const mb = (n: number) => (n / 1_000_000).toFixed(0);
        process.stdout.write(
          `\r  downloading model… ${p.percentage.toFixed(1)}%  (${mb(p.downloaded)} / ${mb(p.total)} MB)`,
        );
        if (p.percentage >= 100) process.stdout.write("\n");
      },
    });

    // --- Ingest (idempotent) ---------------------------------------------------
    // Workspaces are named stores (Corestore/HyperDB) that survive process exit.
    // `workspace` is a logical id, not a filesystem path. If this name already
    // appears in ragListWorkspaces(), skip ragIngest — re-ingest would embed again.
    const documents = await loadCorpus();
    const existing = await ragListWorkspaces();
    if (existing.some((w) => w.name === WORKSPACE)) {
      console.log(`\nWorkspace "${WORKSPACE}" already on disk — skipping ingest (reuse).`);
    } else {
      console.log(`\nIngesting ${documents.length} docs into workspace "${WORKSPACE}"…`);
      // chunk: false — these docs are short; default chunking (256 tokens) is overkill.
      await ragIngest({ modelId, workspace: WORKSPACE, documents, chunk: false });
    }

    // --- Search ----------------------------------------------------------------
    console.log(`\nQuery: ${query}\n`);
    const hits = await ragSearch({ modelId, workspace: WORKSPACE, query, topK: 3 });
    for (const [i, hit] of hits.entries()) {
      const snip = hit.content.replace(/\s+/g, " ").trim().slice(0, 120);
      console.log(`${i + 1}. score=${hit.score.toFixed(4)}  id=${hit.id}`);
      console.log(`   ${snip}${hit.content.length > 120 ? "…" : ""}\n`);
    }

    // Close releases locks but keeps data (no deleteOnClose) so the next run reuses it.
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`\n✗ Recipe failed: ${msg}\n`);
    console.error(
      "Common causes:\n" +
        "  • Not enough RAM — this embeddings model wants ~1–1.5 GB free.\n" +
        "  • First run needs network to download GTE_LARGE_FP16; check connectivity.\n" +
        "  • Want SDK logs? Set QVAC_CONFIG_PATH to a JSON with\n" +
        '    { "loggerLevel": "info", "loggerConsoleOutput": true } and re-run.',
    );
    process.exitCode = 1;
  } finally {
    try {
      await ragCloseWorkspace({ workspace: WORKSPACE });
    } catch {
      // Ignore: workspace may not exist/be open if ingest/search failed early.
    }
    // Always free the model — skipping this leaks a large allocation for the process life.
    if (modelId) await unloadModel({ modelId });
  }
}

await main();
