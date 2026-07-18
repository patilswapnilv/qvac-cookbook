// Flat ESLint config (ESLint 9). Kept intentionally small: the SDK's own types
// carry correctness, so lint here just guards obvious mistakes and dead code.
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["node_modules/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { process: "readonly", console: "readonly" },
    },
  },
);
