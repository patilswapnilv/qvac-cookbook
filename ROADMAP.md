# Roadmap

This roadmap records intended cookbook coverage without promising delivery
dates. A recipe is marked ready in the root README only after its code,
documentation, and local inference flow have been verified.

## Next recipes

- **Vision and OCR** — extract text or describe a local image with a multimodal
  model.
- **OpenAI-compatible local server** — expose a local model to existing
  OpenAI-compatible clients.
- **P2P delegated inference** — delegate inference to a trusted peer and explain
  the privacy and availability trade-offs.
- **Voice-notes capstone** — combine transcription, completion, and speech
  synthesis in one small local-first application.

## Candidates

- LoRA fine-tuning
- Diffusion image generation
- Bare or Expo mobile runtime
- `@qvac/ai-sdk-provider` integration

## How priorities are chosen

Proposals are evaluated by:

1. whether they demonstrate a distinct QVAC capability;
2. whether they can remain small and independently runnable;
3. whether model and hardware requirements are reasonable for contributors;
4. whether the SDK surface can be verified from types, source, or official docs;
5. whether sample inputs can be redistributed safely.

To propose or implement a recipe, follow
[`CONTRIBUTING.md`](./CONTRIBUTING.md) and open an issue before doing substantial
work.
