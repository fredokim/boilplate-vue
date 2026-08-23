import { defineStore } from "pinia";
import { computed, ref } from "vue";

import type { LoadState, StoreFailure } from "./types";

export const useAppStore = defineStore("app", () => {
  const appName = ref("Vue Boilerplate");
  const bootState = ref<LoadState>("idle");
  const bootFailure = ref<StoreFailure | null>(null);

  const isBooting = computed(() => bootState.value === "loading");
  const isReady = computed(() => bootState.value === "success");

  function setAppName(nextAppName: string) {
    appName.value = nextAppName;
  }

  function startBoot() {
    bootState.value = "loading";
    bootFailure.value = null;
  }

  function finishBoot() {
    bootState.value = "success";
    bootFailure.value = null;
  }

  function failBoot(failure: StoreFailure) {
    bootState.value = "error";
    bootFailure.value = failure;
  }

  return {
    appName,
    bootFailure,
    bootState,
    isBooting,
    isReady,
    failBoot,
    finishBoot,
    setAppName,
    startBoot,
  };
});
