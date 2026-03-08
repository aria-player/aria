import js from "@eslint/js";
import globals from "globals";
import prettier from "eslint-config-prettier";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export const ignores = {
  ignores: [
    "**/dist/**",
    "**/node_modules/**",
    "**/vite.config.ts",
    "**/.storybook/**",
    "**/postcss.config.cjs",
  ],
};

export const base = [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  reactHooks.configs.flat.recommended,
  prettier,
];

export const reactBrowser = [
  {
    files: ["**/*.{ts,tsx,js,mjs,jsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: { react },
    rules: {
      ...react.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
    },
    settings: { react: { version: "18.3" } },
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: { project: true },
    },
  },
];
