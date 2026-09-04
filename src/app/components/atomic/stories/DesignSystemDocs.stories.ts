import type { Meta, StoryObj } from "@storybook/vue3";

const meta = {
  title: "Design System/Docs/Usage Rules",
  tags: ["autodocs"],
  render: () => ({
    template: `
      <main class="grid max-w-4xl gap-6 text-slate-800">
        <section class="grid gap-2">
          <h1 class="m-0 text-2xl font-bold text-slate-950">Design System Rules</h1>
          <p class="m-0 text-sm text-slate-600">
            Atomic components stay UI-only. Feature logic is injected through props,
            emits, slots, stores, or adapter components.
          </p>
        </section>

        <section class="grid gap-3">
          <h2 class="m-0 text-lg font-semibold text-slate-950">Component Contract</h2>
          <ul class="m-0 grid gap-2 pl-5 text-sm text-slate-600">
            <li>Use shared prop names: variant, tone, size, radius, state.</li>
            <li>Keep atoms and molecules free from API clients and router guards.</li>
            <li>Add loading, disabled, error, empty, and success states to stories.</li>
            <li>Use adapters when UI needs application state or side effects.</li>
          </ul>
        </section>

        <section class="grid gap-3">
          <h2 class="m-0 text-lg font-semibold text-slate-950">Generation Flow</h2>
          <code class="rounded-md bg-slate-950 p-3 text-sm text-white">
            npm run generate:component -- atom BaseDateInput
          </code>
        </section>
      </main>
    `,
  }),
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const UsageRules: Story = {};

