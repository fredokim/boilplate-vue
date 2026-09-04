import { computed, ref } from "vue";
import type { Meta, StoryObj } from "@storybook/vue3";

import BaseBadge from "../atoms/BaseBadge.vue";
import BaseScrollArea from "../molecules/BaseScrollArea.vue";
import BasePagination from "../molecules/BasePagination.vue";
import BaseTable from "../organisms/BaseTable.vue";
import InfiniteScrollList from "../organisms/InfiniteScrollList.vue";
import PaginatedTable from "../organisms/PaginatedTable.vue";

const meta = {
  title: "Design System/Data Display",
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const columns = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "status", label: "Status" },
  { key: "role", label: "Role", align: "right" as const },
];

const rows = Array.from({ length: 36 }, (_, index) => ({
  id: String(index + 1),
  name: `User ${index + 1}`,
  email: `user${index + 1}@example.com`,
  status: index % 3 === 0 ? "pending" : "active",
  role: index % 4 === 0 ? "Admin" : "Member",
}));

export const Table: Story = {
  render: () => ({
    components: { BaseBadge, BaseTable },
    setup() {
      return {
        columns,
        rows: rows.slice(0, 5),
      };
    },
    template: `
      <BaseTable :columns="columns" :rows="rows" row-key="id">
        <template #cell-status="{ value }">
          <BaseBadge :tone="value === 'active' ? 'success' : 'warning'">
            {{ value }}
          </BaseBadge>
        </template>
      </BaseTable>
    `,
  }),
};

export const EmptyTable: Story = {
  render: () => ({
    components: { BaseTable },
    setup() {
      return { columns };
    },
    template: `
      <BaseTable :columns="columns" :rows="[]" empty-text="No users found" />
    `,
  }),
};

export const PaginationOnly: Story = {
  render: () => ({
    components: { BasePagination },
    setup() {
      const page = ref(4);

      return { page };
    },
    template: `
      <div class="grid gap-3">
        <p class="m-0 text-sm text-slate-500">Current page: {{ page }}</p>
        <BasePagination v-model:page="page" :total="240" :page-size="10" />
      </div>
    `,
  }),
};

export const PaginatedTableComposition: Story = {
  render: () => ({
    components: { BaseBadge, PaginatedTable },
    setup() {
      const page = ref(1);

      return {
        columns,
        page,
        rows,
      };
    },
    template: `
      <PaginatedTable
        v-model:page="page"
        :columns="columns"
        :rows="rows"
        row-key="id"
        :page-size="8"
      >
        <template #cell-status="{ value }">
          <BaseBadge :tone="value === 'active' ? 'success' : 'warning'">
            {{ value }}
          </BaseBadge>
        </template>
      </PaginatedTable>
    `,
  }),
};

export const ScrollArea: Story = {
  render: () => ({
    components: { BaseScrollArea },
    setup() {
      return {
        items: Array.from({ length: 24 }, (_, index) => `Scrollable item ${index + 1}`),
      };
    },
    template: `
      <BaseScrollArea max-height="18rem">
        <ul class="m-0 grid list-none divide-y divide-slate-100 p-0">
          <li v-for="item in items" :key="item" class="px-4 py-3 text-sm text-slate-700">
            {{ item }}
          </li>
        </ul>
      </BaseScrollArea>
    `,
  }),
};

export const InfiniteScrollWithMemoryCap: Story = {
  render: () => ({
    components: { InfiniteScrollList },
    setup() {
      const page = ref(1);
      const isLoading = ref(false);
      const items = ref(
        Array.from({ length: 20 }, (_, index) => ({
          id: index + 1,
          title: `Activity ${index + 1}`,
          body: "Retained rendering is capped to reduce long-list memory pressure.",
        }))
      );
      const hasMore = computed(() => page.value < 5);

      async function loadMore() {
        if (isLoading.value || !hasMore.value) {
          return;
        }

        isLoading.value = true;

        await new Promise((resolve) => window.setTimeout(resolve, 350));

        const start = items.value.length + 1;
        items.value = [
          ...items.value,
          ...Array.from({ length: 10 }, (_, index) => ({
            id: start + index,
            title: `Activity ${start + index}`,
            body: "Observer cleanup runs on unmount and rendered items are capped.",
          })),
        ];
        page.value += 1;
        isLoading.value = false;
      }

      return {
        hasMore,
        isLoading,
        items,
        loadMore,
      };
    },
    template: `
      <InfiniteScrollList
        :items="items"
        :has-more="hasMore"
        :is-loading="isLoading"
        :max-items="30"
        max-height="22rem"
        @load-more="loadMore"
      >
        <template #default="{ item }">
          <article class="grid gap-1">
            <h3 class="m-0 text-sm font-semibold text-slate-950">{{ item.title }}</h3>
            <p class="m-0 text-sm text-slate-500">{{ item.body }}</p>
          </article>
        </template>
      </InfiniteScrollList>
    `,
  }),
};

