<script setup lang="ts">
import { computed, onScopeDispose, ref, watch } from "vue";
import { useVirtualizer } from "@tanstack/vue-virtual";

import ChatProfileImage from "./ChatProfileImage.vue";
import type { ChatMessage } from "../model/chatMessage";
import type { ChatConnectionState, ChatDiagnostics } from "../realtime/types";
import { connectionStatus } from "@core/realtime/connectionStatus";

const props = defineProps<{
  connectionState: ChatConnectionState;
  messages: readonly ChatMessage[];
  diagnostics: ChatDiagnostics;
}>();

// The state names the code uses are not the words to show a reader.
const status = computed(() => connectionStatus(props.connectionState));

const timeFormatter = new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit" });

/** Treat "within this many pixels of the bottom" as still pinned to live. */
const PIN_THRESHOLD_PX = 24;
/** Matches the .live-chat__messages height in the stylesheet. */
const CHAT_VIEWPORT_HEIGHT_PX = 420;

const scrollElement = ref<HTMLElement | null>(null);
const pinned = ref(true);

const rowVirtualizer = useVirtualizer(
  computed(() => ({
    count: props.messages.length,
    estimateSize: () => 64,
    getItemKey: (index: number) => props.messages[index]?.id ?? index,
    getScrollElement: () => scrollElement.value,
    // jsdom reports no element size, and a real browser reports none until the first
    // measurement, so give the virtualiser the viewport height the stylesheet fixes.
    initialRect: { width: 320, height: CHAT_VIEWPORT_HEIGHT_PX },
    observeElementRect: (_instance: unknown, callback: (rect: { width: number; height: number }) => void) => {
      const element = scrollElement.value;
      callback({
        width: element && element.clientWidth > 0 ? element.clientWidth : 320,
        height: element && element.clientHeight > 0 ? element.clientHeight : CHAT_VIEWPORT_HEIGHT_PX,
      });
      return () => undefined;
    },
    overscan: 6,
  })),
);

const virtualRows = computed(() => rowVirtualizer.value.getVirtualItems());

function scrollToLatest() {
  const element = scrollElement.value;
  if (element) element.scrollTop = element.scrollHeight;
}

// Following the stream means staying at the bottom as messages land. Once the reader
// scrolls up they are reading history, so new messages must not yank them back.
watch(
  () => props.messages.length,
  () => {
    if (pinned.value) requestAnimationFrame(scrollToLatest);
  },
);

function onScroll() {
  const element = scrollElement.value;
  if (!element) return;
  pinned.value = element.scrollHeight - element.scrollTop - element.clientHeight <= PIN_THRESHOLD_PX;
}

onScopeDispose(() => {
  scrollElement.value = null;
});
</script>

<template>
  <section class="live-chat" aria-label="Realtime chat">
    <header class="live-chat__header">
      <div>
        <h2 class="m-0 text-lg font-bold text-slate-900">Live chat</h2>
        <p class="mb-0 mt-1 text-xs text-slate-500">
          Buffered, de-duplicated, and capped at {{ messages.length }} shown
        </p>
      </div>
      <span
        class="live-chat__status"
        :class="`live-chat__status--${status.tone}`"
        role="status"
        :title="status.detail"
      >{{ status.label }}</span>
    </header>

    <div class="live-chat__viewport">
      <div ref="scrollElement" class="live-chat__messages" aria-live="polite" @scroll.passive="onScroll">
        <p v-if="messages.length === 0" class="m-auto text-sm text-slate-500">Waiting for the first message…</p>
        <div v-else class="live-chat__spacer" :style="{ height: `${rowVirtualizer.getTotalSize()}px` }">
          <template v-for="virtualRow in virtualRows" :key="virtualRow.key">
            <article
              v-if="messages[virtualRow.index]"
              class="live-chat__message"
              :data-index="virtualRow.index"
              :style="{ transform: `translateY(${virtualRow.start}px)` }"
            >
              <ChatProfileImage
                :display-name="messages[virtualRow.index]!.displayName"
                :src="messages[virtualRow.index]!.profileImageUrl"
              />
              <div class="min-w-0 flex-1">
                <div class="flex items-baseline gap-2">
                  <strong class="text-sm text-slate-900">{{ messages[virtualRow.index]!.displayName }}</strong>
                  <time class="text-[11px] text-slate-500" :datetime="messages[virtualRow.index]!.timestamp">
                    {{ timeFormatter.format(new Date(messages[virtualRow.index]!.timestamp)) }}
                  </time>
                </div>
                <p class="mb-0 mt-1 break-words text-sm text-slate-700">
                  {{ messages[virtualRow.index]!.message }}
                </p>
              </div>
            </article>
          </template>
        </div>
      </div>

      <button
        v-if="!pinned && messages.length > 0"
        class="live-chat__jump"
        type="button"
        @click="
          pinned = true;
          scrollToLatest();
        "
      >
        Jump to latest
      </button>
    </div>

    <footer class="live-chat__debug" aria-label="Chat debug information">
      <span>Shown: {{ messages.length }}</span>
      <span>Rendered: {{ virtualRows.length }}</span>
      <span>Dropped: {{ diagnostics.droppedByCapacity + diagnostics.droppedTooOld }}</span>
      <span>Connection: {{ status.label }}</span>
    </footer>
  </section>
</template>
