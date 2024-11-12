import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import packageJson from "./package.json";

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [react(), svgr()],
  define: {
    "import.meta.env.PACKAGE_VERSION": JSON.stringify(packageJson.version)
  },
  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true
  },
  // 3. to make use of `TAURI_DEBUG` and other env variables
  // https://tauri.app/v1/api/config#buildconfig.beforedevcommand
  envPrefix: ["VITE_", "TAURI_DEBUG"],
  test: {
    globals: true,
    server: {
      deps: { inline: ["soprano-ui"] }
    },
    environment: "jsdom",
    setupFiles: "src/setupTests"
  },
  worker: {
    rollupOptions: {
      output: {
        inlineDynamicImports: true
      }
    }
  }
}));
