<script setup lang="ts">
import { computed } from "vue";

import BasePagination from "../molecules/BasePagination.vue";
import BaseTable from "./BaseTable.vue";
import type { AtomicTableColumn } from "../types";

const page = defineModel<number>("page", { default: 1 });

const props = withDefaults(
  defineProps<{
    columns: AtomicTableColumn[];
    rows: Record<string, unknown>[];
    rowKey?: string;
    pageSize?: number;
    emptyText?: string;
  }>(),
  {
    pageSize: 10,
  }
);

const visibleRows = computed(() => {
  const start = (page.value - 1) * props.pageSize;
  const end = start + props.pageSize;

  return props.rows.slice(start, end);
});
</script>

<template>
  <div class="grid gap-4">
    <BaseTable
      :columns="columns"
      :rows="visibleRows"
      :row-key="rowKey"
      :empty-text="emptyText"
    >
      <template
        v-for="column in columns"
        :key="column.key"
        #[`cell-${column.key}`]="slotProps"
      >
        <slot
          :name="`cell-${column.key}`"
          v-bind="slotProps"
        >
          {{ slotProps.value }}
        </slot>
      </template>
    </BaseTable>

    <div class="flex items-center justify-between gap-4">
      <p class="m-0 text-sm text-slate-500">
        Showing {{ visibleRows.length }} of {{ rows.length }}
      </p>
      <BasePagination
        v-model:page="page"
        :total="rows.length"
        :page-size="pageSize"
      />
    </div>
  </div>
</template>

