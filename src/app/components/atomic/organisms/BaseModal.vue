<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string;
    description?: string;
    size?: "sm" | "md" | "lg" | "xl";
    closeOnBackdrop?: boolean;
  }>(),
  {
    size: "md",
    closeOnBackdrop: true,
  }
);

const open = defineModel<boolean>("open", { default: false });

const sizeClass = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

function close() {
  open.value = false;
}

function handleBackdrop(closeOnBackdrop: boolean) {
  if (closeOnBackdrop) {
    close();
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex min-h-dvh items-center justify-center bg-slate-950/45 p-4"
        role="presentation"
        @click.self="handleBackdrop(closeOnBackdrop)"
      >
        <section
          class="w-full rounded-lg bg-white shadow-xl ring-1 ring-slate-200"
          :class="sizeClass[size]"
          role="dialog"
          aria-modal="true"
          :aria-label="title"
        >
          <header
            v-if="title || description || $slots.header"
            class="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4"
          >
            <slot name="header">
              <div class="grid gap-1">
                <h2 v-if="title" class="m-0 text-base font-semibold text-slate-950">
                  {{ title }}
                </h2>
                <p v-if="description" class="m-0 text-sm text-slate-500">
                  {{ description }}
                </p>
              </div>
            </slot>
            <button
              class="rounded p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
              type="button"
              aria-label="Close modal"
              @click="close"
            >
              x
            </button>
          </header>

          <div class="px-5 py-4">
            <slot :close="close" />
          </div>

          <footer
            v-if="$slots.footer"
            class="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-4"
          >
            <slot name="footer" :close="close" />
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>
