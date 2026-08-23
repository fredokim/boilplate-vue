<script setup lang="ts" generic="TItem">
import { toRef } from "vue";

import { useManagedInfiniteScroll } from "@core/composables/useManagedInfiniteScroll";
import BaseSpinner from "../atoms/BaseSpinner.vue";
import BaseScrollArea from "../molecules/BaseScrollArea.vue";

const props = withDefaults(
  defineProps<{
    items: TItem[];
    hasMore: boolean;
    isLoading: boolean;
    maxHeight?: string;
    maxItems?: number;
    emptyText?: string;
  }>(),
  {
    emptyText: "No items",
    maxHeight: "28rem",
    maxItems: 250,
  }
);

const emit = defineEmits<{
  loadMore: [];
}>();

defineSlots<{
  default(props: { item: TItem; index: number }): unknown;
}>();

const { retainedItems, sentinel } = useManagedInfiniteScroll({
  hasMore: toRef(props, "hasMore"),
  isLoading: toRef(props, "isLoading"),
  items: toRef(props, "items"),
  loadMore: () => emit("loadMore"),
  maxItems: props.maxItems,
});
</script>

<template>
  <BaseScrollArea :max-height="maxHeight">
    <div class="grid divide-y divide-slate-100">
      <p
        v-if="retainedItems.length === 0"
        class="m-0 px-4 py-8 text-center text-sm text-slate-500"
      >
        {{ emptyText }}
      </p>

      <div
        v-for="(item, index) in retainedItems"
        :key="index"
        class="px-4 py-3"
      >
        <slot :item="item" :index="index" />
      </div>

      <div ref="sentinel" class="min-h-1" aria-hidden="true" />

      <div
        v-if="isLoading"
        class="flex items-center justify-center gap-2 px-4 py-4 text-sm text-slate-500"
      >
        <BaseSpinner size="sm" />
        Loading
      </div>

      <p
        v-else-if="!hasMore && retainedItems.length > 0"
        class="m-0 px-4 py-4 text-center text-xs font-semibold uppercase text-slate-400"
      >
        End of list
      </p>
    </div>
  </BaseScrollArea>
</template>

