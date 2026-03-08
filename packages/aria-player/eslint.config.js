import { ignores, base, reactBrowser } from "@aria-player/config/eslint";

export default [
  ignores,
  ...base,
  ...reactBrowser,
  {
    files: ["**/*.{ts,tsx}"],
    rules: { "@typescript-eslint/no-deprecated": "error" },
  },
];
