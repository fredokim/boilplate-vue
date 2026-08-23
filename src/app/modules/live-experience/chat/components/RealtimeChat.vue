<script setup lang="ts">
import ChatProfileImage from "./ChatProfileImage.vue";
import type { ChatMessage } from "../model/chatMessage";
import type { RealtimeConnectionState } from "../realtime/realtimeChatAdapter";

defineProps<{
  connectionState: RealtimeConnectionState;
  messages: readonly ChatMessage[];
}>();

const timeFormatter = new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit" });
</script>

<template>
  <section class="live-chat" aria-label="Realtime chat">
    <header class="live-chat__header">
      <div>
        <h2 class="m-0 text-lg font-bold text-slate-900">Live chat</h2>
        <p class="mb-0 mt-1 text-xs text-slate-500">Messages from the mock realtime adapter</p>
      </div>
      <span class="live-chat__status" :class="`live-chat__status--${connectionState}`">{{ connectionState }}</span>
    </header>
    <div class="live-chat__messages" aria-live="polite">
      <p v-if="messages.length === 0" class="m-auto text-sm text-slate-500">Waiting for the first message…</p>
      <article v-for="message in messages" v-else :key="message.id" class="live-chat__message">
        <ChatProfileImage :display-name="message.displayName" :src="message.profileImageUrl" />
        <div class="min-w-0 flex-1">
          <div class="flex items-baseline gap-2">
            <strong class="text-sm text-slate-900">{{ message.displayName }}</strong>
            <time class="text-[11px] text-slate-500" :datetime="message.timestamp">
              {{ timeFormatter.format(new Date(message.timestamp)) }}
            </time>
          </div>
          <p class="mb-0 mt-1 break-words text-sm text-slate-700">{{ message.message }}</p>
        </div>
      </article>
    </div>
    <footer class="live-chat__debug" aria-label="Chat debug information">
      <span>Messages: {{ messages.length }}</span>
      <span>Connection: {{ connectionState }}</span>
    </footer>
  </section>
</template>
