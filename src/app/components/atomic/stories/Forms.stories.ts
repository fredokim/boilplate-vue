import type { Meta, StoryObj } from "@storybook/vue3";

import BaseCheckbox from "../atoms/BaseCheckbox.vue";
import BaseRadioGroup from "../atoms/BaseRadioGroup.vue";
import BaseSelect from "../atoms/BaseSelect.vue";
import BaseTextarea from "../atoms/BaseTextarea.vue";
import PasswordInput from "../atoms/PasswordInput.vue";
import TextInput from "../atoms/TextInput.vue";
import ControlledTextField from "../adapters/ControlledTextField.vue";
import FormField from "../molecules/FormField.vue";

const meta = {
  title: "Design System/Forms",
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const roleOptions = [
  { label: "Admin", value: "admin" },
  { label: "Manager", value: "manager" },
  { label: "Member", value: "member" },
];

export const Inputs: Story = {
  render: () => ({
    components: {
      BaseCheckbox,
      BaseRadioGroup,
      BaseSelect,
      BaseTextarea,
      FormField,
      PasswordInput,
      TextInput,
    },
    data: () => ({
      agreed: true,
      email: "",
      memo: "",
      password: "",
      role: "",
      roles: roleOptions,
    }),
    template: `
      <div class="grid w-[420px] gap-4">
        <FormField id="email" label="Email" description="Used for account notification.">
          <template #default="{ id, describedby, state }">
            <TextInput v-model="email" :id="id" :aria-describedby="describedby" :state="state" placeholder="name@example.com" />
          </template>
        </FormField>

        <FormField id="password" label="Password" required>
          <template #default="{ id, describedby, state }">
            <PasswordInput v-model="password" :id="id" :aria-describedby="describedby" :state="state" placeholder="Password" />
          </template>
        </FormField>

        <FormField id="role" label="Role">
          <template #default="{ id, describedby, state }">
            <BaseSelect v-model="role" :id="id" :aria-describedby="describedby" :state="state" :options="roles" placeholder="Select role" />
          </template>
        </FormField>

        <BaseRadioGroup v-model="role" name="role-radio" direction="horizontal" :options="roles" />
        <BaseTextarea v-model="memo" placeholder="Memo" />
        <BaseCheckbox v-model="agreed" label="I agree" description="Checkbox keeps no business logic." />
      </div>
    `,
  }),
};

export const ControlledField: Story = {
  render: () => ({
    components: { ControlledTextField },
    data: () => ({
      value: "",
      validator: (nextValue: string | null) =>
        nextValue && nextValue.length >= 3 ? null : "Enter at least 3 characters.",
    }),
    template: `
      <div class="w-[420px]">
        <ControlledTextField
          v-model="value"
          id="controlled-name"
          label="Name"
          description="Validation is provided by an adapter."
          :validator="validator"
        />
      </div>
    `,
  }),
};
