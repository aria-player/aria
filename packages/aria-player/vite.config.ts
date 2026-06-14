import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import { readFileSync } from "node:fs";
import packageJson from "./package.json";
import typesPackageJson from "../types/package.json";

function include404Fallback(basePath: string): Plugin {
  return {
    name: "include-404-fallback",
    apply: "build",
    generateBundle() {
      if (basePath === "/") return;
      this.emitFile({
        type: "asset",
        fileName: "404.html",
        source: readFileSync(new URL("./404.html", import.meta.url), "utf-8"),
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(async () => {
  const basePath = process.env.VITE_BASEPATH || "/";
  return {
    base: basePath,
    plugins: [react(), svgr(), include404Fallback(basePath)],
    define: {
      "import.meta.env.PACKAGE_VERSION": JSON.stringify(packageJson.version),
      "import.meta.env.TYPES_PACKAGE_VERSION": JSON.stringify(
        typesPackageJson.version
      ),
    },
    // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
    //
    // 1. prevent vite from obscuring rust errors
    clearScreen: false,
    // 2. tauri expects a fixed port, fail if that port is not available
    server: {
      port: 1420,
      strictPort: true,
    },
    // 3. to make use of `TAURI_DEBUG` and other env variables
    // https://tauri.app/v1/api/config#buildconfig.beforedevcommand
    envPrefix: ["VITE_", "TAURI_DEBUG"],
    test: {
      globals: true,
      server: {
        deps: { inline: ["soprano-ui"] },
      },
      environment: "jsdom",
      setupFiles: "src/setupTests",
    },
    worker: {
      rollupOptions: {
        output: {
          inlineDynamicImports: true,
        },
      },
    },
  };
});
