import { defineConfig, globalIgnores } from "eslint/config";
import reactRefresh from "eslint-plugin-react-refresh";
import storybook from "eslint-plugin-storybook";
import { ignores, base, reactBrowser } from "@aria-player/config/eslint";

export default defineConfig([
  globalIgnores(["dist"]),
  ignores,
  ...base,
  ...reactBrowser,
  reactRefresh.configs.vite,
  ...storybook.configs["flat/recommended"],
  {
    files: ["**/*.{ts,tsx}"],
    rules: { "react/display-name": "off" },
  },
]);
