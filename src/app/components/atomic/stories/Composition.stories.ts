import type { Meta, StoryObj } from "@storybook/vue3";

import BaseButton from "../atoms/BaseButton.vue";
import BaseDropdown from "../molecules/BaseDropdown.vue";
import BasePagination from "../molecules/BasePagination.vue";
import BaseTabs from "../molecules/BaseTabs.vue";
import BaseModal from "../organisms/BaseModal.vue";

const meta = {
  title: "Design System/Composition",
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const TabsDropdownPagination: Story = {
  render: () => ({
    components: { BaseDropdown, BasePagination, BaseTabs },
    data: () => ({
      activeTab: "overview",
      page: 2,
      actions: [
        { label: "Edit", value: "edit" },
        { label: "Duplicate", value: "duplicate" },
        { label: "Delete", value: "delete", danger: true },
      ],
      tabs: [
        { label: "Overview", value: "overview" },
        { label: "Settings", value: "settings" },
        { label: "History", value: "history" },
      ],
    }),
    template: `
      <div class="grid gap-6">
        <BaseTabs v-model="activeTab" :items="tabs">
          <template #default="{ active }">
            <div class="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
              Active tab: <strong>{{ active }}</strong>
            </div>
          </template>
        </BaseTabs>
        <BaseDropdown label="Actions" :items="actions" />
        <BasePagination v-model:page="page" :total="96" :page-size="10" />
      </div>
    `,
  }),
};

export const ModalShell: Story = {
  render: () => ({
    components: { BaseButton, BaseModal },
    data: () => ({ open: false }),
    template: `
      <div>
        <BaseButton @click="open = true">Open modal</BaseButton>
        <BaseModal v-model:open="open" title="Reusable modal" description="Only the inner content changes.">
          <template #default="{ close }">
            <p class="m-0 text-sm text-slate-700">
              This shell is shared. Feature content can be injected by slot or adapter host.
            </p>
            <div class="mt-4 flex justify-end">
              <BaseButton variant="outline" @click="close">Close</BaseButton>
            </div>
          </template>
        </BaseModal>
      </div>
    `,
  }),
};
