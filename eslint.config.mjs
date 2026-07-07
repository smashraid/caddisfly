import js from "@eslint/js";
import tseslint from "typescript-eslint";
import importPlugin from "eslint-plugin-import";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      import: importPlugin,
    },
    rules: {
      "import/extensions": ["error", "always", { ignorePackages: true }],
    },
  }
);