<script setup lang="ts">
import type { VideoSource } from "../model/player";
import { useVideoPlayerState } from "../composables/useVideoPlayerState";

defineProps<{
  source: VideoSource;
  title: string;
}>();

const { playerState, setPlaybackState, updateTiming } = useVideoPlayerState();

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${String(minutes)}:${String(remainingSeconds).padStart(2, "0")}`;
}

function onTiming(event: Event) {
  updateTiming(event.target as HTMLVideoElement);
}
</script>

<template>
  <section class="video-player" aria-label="Video player">
    <div class="video-player__viewport">
      <video
        class="video-player__media"
        controls
        playsinline
        preload="metadata"
        @canplay="setPlaybackState('paused')"
        @ended="setPlaybackState('ended')"
        @error="setPlaybackState('error')"
        @loadedmetadata="onTiming"
        @loadstart="setPlaybackState('loading')"
        @pause="setPlaybackState('paused')"
        @play="setPlaybackState('playing')"
        @timeupdate="onTiming"
        @waiting="setPlaybackState('buffering')"
      >
        <source :src="source.src" :type="source.mimeType" />
      </video>
    </div>
    <div class="video-player__details">
      <div>
        <h2 class="m-0 text-lg font-bold text-slate-900">{{ title }}</h2>
        <p class="mb-0 mt-1 text-sm text-slate-500">Progressive test source · HLS integration point prepared</p>
      </div>
      <div class="video-player__debug" aria-label="Player debug information">
        <span>{{ playerState.playbackState }}</span>
        <span>{{ formatTime(playerState.currentTime) }} / {{ formatTime(playerState.duration) }}</span>
      </div>
    </div>
  </section>
</template>
