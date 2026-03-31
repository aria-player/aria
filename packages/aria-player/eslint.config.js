import { ignores, base, reactBrowser } from "@aria-player/config/eslint";

export default [
  ignores,
  { ignores: ["src-tauri/target/**"] },
  ...base,
  ...reactBrowser,
  {
    files: ["**/*.{ts,tsx}"],
  },
];
