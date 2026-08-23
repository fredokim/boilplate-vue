import type { Meta, StoryObj } from "@storybook/vue3";

import UserContractView from "../views/UserContractView.vue";

const meta = {
  title: "Features/User/Contract",
  component: UserContractView,
  tags: ["autodocs"],
} satisfies Meta<typeof UserContractView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

