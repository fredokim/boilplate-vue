import type { Meta, StoryObj } from "@storybook/vue3";

import BaseButton from "../atoms/BaseButton.vue";
import EmptyState from "../organisms/EmptyState.vue";
import ErrorState from "../organisms/ErrorState.vue";
import LoadingState from "../organisms/LoadingState.vue";
import ResultBoundary from "../organisms/ResultBoundary.vue";

const meta = {
  title: "Design System/States",
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  render: () => ({
    components: { EmptyState },
    template: `
      <EmptyState
        title="No users found"
        description="Adjust filters or create the first user."
        action-label="Create user"
      />
    `,
  }),
};

export const Loading: Story = {
  render: () => ({
    components: { LoadingState },
    template: `
      <LoadingState
        title="Loading users"
        description="Fetching and validating the API response."
      />
    `,
  }),
};

export const SpinnerLoading: Story = {
  render: () => ({
    components: { LoadingState },
    template: `
      <LoadingState
        variant="spinner"
        title="Checking session"
        description="Confirming JWT session state."
      />
    `,
  }),
};

export const ContractError: Story = {
  render: () => ({
    components: { ErrorState },
    template: `
      <ErrorState
        title="API contract failed"
        message="Backend response does not match the frontend DTO contract."
        code="backend:response_contract"
        origin="backend"
        kind="response_contract"
      />
    `,
  }),
};

export const BoundaryStates: Story = {
  render: () => ({
    components: { BaseButton, ResultBoundary },
    data: () => ({
      status: "error",
      failure: {
        code: "backend:response_contract",
        kind: "response_contract",
        message: "Backend response does not match the frontend DTO contract.",
        origin: "backend",
      },
    }),
    template: `
      <div class="grid gap-4">
        <div class="flex flex-wrap gap-2">
          <BaseButton size="sm" @click="status = 'loading'">Loading</BaseButton>
          <BaseButton size="sm" @click="status = 'success'">Success</BaseButton>
          <BaseButton size="sm" @click="status = 'error'">Error</BaseButton>
        </div>

        <ResultBoundary
          :status="status"
          :failure="failure"
          :empty="status === 'success'"
          empty-title="No result"
          empty-description="The request succeeded but returned no rows."
        >
          <div class="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
            Loaded content
          </div>
        </ResultBoundary>
      </div>
    `,
  }),
};

