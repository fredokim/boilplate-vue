import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [, , rawName] = process.argv;

if (!rawName) {
  throw new Error("Usage: npm run generate -- layout <name>");
}

const kebabName = rawName.replace(/([a-z])([A-Z])/g, "$1-$2").replace(/\s+/g, "-").toLowerCase();
const pascalName = kebabName
  .split("-")
  .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
  .join("");

function write(path: string, content: string) {
  mkdirSync(join(process.cwd(), path, ".."), { recursive: true });
  writeFileSync(join(process.cwd(), path), content);
}

write(
  `src/app/layouts/${pascalName}Layout.vue`,
  `<script setup lang="ts">\ndefineProps<{\n  title: string;\n  description?: string;\n}>();\n</script>\n\n<template>\n  <section class="grid gap-5">\n    <header class="flex flex-wrap items-end justify-between gap-4">\n      <div>\n        <h1 class="m-0 text-2xl font-black text-slate-950">{{ title }}</h1>\n        <p v-if="description" class="m-0 mt-2 text-sm text-slate-500">{{ description }}</p>\n      </div>\n      <slot name="actions" />\n    </header>\n    <div v-if="$slots.toolbar" class="rounded-md border border-slate-200 bg-white p-4">\n      <slot name="toolbar" />\n    </div>\n    <slot />\n  </section>\n</template>\n`,
);
write(
  `src/app/layouts/${pascalName}Layout.stories.ts`,
  `import type { Meta, StoryObj } from "@storybook/vue3-vite";\nimport ${pascalName}Layout from "./${pascalName}Layout.vue";\n\nconst meta = {\n  title: "Layouts/${pascalName}Layout",\n  component: ${pascalName}Layout,\n  args: {\n    title: "${pascalName}",\n    description: "Generated responsive page layout shell.",\n  },\n  render: (args) => ({\n    components: { ${pascalName}Layout },\n    setup: () => ({ args }),\n    template: \`<${pascalName}Layout v-bind="args"><template #toolbar>Toolbar slot</template><div class="rounded-md border border-slate-200 bg-white p-5">Content slot</div></${pascalName}Layout>\`,\n  }),\n} satisfies Meta<typeof ${pascalName}Layout>;\n\nexport default meta;\n\ntype Story = StoryObj<typeof meta>;\n\nexport const Default: Story = {};\n`,
);

console.log(`Generated layout: ${kebabName}`);
