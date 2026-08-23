import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

type AtomicLayer = "atom" | "molecule" | "organism" | "template" | "adapter";

interface LayerConfig {
  directory: string;
  storyTitle: string;
}

const layerConfigs: Record<AtomicLayer, LayerConfig> = {
  atom: {
    directory: "atoms",
    storyTitle: "Design System/Generated/Atoms",
  },
  molecule: {
    directory: "molecules",
    storyTitle: "Design System/Generated/Molecules",
  },
  organism: {
    directory: "organisms",
    storyTitle: "Design System/Generated/Organisms",
  },
  template: {
    directory: "templates",
    storyTitle: "Design System/Generated/Templates",
  },
  adapter: {
    directory: "adapters",
    storyTitle: "Design System/Generated/Adapters",
  },
};

function printHelp() {
  console.log(`
Usage:
  npm run generate:component -- <layer> <ComponentName>

Layers:
  atom | molecule | organism | template | adapter

Example:
  npm run generate:component -- atom BaseIconButton
  npm run generate:component -- molecule SearchField
`);
}

function assertComponentName(name: string) {
  if (!/^[A-Z][A-Za-z0-9]*$/.test(name)) {
    throw new Error("ComponentName must be PascalCase, e.g. BaseIconButton.");
  }
}

function assertLayer(layer: string): asserts layer is AtomicLayer {
  if (!Object.keys(layerConfigs).includes(layer)) {
    throw new Error(`Unknown layer "${layer}".`);
  }
}

async function writeNewFile(filePath: string, content: string) {
  if (existsSync(filePath)) {
    throw new Error(`File already exists: ${filePath}`);
  }

  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, content, "utf-8");
}

function createComponentSource(name: string, layer: AtomicLayer) {
  const rootClass = name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase();

  if (layer === "adapter") {
    return `<script setup lang="ts">
defineProps<{
  title?: string;
}>();
</script>

<template>
  <div class="${rootClass}">
    <slot>{{ title ?? "${name}" }}</slot>
  </div>
</template>
`;
  }

  return `<script setup lang="ts">
withDefaults(
  defineProps<{
    disabled?: boolean;
  }>(),
  {
    disabled: false,
  }
);
</script>

<template>
  <div
    class="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-800"
    :class="disabled ? 'opacity-50' : ''"
  >
    <slot>${name}</slot>
  </div>
</template>
`;
}

function createStorySource(name: string, config: LayerConfig) {
  return `import type { Meta, StoryObj } from "@storybook/vue3";

import ${name} from "../${config.directory}/${name}.vue";

const meta = {
  title: "${config.storyTitle}/${name}",
  component: ${name},
  tags: ["autodocs"],
} satisfies Meta<typeof ${name}>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  render: (args) => ({
    components: { ${name} },
    setup() {
      return { args };
    },
    template: \`
      <${name} v-bind="args">
        ${name}
      </${name}>
    \`,
  }),
};
`;
}

function createTestSource(name: string) {
  return `import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import ${name} from "./${name}.vue";

describe("${name}", () => {
  it("renders default slot content", () => {
    const wrapper = mount(${name}, {
      slots: {
        default: "${name}",
      },
    });

    expect(wrapper.text()).toContain("${name}");
  });
});
`;
}

async function addExport(name: string, config: LayerConfig) {
  const indexPath = resolve("src/app/components/atomic/index.ts");
  const exportLine = `export { default as ${name} } from "./${config.directory}/${name}.vue";`;
  const current = await readFile(indexPath, "utf-8");

  if (current.includes(exportLine)) {
    return;
  }

  const next = `${exportLine}\n${current}`;
  await writeFile(indexPath, next, "utf-8");
}

async function main() {
  const [, , layerArg, nameArg] = process.argv;

  if (!layerArg || !nameArg || layerArg === "--help" || layerArg === "-h") {
    printHelp();
    return;
  }

  assertLayer(layerArg);
  assertComponentName(nameArg);

  const config = layerConfigs[layerArg];
  const componentPath = resolve(
    `src/app/components/atomic/${config.directory}/${nameArg}.vue`
  );
  const storyPath = resolve(`src/app/components/atomic/stories/${nameArg}.stories.ts`);
  const testPath = resolve(
    `src/app/components/atomic/${config.directory}/${nameArg}.spec.ts`
  );

  await writeNewFile(componentPath, createComponentSource(nameArg, layerArg));
  await writeNewFile(storyPath, createStorySource(nameArg, config));
  await writeNewFile(testPath, createTestSource(nameArg));
  await addExport(nameArg, config);

  console.log(`Created ${nameArg} component, story, spec, and export.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
