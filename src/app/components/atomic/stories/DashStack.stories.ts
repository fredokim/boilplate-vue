import type { Meta, StoryObj } from "@storybook/vue3";

import BaseBadge from "../atoms/BaseBadge.vue";
import BaseButton from "../atoms/BaseButton.vue";
import BaseIconButton from "../atoms/BaseIconButton.vue";
import BaseSkeleton from "../atoms/BaseSkeleton.vue";
import BaseSpinner from "../atoms/BaseSpinner.vue";
import SearchInput from "../atoms/SearchInput.vue";
import BaseBreadcrumbs from "../molecules/BaseBreadcrumbs.vue";
import MetricCard from "../molecules/MetricCard.vue";
import BaseTable from "../organisms/BaseTable.vue";
import DashboardShell from "../organisms/DashboardShell.vue";
import DataToolbar from "../organisms/DataToolbar.vue";

const meta = {
  title: "Design System/DashStack",
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const navItems = [
  { label: "Dashboard", value: "dashboard" },
  { label: "Products", value: "products" },
  { label: "Favorites", value: "favorites" },
  { label: "Inbox", value: "inbox" },
  { label: "Order Lists", value: "orders" },
  { label: "Product Stock", value: "stock" },
];

const columns = [
  { key: "name", label: "Product Name" },
  { key: "category", label: "Category" },
  { key: "price", label: "Price", align: "right" },
  { key: "status", label: "Status", align: "center" },
];

const rows = [
  { id: "1", name: "Apple Watch", category: "Digital Product", price: "$120.00", status: "Active" },
  { id: "2", name: "Camera Lens", category: "Accessories", price: "$89.00", status: "Pending" },
  { id: "3", name: "Nike Air Max", category: "Fashion", price: "$240.00", status: "Active" },
];

export const AdminDashboard: Story = {
  render: () => ({
    components: {
      BaseBadge,
      BaseTable,
      BaseBreadcrumbs,
      DashboardShell,
      DataToolbar,
      MetricCard,
    },
    data: () => ({
      active: "dashboard",
      columns,
      navItems,
      rows,
      search: "",
    }),
    template: `
      <DashboardShell v-model:active="active" v-model:search="search" title="Dashboard" :nav-items="navItems">
        <template #breadcrumb>
          <BaseBreadcrumbs :items="[{ label: 'Home', to: '#' }, { label: 'Dashboard' }]" />
        </template>

        <div class="grid gap-6">
          <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Total User" value="40,689" trend="8.5%" helper="Up from yesterday" />
            <MetricCard label="Total Order" value="10,293" trend="1.3%" helper="Up from past week" trend-tone="success" />
            <MetricCard label="Total Sales" value="$89,000" trend="4.3%" helper="Down from yesterday" trend-tone="error" />
            <MetricCard label="Total Pending" value="2,040" trend="1.8%" helper="Up from yesterday" trend-tone="warning" />
          </section>

          <DataToolbar v-model:search="search" title="Product Stock" description="DashStack-inspired table toolbar." action-label="Add product" />

          <BaseTable :columns="columns" :rows="rows" row-key="id">
            <template #cell-status="{ value }">
              <BaseBadge :tone="value === 'Active' ? 'success' : 'warning'">{{ value }}</BaseBadge>
            </template>
          </BaseTable>
        </div>
      </DashboardShell>
    `,
  }),
};

export const UtilityAtoms: Story = {
  render: () => ({
    components: {
      BaseButton,
      BaseIconButton,
      BaseSkeleton,
      BaseSpinner,
      SearchInput,
    },
    data: () => ({
      search: "",
    }),
    template: `
      <div class="grid w-[520px] gap-5 rounded-2xl bg-background p-6">
        <div class="flex items-center gap-3">
          <SearchInput v-model="search" class="flex-1" />
          <BaseIconButton label="Filter" variant="outline">F</BaseIconButton>
          <BaseIconButton label="Refresh" tone="primary">R</BaseIconButton>
        </div>
        <div class="flex items-center gap-3">
          <BaseButton>Primary action</BaseButton>
          <BaseSpinner />
        </div>
        <div class="grid gap-3 rounded-xl border border-slate-200 bg-white p-5">
          <BaseSkeleton />
          <BaseSkeleton />
          <BaseSkeleton shape="block" />
        </div>
      </div>
    `,
  }),
};
