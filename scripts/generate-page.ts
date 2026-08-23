import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [, , rawName, rawPreset = "list"] = process.argv;

if (!rawName) {
  throw new Error("Usage: npm run generate -- page <name> [list|detail|form|dashboard|settings]");
}

const preset = ["list", "detail", "form", "dashboard", "settings"].includes(rawPreset) ? rawPreset : "list";
const kebabName = rawName.replace(/([a-z])([A-Z])/g, "$1-$2").replace(/\s+/g, "-").toLowerCase();
const pascalName = kebabName
  .split("-")
  .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
  .join("");
const base = `src/app/modules/${kebabName}`;

function write(path: string, content: string) {
  mkdirSync(join(process.cwd(), path, ".."), { recursive: true });
  writeFileSync(join(process.cwd(), path), content);
}

write(
  `${base}/views/${pascalName}Page.vue`,
  `<script setup lang="ts">\nimport BaseCard from "@/components/atomic/atoms/BaseCard.vue";\nimport EmptyState from "@/components/atomic/organisms/EmptyState.vue";\nimport ErrorState from "@/components/atomic/organisms/ErrorState.vue";\nimport LoadingState from "@/components/atomic/organisms/LoadingState.vue";\n\nconst status: "idle" | "loading" | "success" | "error" = "success";\n</script>\n\n<template>\n  <section class="grid gap-5">\n    <header class="flex flex-wrap items-end justify-between gap-4">\n      <div>\n        <h1 class="m-0 text-2xl font-black text-slate-950">${pascalName}</h1>\n        <p class="m-0 mt-2 text-sm text-slate-500">Generated ${preset} page preset.</p>\n      </div>\n    </header>\n\n    <LoadingState v-if="status === 'idle' || status === 'loading'" label="Loading ${pascalName}" />\n    <ErrorState v-else-if="status === 'error'" title="${pascalName} failed" />\n    <BaseCard v-else>\n      <template #header>\n        <div>\n          <h2 class="m-0 text-lg font-bold text-slate-950">${pascalName} content</h2>\n          <p class="m-0 mt-1 text-sm text-slate-500">Connect DTO, mock data, and Pinia store here.</p>\n        </div>\n      </template>\n      <EmptyState title="No ${kebabName} data yet" description="Replace this generated shell with feature-specific UI." />\n    </BaseCard>\n  </section>\n</template>\n`,
);
write(
  `${base}/router/routes.ts`,
  `import type { RouteRecordRaw } from "vue-router";\n\nexport const ${kebabName.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase())}Routes: RouteRecordRaw[] = [\n  {\n    path: "",\n    name: "${kebabName}",\n    component: () => import("../views/${pascalName}Page.vue"),\n    meta: {\n      auth: true,\n      layout: "default",\n      permission: "${kebabName}:read",\n      title: "${pascalName}",\n    },\n  },\n];\n`,
);
write(
  `${base}/stories/${pascalName}Page.stories.ts`,
  `import type { Meta, StoryObj } from "@storybook/vue3-vite";\nimport ${pascalName}Page from "../views/${pascalName}Page.vue";\n\nconst meta = {\n  title: "Pages/${pascalName}",\n  component: ${pascalName}Page,\n} satisfies Meta<typeof ${pascalName}Page>;\n\nexport default meta;\n\ntype Story = StoryObj<typeof meta>;\n\nexport const Default: Story = {};\n`,
);
write(
  `${base}/PAGE_SPEC.md`,
  `# ${pascalName} Page\n\n- Type: ${preset}\n- Route: /${kebabName}\n- Auth: required\n- Permission: ${kebabName}:read\n- States: loading, empty, error, success\n- Layout: default\n`,
);

console.log(`Generated page: ${kebabName} (${preset})`);
