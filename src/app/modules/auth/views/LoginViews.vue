<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { storeToRefs } from "pinia";

import BaseButton from "@/components/atomic/atoms/BaseButton.vue";
import BaseCard from "@/components/atomic/atoms/BaseCard.vue";
import PasswordInput from "@/components/atomic/atoms/PasswordInput.vue";
import TextInput from "@/components/atomic/atoms/TextInput.vue";
import FormField from "@/components/atomic/molecules/FormField.vue";
import { toDtoFieldErrors } from "@core/form/field-errors";
import { logger } from "@core/observability/logger";
import { useAuthStore } from "@store/auth.store";
import { loginSchema, type LoginInput } from "../schema/login.schema";
import { socialProviders } from "../social/social-provider";
import { shouldOfferDemoSession } from "@core/config/dataMode";

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const { failure, status } = storeToRefs(auth);

const email = ref("admin@example.com");
const password = ref("");
const fieldError = ref<string | null>(null);
const isLoading = computed(() => status.value === "loading");

function getRedirectPath() {
  const redirect = route.query.redirect;

  return typeof redirect === "string" && redirect.startsWith("/")
    ? redirect
    : "/dashboard";
}

async function submitLogin() {
  const parsed = loginSchema.safeParse({
    email: email.value,
    password: password.value,
  });

  if (!parsed.success) {
    const errors = toDtoFieldErrors<LoginInput>(parsed.error);
    fieldError.value = errors.email ?? errors.password ?? "Invalid login input.";
    logger.warn("Login validation failed", { errors });
    return;
  }

  fieldError.value = null;
  const success = await auth.login(parsed.data);

  if (success) {
    await router.push(getRedirectPath());
  }
}

/**
 * Hidden in server mode. The demo session carries a token the backend never
 * issued, so the first authenticated request fails — which reads as a broken
 * login rather than as demo data.
 */
async function useDemoLogin() {
  auth.useDemoSession();
  await router.push(getRedirectPath());
}
</script>

<template>
  <main class="grid min-h-screen place-items-center bg-slate-50 px-4 py-8">
    <BaseCard class="w-full max-w-md">
      <template #header>
        <div>
          <h1 class="m-0 text-2xl font-bold text-slate-950">Sign in</h1>
          <p class="m-0 mt-1 text-sm text-slate-500">
            JWT session guard sample
          </p>
        </div>
      </template>

      <form class="grid gap-4" @submit.prevent="submitLogin">
        <FormField id="email" label="Email" required>
          <template #default="{ id, describedby, state }">
            <TextInput
              v-model="email"
              :id="id"
              name="email"
              type="email"
              autocomplete="email"
              placeholder="admin@example.com"
              :aria-describedby="describedby"
              :state="state"
              required
            />
          </template>
        </FormField>

        <FormField id="password" label="Password" required>
          <template #default="{ id, describedby, state }">
            <PasswordInput
              v-model="password"
              :id="id"
              name="password"
              autocomplete="current-password"
              placeholder="Enter password"
              :aria-describedby="describedby"
              :state="state"
              required
            />
          </template>
        </FormField>

        <p
          v-if="fieldError || failure"
          class="m-0 rounded-md bg-red-50 p-3 text-sm text-red-700"
          role="alert"
        >
          <template v-if="fieldError">{{ fieldError }}</template>
          <template v-else-if="failure">
            {{ failure.code ? `${failure.code}: ` : "" }}{{ failure.message }}
          </template>
        </p>

        <div class="grid gap-2">
          <BaseButton type="submit" :disabled="isLoading">
            {{ isLoading ? "Signing in" : "Sign in" }}
          </BaseButton>
          <BaseButton
            v-if="shouldOfferDemoSession"
            type="button"
            variant="outline"
            tone="neutral"
            :disabled="isLoading"
            @click="useDemoLogin"
          >
            Use demo session
          </BaseButton>
        </div>

        <div class="grid gap-2 border-t border-slate-200 pt-4">
          <p class="m-0 text-center text-xs font-semibold uppercase text-slate-600">
            Social login extension
          </p>
          <BaseButton
            v-for="item in socialProviders"
            :key="item.provider"
            type="button"
            variant="outline"
            tone="neutral"
            :disabled="!item.enabled || isLoading"
          >
            {{ item.label }}
          </BaseButton>
        </div>
      </form>
    </BaseCard>
  </main>
</template>
