<script setup lang="ts">
import { storeToRefs } from "pinia";

import BaseBadge from "@/components/atomic/atoms/BaseBadge.vue";
import BaseButton from "@/components/atomic/atoms/BaseButton.vue";
import BaseCard from "@/components/atomic/atoms/BaseCard.vue";
import ResultBoundary from "@/components/atomic/organisms/ResultBoundary.vue";
import { useUserStore } from "../store/user.store";

const userStore = useUserStore();
const { failure, isLoading, status, user } = storeToRefs(userStore);
</script>

<template>
  <section class="grid gap-4">
    <BaseCard>
      <template #header>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 class="m-0 text-xl font-bold text-slate-950">
              API Contract Sample
            </h1>
            <p class="m-0 mt-1 text-sm text-slate-500">
              DTO validation separates backend contract errors from frontend request errors.
            </p>
          </div>
          <BaseBadge :tone="status === 'error' ? 'error' : 'primary'">
            {{ status }}
          </BaseBadge>
        </div>
      </template>

      <ResultBoundary
        class="grid gap-4"
        :status="status"
        :failure="failure"
        :empty="!user"
        empty-title="No user loaded"
        empty-description="Load demo data or request the API to see the contract result."
        loading-title="Checking API contract"
        loading-description="Validating the response DTO."
        @retry="userStore.loadUser('user-demo')"
      >
        <dl v-if="user" class="m-0 grid gap-2 text-sm text-slate-700">
          <div class="flex gap-2">
            <dt class="font-semibold text-slate-950">Name</dt>
            <dd class="m-0">{{ user.name }}</dd>
          </div>
          <div class="flex gap-2">
            <dt class="font-semibold text-slate-950">Email</dt>
            <dd class="m-0">{{ user.email }}</dd>
          </div>
          <div class="flex gap-2">
            <dt class="font-semibold text-slate-950">Roles</dt>
            <dd class="m-0">{{ user.roles.join(", ") }}</dd>
          </div>
        </dl>

        <div class="flex flex-wrap gap-2">
          <BaseButton :disabled="isLoading" @click="userStore.useDemoUser">
            Use demo data
          </BaseButton>
          <BaseButton
            variant="outline"
            :disabled="isLoading"
            @click="userStore.loadUser('user-demo')"
          >
            Request API
          </BaseButton>
        </div>
      </ResultBoundary>
    </BaseCard>
  </section>
</template>
