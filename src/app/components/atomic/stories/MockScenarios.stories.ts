import type { Meta, StoryObj } from "@storybook/vue3-vite";

import { mockRegistry } from "../../../../test/msw/mock-registry";

const MockScenarioMatrix = {
  setup: () => ({
    mockRegistry,
    getScenarios: (entry: (typeof mockRegistry)[number]) =>
      ["success", "empty", "invalid", "error"].filter((key) => key in entry).join(", "),
  }),
  template: `
    <div class="overflow-hidden rounded-lg border border-line bg-white">
      <table class="w-full border-collapse text-left text-sm">
        <thead class="bg-surface text-xs font-semibold uppercase text-muted">
          <tr>
            <th class="px-4 py-3">Method</th>
            <th class="px-4 py-3">Endpoint</th>
            <th class="px-4 py-3">Scenarios</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="entry in mockRegistry" :key="entry.method + entry.endpoint" class="border-t border-line">
            <td class="px-4 py-3 font-semibold text-ink">{{ entry.method }}</td>
            <td class="px-4 py-3 font-mono text-xs text-ink">{{ entry.endpoint }}</td>
            <td class="px-4 py-3 text-muted">
              {{ getScenarios(entry) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
};

const meta = {
  title: "Automation/Mock Scenarios",
  component: MockScenarioMatrix,
} satisfies Meta<typeof MockScenarioMatrix>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Registry: Story = {};
