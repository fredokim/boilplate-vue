import { ref } from "vue";
import type { Meta, StoryObj } from "@storybook/vue3";

import TextInput from "../atoms/TextInput.vue";
import FormField from "../molecules/FormField.vue";
import FormShell from "../organisms/FormShell.vue";

const meta = {
  title: "Design System/Forms/Shell",
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: () => ({
    components: { FormField, FormShell, TextInput },
    setup() {
      const name = ref("Example");
      const submitting = ref(false);

      return { name, submitting };
    },
    template: `
      <FormShell
        title="Create item"
        description="Shared shell for create and edit forms."
        submit-label="Create"
        :submitting="submitting"
      >
        <FormField id="name" label="Name" required>
          <template #default="{ id, describedby, state }">
            <TextInput
              v-model="name"
              :id="id"
              :aria-describedby="describedby"
              :state="state"
              required
            />
          </template>
        </FormField>
      </FormShell>
    `,
  }),
};

