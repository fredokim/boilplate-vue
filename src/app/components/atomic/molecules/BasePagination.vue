<script setup lang="ts">
import { computed } from "vue";

const page = defineModel<number>("page", { default: 1 });

const props = withDefaults(
  defineProps<{
    total: number;
    pageSize: number;
    siblingCount?: number;
  }>(),
  {
    siblingCount: 1,
  }
);

const pageCount = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)));

const pages = computed(() => {
  const start = Math.max(1, page.value - props.siblingCount);
  const end = Math.min(pageCount.value, page.value + props.siblingCount);

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
});

const firstPage = computed(() => pages.value[0] ?? 1);
const lastPage = computed(() => pages.value[pages.value.length - 1] ?? 1);

function setPage(nextPage: number) {
  page.value = Math.min(pageCount.value, Math.max(1, nextPage));
}
</script>

<template>
  <nav class="flex items-center gap-1" aria-label="Pagination">
    <button
      class="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      type="button"
      :disabled="page <= 1"
      @click="setPage(page - 1)"
    >
      Prev
    </button>
    <button
      v-if="firstPage > 1"
      class="h-9 min-w-9 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700"
      type="button"
      @click="setPage(1)"
    >
      1
    </button>
    <span v-if="firstPage > 2" class="px-2 text-sm text-slate-500">...</span>
    <button
      v-for="item in pages"
      :key="item"
      class="h-9 min-w-9 rounded-md border px-3 text-sm font-semibold transition"
      :class="item === page ? 'border-primary bg-primary text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'"
      type="button"
      :aria-current="item === page ? 'page' : undefined"
      @click="setPage(item)"
    >
      {{ item }}
    </button>
    <span v-if="lastPage < pageCount - 1" class="px-2 text-sm text-slate-500">
      ...
    </span>
    <button
      v-if="lastPage < pageCount"
      class="h-9 min-w-9 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700"
      type="button"
      @click="setPage(pageCount)"
    >
      {{ pageCount }}
    </button>
    <button
      class="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      type="button"
      :disabled="page >= pageCount"
      @click="setPage(page + 1)"
    >
      Next
    </button>
  </nav>
</template>
