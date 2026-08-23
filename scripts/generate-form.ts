import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [, , rawName] = process.argv;

if (!rawName) {
  throw new Error("Usage: npm run generate -- form <name>");
}

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
  `${base}/views/${pascalName}Form.vue`,
  `<script setup lang="ts">\nimport BaseButton from "@/components/atomic/atoms/BaseButton.vue";\nimport TextInput from "@/components/atomic/atoms/TextInput.vue";\nimport FormField from "@/components/atomic/molecules/FormField.vue";\nimport type { FieldErrors } from "@core/form/field-errors";\nimport type { ${pascalName}Input } from "../schema/${kebabName}.schema";\n\nconst value = defineModel<${pascalName}Input>({ required: true });\ndefineProps<{\n  errors?: FieldErrors<keyof ${pascalName}Input & string>;\n  isSubmitting?: boolean;\n}>();\nconst emit = defineEmits<{ submit: [] }>();\n</script>\n\n<template>\n  <form class="grid gap-4" @submit.prevent="emit('submit')">\n    <FormField id="name" label="Name" :error="errors?.name" required>\n      <template #default="{ id, describedby, state }">\n        <TextInput v-model="value.name" :id="id" name="name" :aria-describedby="describedby" :state="state" />\n      </template>\n    </FormField>\n    <BaseButton type="submit" :disabled="isSubmitting">{{ isSubmitting ? "Saving" : "Save ${pascalName}" }}</BaseButton>\n  </form>\n</template>\n`,
);
write(
  `${base}/stories/${pascalName}Form.stories.ts`,
  `import { ref } from "vue";\nimport type { Meta, StoryObj } from "@storybook/vue3-vite";\nimport ${pascalName}Form from "../views/${pascalName}Form.vue";\nimport type { ${pascalName}Input } from "../schema/${kebabName}.schema";\n\nconst meta = {\n  title: "Forms/${pascalName}Form",\n  component: ${pascalName}Form,\n  render: () => ({\n    components: { ${pascalName}Form },\n    setup: () => ({ value: ref<${pascalName}Input>({ name: "${pascalName}" }) }),\n    template: \`<${pascalName}Form v-model="value" />\`,\n  }),\n} satisfies Meta<typeof ${pascalName}Form>;\n\nexport default meta;\n\ntype Story = StoryObj<typeof meta>;\n\nexport const Default: Story = {};\n`,
);

console.log(`Generated form: ${kebabName}`);
