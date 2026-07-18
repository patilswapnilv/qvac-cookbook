/**
 * Recipe 06 — Tool / function calling, fully local.
 *
 * Load a tool-capable Instruct model, define one Zod tool with a handler,
 * let the model emit a toolCall, invoke it yourself, then feed the result
 * back for a final answer. The SDK does NOT auto-loop tools — you own the
 * execute → follow-up cycle.
 *
 * Read top to bottom; the comments are the tutorial.
 * Tested against @qvac/sdk 0.15.0 · Node >= 20.
 */

import { z } from "zod";
import {
  loadModel,
  unloadModel,
  completion,
  QWEN3_1_7B_INST_Q4,
  type ModelProgressUpdate,
  type CompletionEvent,
} from "@qvac/sdk";

const prompt =
  process.argv.slice(2).join(" ").trim() || "What's the weather in Tokyo?";

// One tool + fixed mock data keeps the demo deterministic (no network).
// Reuse the schema for ToolInput.parameters and handler narrowing. The SDK types
// handlers as Record<string, unknown>, so parse (don't rely on z.infer alone).
const weatherParams = z.object({
  city: z.string().describe("City name"),
});

const tools = [
  {
    name: "get_weather",
    description: "Get current weather for a city",
    parameters: weatherParams,
    handler: async (args: Record<string, unknown>) => {
      const { city } = weatherParams.parse(args);
      return {
        city,
        temperature: "22°C",
        condition: "Partly cloudy",
      };
    },
  },
];

async function main(): Promise<void> {
  let modelId: string | undefined;

  try {
    // --- Load ------------------------------------------------------------------
    // tools: true enables tool Jinja / parsing. ctx_size must clear tool schemas
    // (default 1024 is too small). Official examples use QWEN3_1_7B_INST_Q4.
    modelId = await loadModel({
      modelSrc: QWEN3_1_7B_INST_Q4,
      modelType: "llm",
      modelConfig: {
        ctx_size: 4096,
        tools: true,
      },
      onProgress: (p: ModelProgressUpdate) => {
        const mb = (n: number) => (n / 1_000_000).toFixed(0);
        process.stdout.write(
          `\r  downloading model… ${p.percentage.toFixed(1)}%  (${mb(p.downloaded)} / ${mb(p.total)} MB)`,
        );
        if (p.percentage >= 100) process.stdout.write("\n");
      },
    });

    const history: Array<{ role: string; content: string }> = [
      {
        role: "system",
        content:
          "You are a helpful assistant. Use the get_weather tool when asked about weather. Do not invent weather data.",
      },
      { role: "user", content: prompt },
    ];

    // --- Turn 1: model may emit a toolCall -------------------------------------
    // Prefer the canonical events / final surface (not deprecated toolCallStream).
    console.log(`\n> ${prompt}\n`);
    const run = completion({
      modelId,
      history,
      stream: true,
      tools,
      generationParams: { temp: 0, seed: 42 },
    });

    for await (const event of run.events) {
      handleEvent(event);
    }

    const final = await run.final;
    if (final.toolCalls.length === 0) {
      console.error(
        "\n✗ Model did not emit a tool call.\n" +
          "  Small Instruct quants sometimes talk about tools instead of calling them.\n" +
          "  Retry, or try LLAMA_TOOL_CALLING_1B_INST_Q4_K with toolDialect: \"pythonic\".",
      );
      process.exitCode = 1;
      return;
    }

    // --- Execute tools (app-managed) -------------------------------------------
    // handler registration attaches invoke() on each ToolCall. You must call it.
    console.log("\n▸ Executing tools…");
    const toolContents: string[] = [];
    for (const call of final.toolCalls) {
      console.log(`  ${call.name}(${JSON.stringify(call.arguments)})`);
      if (!call.invoke) {
        console.error(`  ✗ No handler for "${call.name}"`);
        process.exitCode = 1;
        return;
      }
      const result = await call.invoke();
      const content = JSON.stringify(result);
      console.log(`  → ${content}`);
      toolContents.push(content);
    }

    // History schema is role + content only (no tool_call_id field in 0.15.0).
    history.push({ role: "assistant", content: final.contentText || final.raw.fullText });
    for (const content of toolContents) {
      history.push({ role: "tool", content });
    }

    // --- Turn 2: answer with tool results --------------------------------------
    console.log("\n▸ Follow-up:\n");
    const followUp = completion({
      modelId,
      history,
      stream: true,
      tools,
      generationParams: { temp: 0, seed: 42 },
    });
    for await (const event of followUp.events) {
      if (event.type === "contentDelta") process.stdout.write(event.text);
    }
    process.stdout.write("\n");

    const followStats = (await followUp.final).stats;
    if (followStats?.tokensPerSecond !== undefined) {
      console.log(
        `\n[${followStats.tokensPerSecond.toFixed(1)} tok/s · ${followStats.generatedTokens ?? "?"} tokens]`,
      );
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`\n✗ Recipe failed: ${msg}\n`);
    console.error(
      "Common causes:\n" +
        "  • Not enough RAM — Qwen3 1.7B Q4 wants ~3–4 GB free.\n" +
        "  • First run needs network for QWEN3_1_7B_INST_Q4 (~1.0 GB).\n" +
        "  • No tool call? Small Instruct models can be flaky; see README.\n" +
        "  • Want SDK logs? Set QVAC_CONFIG_PATH to a JSON with\n" +
        '    { "loggerLevel": "info", "loggerConsoleOutput": true } and re-run.',
    );
    process.exitCode = 1;
  } finally {
    if (modelId) await unloadModel({ modelId });
  }
}

function handleEvent(event: CompletionEvent): void {
  switch (event.type) {
    case "contentDelta":
      process.stdout.write(event.text);
      break;
    case "toolCall":
      console.log(
        `\n▸ Tool: ${event.call.name}(${JSON.stringify(event.call.arguments)})`,
      );
      break;
    case "toolError":
      console.log(`\n✖ Tool error [${event.error.code}]: ${event.error.message}`);
      break;
    default:
      break;
  }
}

await main();
