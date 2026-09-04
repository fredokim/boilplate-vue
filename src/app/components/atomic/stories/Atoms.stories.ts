import type { Meta, StoryObj } from "@storybook/vue3";

import BaseAvatar from "../atoms/BaseAvatar.vue";
import BaseBadge from "../atoms/BaseBadge.vue";
import BaseButton from "../atoms/BaseButton.vue";
import BaseSwitch from "../atoms/BaseSwitch.vue";
import BaseTooltip from "../atoms/BaseTooltip.vue";

const meta = {
  title: "Design System/Atoms",
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Buttons: Story = {
  render: () => ({
    components: { BaseButton },
    template: `
      <div class="flex flex-wrap items-center gap-3">
        <BaseButton>Primary</BaseButton>
        <BaseButton variant="outline">Outline</BaseButton>
        <BaseButton variant="ghost">Ghost</BaseButton>
        <BaseButton tone="error">Delete</BaseButton>
        <BaseButton size="sm">Small</BaseButton>
        <BaseButton size="lg">Large</BaseButton>
      </div>
    `,
  }),
};

export const Badges: Story = {
  render: () => ({
    components: { BaseBadge },
    template: `
      <div class="flex flex-wrap items-center gap-2">
        <BaseBadge>Neutral</BaseBadge>
        <BaseBadge tone="primary">Primary</BaseBadge>
        <BaseBadge tone="success">Success</BaseBadge>
        <BaseBadge tone="warning">Warning</BaseBadge>
        <BaseBadge tone="error">Error</BaseBadge>
        <BaseBadge tone="info">Info</BaseBadge>
      </div>
    `,
  }),
};

export const Avatars: Story = {
  render: () => ({
    components: { BaseAvatar },
    template: `
      <div class="flex items-center gap-3">
        <BaseAvatar name="Fredo Kim" size="sm" />
        <BaseAvatar name="Fredo Kim" />
        <BaseAvatar name="Fredo Kim" size="lg" />
      </div>
    `,
  }),
};

export const SwitchesAndTooltip: Story = {
  render: () => ({
    components: { BaseSwitch, BaseTooltip },
    data: () => ({ enabled: true }),
    template: `
      <div class="flex items-center gap-5">
        <BaseSwitch v-model="enabled" label="Notifications" description="Receive product updates." />
        <BaseTooltip content="This is a UI-only tooltip.">
          <button class="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold">
            Hover me
          </button>
        </BaseTooltip>
      </div>
    `,
  }),
};
