<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";

import BaseCard from "@/components/atomic/atoms/BaseCard.vue";
import { isSocialProvider } from "../social/social-provider";

const route = useRoute();
const provider = computed(() => String(route.params.provider ?? ""));
const isKnownProvider = computed(() => isSocialProvider(provider.value));
</script>

<template>
  <main class="grid min-h-screen place-items-center bg-slate-50 px-4 py-8">
    <BaseCard class="w-full max-w-md">
      <template #header>
        <div>
          <h1 class="m-0 text-xl font-bold text-slate-950">
            Social login callback
          </h1>
          <p class="m-0 mt-1 text-sm text-slate-500">
            Provider callback placeholder
          </p>
        </div>
      </template>

      <p class="m-0 text-sm text-slate-600">
        {{
          isKnownProvider
            ? `${provider} callback route is reserved for future OAuth integration.`
            : "Unknown social provider."
        }}
      </p>
    </BaseCard>
  </main>
</template>

