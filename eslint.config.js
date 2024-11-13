import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginPrettierRecommended from "eslint-plugin-prettier/recommended";

export default [
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  pluginPrettierRecommended,
  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        project: ["./tsconfig.json", "./tsconfig.node.json"]
      }
    },
    plugins: {
      "react-hooks": pluginReactHooks
    },
    rules: {
      ...pluginReactHooks.configs.recommended.rules,
      semi: ["error", "always"],
      "react/react-in-jsx-scope": "off",
      "@typescript-eslint/no-deprecated": "error"
    },
    settings: {
      react: {
        version: "detect"
      }
    }
  },
  {
    files: ["eslint.config.js"],
    parserOptions: {
      sourceType: "script"
    }
  }
];
