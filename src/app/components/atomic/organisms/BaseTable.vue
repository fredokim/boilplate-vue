<script setup lang="ts">
import type { AtomicTableColumn } from "../types";

defineProps<{
  columns: AtomicTableColumn[];
  rows: Record<string, unknown>[];
  rowKey?: string;
  emptyText?: string;
}>();

function alignClass(align: AtomicTableColumn["align"]) {
  if (align === "center") {
    return "text-center";
  }

  if (align === "right") {
    return "text-right";
  }

  return "text-left";
}
</script>

<template>
  <div class="overflow-hidden rounded-lg border border-slate-200 bg-white">
    <div class="overflow-x-auto">
      <table class="min-w-full border-separate border-spacing-0 text-sm">
        <thead class="bg-slate-50">
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
              class="border-b border-slate-200 px-4 py-3 font-semibold text-slate-700"
              :class="alignClass(column.align)"
              :style="{ width: column.width }"
              scope="col"
            >
              {{ column.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="rows.length === 0">
            <td class="px-4 py-8 text-center text-slate-500" :colspan="columns.length">
              {{ emptyText ?? "No data" }}
            </td>
          </tr>
          <tr
            v-for="(row, rowIndex) in rows"
            v-else
            :key="String(rowKey ? row[rowKey] : rowIndex)"
            class="transition hover:bg-slate-50"
          >
            <td
              v-for="column in columns"
              :key="column.key"
              class="border-b border-slate-100 px-4 py-3 text-slate-800"
              :class="alignClass(column.align)"
            >
              <slot
                :name="`cell-${column.key}`"
                :row="row"
                :value="row[column.key]"
                :column="column"
              >
                {{ row[column.key] }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
