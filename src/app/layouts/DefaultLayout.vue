<script setup lang="ts">
import { useLayoutSettings } from "@core/composables/useLayoutSettings";

import AppHeader from "./AppHeader.vue";
import AppSideBar from "./AppSideBar.vue";

const { isSidebar, isHeader } = useLayoutSettings();
</script>

<template>
  <div class="app-layout">
    <AppHeader v-if="isHeader" />
    <div class="layout-body">
      <AppSideBar v-if="isSidebar" class="app-sidebar" />

      <!--
        `tabindex="0"` because .main-content sets overflow-y: auto. A region
        that scrolls but cannot take focus is unreachable with a keyboard:
        there is nothing to put the caret on, so the arrow keys have nothing to
        scroll. It is announced as <main>, so the extra tab stop has a name.
      -->
      <main class="main-content" tabindex="0">
        <slot />
      </main>
    </div>
  </div>
</template>
