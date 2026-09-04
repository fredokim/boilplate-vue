import { defineStore } from "pinia";
import { computed, ref } from "vue";

import { parseState } from "@core/state/validate-state";
import type { BreadcrumbItem } from "./types";
import { uiPageMetaSchema, uiStateSnapshotSchema } from "./ui.schema";

export const useUiStore = defineStore("ui", () => {
  const sidebarOpen = ref(true);
  const pageTitle = ref("");
  const breadcrumbs = ref<BreadcrumbItem[]>([]);
  const globalLoadingCount = ref(0);

  const isGlobalLoading = computed(() => globalLoadingCount.value > 0);

  function openSidebar() {
    sidebarOpen.value = true;
  }

  function closeSidebar() {
    sidebarOpen.value = false;
  }

  function toggleSidebar() {
    sidebarOpen.value = !sidebarOpen.value;
  }

  function setPageMeta(nextPageTitle: string, nextBreadcrumbs: BreadcrumbItem[] = []) {
    const nextMeta = parseState(
      uiPageMetaSchema,
      {
        pageTitle: nextPageTitle,
        breadcrumbs: nextBreadcrumbs,
      },
      "ui.setPageMeta",
    );
    pageTitle.value = nextMeta.pageTitle;
    breadcrumbs.value = nextMeta.breadcrumbs;
  }

  function startGlobalLoading() {
    globalLoadingCount.value += 1;
  }

  function stopGlobalLoading() {
    const nextSnapshot = parseState(
      uiStateSnapshotSchema,
      {
        sidebarOpen: sidebarOpen.value,
        pageTitle: pageTitle.value,
        breadcrumbs: breadcrumbs.value,
        globalLoadingCount: Math.max(0, globalLoadingCount.value - 1),
      },
      "ui.stopGlobalLoading",
    );
    globalLoadingCount.value = nextSnapshot.globalLoadingCount;
  }

  return {
    breadcrumbs,
    globalLoadingCount,
    isGlobalLoading,
    pageTitle,
    sidebarOpen,
    closeSidebar,
    openSidebar,
    setPageMeta,
    startGlobalLoading,
    stopGlobalLoading,
    toggleSidebar,
  };
});
