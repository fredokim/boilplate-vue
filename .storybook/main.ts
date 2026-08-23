import { fileURLToPath, URL } from "node:url";
import { mergeConfig } from "vite";
import type { StorybookConfig } from "@storybook/vue3-vite";

const config: StorybookConfig = {
  stories: [
    "../src/app/components/atomic/**/*.stories.@(ts|mdx)",
    "../src/app/modules/**/*.stories.@(ts|mdx)",
  ],
  addons: ["@storybook/addon-docs"],
  framework: {
    name: "@storybook/vue3-vite",
    options: {},
  },
  viteFinal: async (baseConfig) =>
    mergeConfig(baseConfig, {
      build: {
        chunkSizeWarningLimit: 1600,
      },
      resolve: {
        alias: {
          "@": fileURLToPath(new URL("../src/app", import.meta.url)),
          "@core": fileURLToPath(new URL("../src/core", import.meta.url)),
          "@shared": fileURLToPath(new URL("../src/app/shared", import.meta.url)),
          "@dto": fileURLToPath(new URL("../src/app/dto", import.meta.url)),
          "@modules": fileURLToPath(new URL("../src/app/modules", import.meta.url)),
          "@layouts": fileURLToPath(new URL("../src/app/layouts", import.meta.url)),
          "@router": fileURLToPath(new URL("../src/app/router", import.meta.url)),
          "@store": fileURLToPath(new URL("../src/app/store", import.meta.url)),
        },
      },
    }),
};

export default config;
