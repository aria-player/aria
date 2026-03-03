import { UserConfig, defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import dts from "vite-plugin-dts";
import { libInjectCss } from "vite-plugin-lib-inject-css";

export default defineConfig({
  plugins: [
    react(),
    dts({ include: "src" }),
    libInjectCss(),
  ] as UserConfig["plugins"],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["src/setupTests.ts"],
  },
  build: {
    copyPublicDir: false,
    lib: {
      entry: resolve(__dirname, "src/soprano-ui.ts"),
      name: "SopranoUI",
      fileName: "soprano-ui",
    },
    rollupOptions: {
      external: ["react", "react-dom"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
      },
    },
  },
});
