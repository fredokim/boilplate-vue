<script lang="ts" setup>
import { onBeforeUnmount, ref } from "vue";

import { useEventBus } from "@core/composables/useNotification";

const bus = useEventBus();
const visible = ref(false);
const message = ref("");
const type = ref<"success" | "error" | "info" | "warning">("info");
const variant = ref<"basic" | "filled" | "outlined">("basic");
let timer: number;

const unsubscribe = bus.on("alert", (payload) => {
  clearTimeout(timer);
  message.value = payload.message;
  type.value = payload.type ?? "info";
  variant.value = payload.variant ?? "basic";
  visible.value = true;

  timer = window.setTimeout(() => {
    visible.value = false;
  }, payload.duration ?? 3000);
});

onBeforeUnmount(() => {
  clearTimeout(timer);
  unsubscribe();
});
</script>

<template>
  <transition name="fade">
    <div
      v-if="visible"
      class="alert-snackbar"
      :class="['toast', `alert--${variant}`, `alert--${type}`, 'text-white']"
    >
      {{ message }}
    </div>
  </transition>
</template>
