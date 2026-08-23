/// <reference types="vitest" />

import { fileURLToPath, URL } from "node:url";

import vue from "@vitejs/plugin-vue";
import type { Plugin } from "vite";
import { defineConfig } from "vitest/config";
import emitMetadata from "vite-plugin-emit-metadata";
import { visualizer } from "rollup-plugin-visualizer";

function resolvePath(path: string) {
  return fileURLToPath(new URL(path, import.meta.url));
}

const shouldAnalyzeBundle = process.env.ANALYZE === "true";

export default defineConfig({
  plugins: [
    vue(),
    emitMetadata() as unknown as Plugin,
    shouldAnalyzeBundle
      ? (visualizer({
          filename: "reports/bundle/stats.html",
          gzipSize: true,
          open: false,
          template: "treemap",
        }) as Plugin)
      : null,
  ].filter((plugin): plugin is Plugin => Boolean(plugin)),
  resolve: {
    alias: {
      "@": resolvePath("./src/app"),
      "@core": resolvePath("./src/core"),
      "@shared": resolvePath("./src/app/shared"),
      "@dto": resolvePath("./src/app/dto"),
      "@modules": resolvePath("./src/app/modules"),
      "@layouts": resolvePath("./src/app/layouts"),
      "@router": resolvePath("./src/app/router"),
      "@store": resolvePath("./src/app/store"),
    },
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
  },
  preview: {
    host: "127.0.0.1",
    port: 4173,
    strictPort: true,
  },
  optimizeDeps: {
    include: ["axios", "pinia", "vue", "vue-router"],
  },
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          vue: ["vue", "vue-router", "pinia"],
          api: ["axios", "class-transformer", "class-validator", "reflect-metadata"],
          // The graph canvas and its layout engine are only used by the topology
          // module, so they stay out of that module's own route chunk.
          graph: ["@vue-flow/core", "@vue-flow/background", "@vue-flow/controls", "@dagrejs/dagre"],
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.spec.ts"],
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: [
        "dist/**",
        "storybook-static/**",
        "src/**/*.stories.ts",
        "src/test/**",
      ],
    },
    exclude: ["tests/performance/**"],
  },
});
