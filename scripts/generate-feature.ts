import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

function printHelp() {
  console.log(`
Usage:
  npm run generate:feature -- <feature> [ResourceName]

Examples:
  npm run generate:feature -- order Order
  npm run generate:feature -- user-profile UserProfile
`);
}

function assertFeatureName(name: string) {
  if (!/^[a-z][a-z0-9-]*$/.test(name)) {
    throw new Error("feature must be kebab-case or lowercase, e.g. order-list.");
  }
}

function assertPascalName(name: string) {
  if (!/^[A-Z][A-Za-z0-9]*$/.test(name)) {
    throw new Error("ResourceName must be PascalCase, e.g. Order.");
  }
}

function toPascalCase(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join("");
}

function toCamelCase(value: string) {
  const pascal = toPascalCase(value);
  return `${pascal.charAt(0).toLowerCase()}${pascal.slice(1)}`;
}

function toTitle(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

async function writeNewFile(filePath: string, content: string) {
  if (existsSync(filePath)) {
    throw new Error(`File already exists: ${filePath}`);
  }

  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, content, "utf-8");
}

function createDtoSource(resourceName: string) {
  return `import "reflect-metadata";
import { IsString } from "class-validator";

export class ${resourceName}Dto {
  @IsString()
  id!: string;

  @IsString()
  name!: string;
}

export interface Create${resourceName}Request {
  name: string;
}
`;
}

function createApiSource(feature: string, resourceName: string) {
  const camel = toCamelCase(resourceName);

  return `import { apiClient } from "@core/api";

import { ${resourceName}Dto } from "../dto/${resourceName}.dto";
import type { Create${resourceName}Request } from "../dto/${resourceName}.dto";

const basePath = "/api/${feature}";

export function fetch${resourceName}(id: string) {
  return apiClient.get(\`\${basePath}/\${id}\`, ${resourceName}Dto);
}

export function create${resourceName}(body: Create${resourceName}Request) {
  return apiClient.post(basePath, body, ${resourceName}Dto);
}

export const ${camel}Api = {
  create: create${resourceName},
  fetch: fetch${resourceName},
};
`;
}

function createStoreSource(feature: string, resourceName: string) {
  const camel = toCamelCase(resourceName);
  const title = toTitle(feature);

  return `import { defineStore } from "pinia";
import { computed, ref } from "vue";

import { isTypedApiError } from "@core/api";
import type { LoadState, StoreFailure } from "@store/types";
import { ${camel}Api } from "../api/${feature}.api";
import type { ${resourceName}Dto } from "../dto/${resourceName}.dto";

export const use${resourceName}Store = defineStore("${feature}", () => {
  const item = ref<${resourceName}Dto | null>(null);
  const status = ref<LoadState>("idle");
  const failure = ref<StoreFailure | null>(null);
  const title = ref("${title}");

  const isLoading = computed(() => status.value === "loading");

  async function load(id: string) {
    status.value = "loading";
    failure.value = null;

    try {
      item.value = await ${camel}Api.fetch(id);
      status.value = "success";
    } catch (error) {
      status.value = "error";
      failure.value = isTypedApiError(error)
        ? {
            code: \`\${error.origin}:\${error.kind}\`,
            kind: error.kind,
            message: error.message,
            origin: error.origin,
          }
        : {
            kind: "unknown",
            message: "Unknown ${title} loading error.",
            origin: "frontend",
          };
    }
  }

  function useDemo() {
    item.value = {
      id: "demo",
      name: "${title} Demo",
    };
    status.value = "success";
    failure.value = null;
  }

  return {
    failure,
    isLoading,
    item,
    load,
    status,
    title,
    useDemo,
  };
});
`;
}

function createViewSource(feature: string, resourceName: string) {
  return `<script setup lang="ts">
import { storeToRefs } from "pinia";

import BaseButton from "@/components/atomic/atoms/BaseButton.vue";
import BaseCard from "@/components/atomic/atoms/BaseCard.vue";
import ResultBoundary from "@/components/atomic/organisms/ResultBoundary.vue";
import { use${resourceName}Store } from "../store/${feature}.store";

const store = use${resourceName}Store();
const { failure, isLoading, item, status, title } = storeToRefs(store);
</script>

<template>
  <section class="grid gap-4">
    <BaseCard>
      <template #header>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 class="m-0 text-xl font-bold text-slate-950">{{ title }}</h1>
            <p class="m-0 mt-1 text-sm text-slate-500">
              Generated feature module.
            </p>
          </div>
          <BaseButton :disabled="isLoading" @click="store.useDemo">
            Use demo
          </BaseButton>
        </div>
      </template>

      <ResultBoundary
        :status="status"
        :failure="failure"
        :empty="!item"
        empty-title="No item loaded"
        empty-description="Use demo data or request the API."
        @retry="store.load('demo')"
      >
        <pre class="m-0 rounded-md bg-slate-950 p-4 text-sm text-white">{{ item }}</pre>
      </ResultBoundary>
    </BaseCard>
  </section>
</template>
`;
}

function createRoutesSource(feature: string, resourceName: string) {
  const title = toTitle(feature);

  return `import type { RouteRecordRaw } from "vue-router";

export const ${toCamelCase(feature)}Routes: RouteRecordRaw[] = [
  {
    path: "",
    name: "${feature}-home",
    component: () => import("../views/${resourceName}View.vue"),
    meta: {
      auth: true,
      layout: "default",
      permission: "${feature}:read",
      title: "${title}",
    },
  },
];
`;
}

function createStorySource(resourceName: string) {
  return `import type { Meta, StoryObj } from "@storybook/vue3";

import ${resourceName}View from "../views/${resourceName}View.vue";

const meta = {
  title: "Features/${resourceName}",
  component: ${resourceName}View,
  tags: ["autodocs"],
} satisfies Meta<typeof ${resourceName}View>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
`;
}

function createSpecSource(feature: string, resourceName: string) {
  return `import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";

import { use${resourceName}Store } from "../store/${feature}.store";

describe("${feature} store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("sets demo data", () => {
    const store = use${resourceName}Store();

    store.useDemo();

    expect(store.item?.id).toBe("demo");
    expect(store.status).toBe("success");
  });
});
`;
}

function createReadme(feature: string, resourceName: string) {
  return `# ${toTitle(feature)} Module

Generated complete feature scaffold.

## Files

- \`dto/${resourceName}.dto.ts\`
- \`api/${feature}.api.ts\`
- \`store/${feature}.store.ts\`
- \`views/${resourceName}View.vue\`
- \`router/routes.ts\`
- \`stories/${resourceName}.stories.ts\`
- \`__tests__/${feature}.store.spec.ts\`

Use \`ResultBoundary\` for loading, empty, and typed API failure states.
`;
}

async function main() {
  const [, , featureArg, resourceArg] = process.argv;

  if (!featureArg || featureArg === "--help" || featureArg === "-h") {
    printHelp();
    return;
  }

  assertFeatureName(featureArg);
  const resourceName = resourceArg ?? toPascalCase(featureArg);
  assertPascalName(resourceName);

  const basePath = `src/app/modules/${featureArg}`;

  await writeNewFile(resolve(`${basePath}/dto/${resourceName}.dto.ts`), createDtoSource(resourceName));
  await writeNewFile(resolve(`${basePath}/api/${featureArg}.api.ts`), createApiSource(featureArg, resourceName));
  await writeNewFile(resolve(`${basePath}/store/${featureArg}.store.ts`), createStoreSource(featureArg, resourceName));
  await writeNewFile(resolve(`${basePath}/views/${resourceName}View.vue`), createViewSource(featureArg, resourceName));
  await writeNewFile(resolve(`${basePath}/router/routes.ts`), createRoutesSource(featureArg, resourceName));
  await writeNewFile(resolve(`${basePath}/stories/${resourceName}.stories.ts`), createStorySource(resourceName));
  await writeNewFile(resolve(`${basePath}/__tests__/${featureArg}.store.spec.ts`), createSpecSource(featureArg, resourceName));
  await writeNewFile(resolve(`${basePath}/README.md`), createReadme(featureArg, resourceName));

  console.log(`Created complete feature module "${featureArg}" with ${resourceName}.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
