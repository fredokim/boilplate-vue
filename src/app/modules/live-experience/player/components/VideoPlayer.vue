<script setup lang="ts">
import { computed, onScopeDispose, ref, watch } from "vue";

import { getDvrWindowSeconds, getLatencySeconds, isAtLiveEdge, type VideoSource } from "../model/player";
import { createHlsJsEngine } from "../engine/hlsJsEngine";
import { selectEngine, type EngineFactories } from "../engine/selectEngine";
import type { PlaybackEngine } from "../engine/playbackEngine";
import { useVideoPlayerState } from "../composables/useVideoPlayerState";

const props = defineProps<{
  source: VideoSource;
  title: string;
  /** Injected in tests so no real media element or hls.js download is needed. */
  engineFactories?: EngineFactories;
}>();

const videoRef = ref<HTMLVideoElement | null>(null);
const engine = ref<PlaybackEngine | null>(null);
const engineName = ref("none");
const { playerState, reset, setError, setPlaybackState, updateTiming } = useVideoPlayerState();

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${String(minutes)}:${String(remainingSeconds).padStart(2, "0")}`;
}

watch(
  [videoRef, () => props.source],
  ([video, source], _previous, onCleanup) => {
    if (!video) return;
    reset();
    let cancelled = false;

    const choice = selectEngine(video, source, { hlsJs: createHlsJsEngine, ...props.engineFactories });
    engine.value = choice.engine;
    engineName.value = choice.name;

    void choice.engine
      .attach(video, source, { onError: (error) => !cancelled && setError(error) })
      .catch((reason: unknown) => {
        if (cancelled) return;
        setError({
          kind: "unknown",
          message: reason instanceof Error ? reason.message : "Playback could not start.",
          recoverable: false,
        });
      });

    onCleanup(() => {
      cancelled = true;
      choice.engine.detach();
      engine.value = null;
    });
  },
  { immediate: true },
);

onScopeDispose(() => engine.value?.detach());

const latency = computed(() => getLatencySeconds(playerState.value));
const dvrWindow = computed(() => getDvrWindowSeconds(playerState.value));
const atLiveEdge = computed(() => isAtLiveEdge(playerState.value));

function onTiming(event: Event) {
  updateTiming(event.target as HTMLVideoElement);
}

function seekToLive() {
  const video = videoRef.value;
  if (!video || !playerState.value.isLive) return;
  video.currentTime = playerState.value.seekableEnd;
  void video.play().catch(() => undefined);
}

function retry() {
  if (!engine.value?.recover()) return;
  setError(null);
  setPlaybackState("loading");
}
</script>

<template>
  <section class="video-player" aria-label="Video player">
    <div class="video-player__viewport">
      <video
        ref="videoRef"
        class="video-player__media"
        controls
        playsinline
        preload="metadata"
        @canplay="setPlaybackState('paused')"
        @ended="setPlaybackState('ended')"
        @error="setError({ kind: 'media', message: 'The media element reported an error.', recoverable: true })"
        @loadedmetadata="onTiming"
        @loadstart="setPlaybackState('loading')"
        @pause="setPlaybackState('paused')"
        @play="setPlaybackState('playing')"
        @progress="onTiming"
        @timeupdate="onTiming"
        @waiting="setPlaybackState('buffering')"
      >
        <source v-if="source.kind === 'progressive'" :src="source.src" :type="source.mimeType" />
      </video>

      <button
        v-if="playerState.isLive"
        class="video-player__live"
        :class="atLiveEdge ? 'video-player__live--edge' : ''"
        :aria-label="atLiveEdge ? 'Playing live' : 'Jump to live'"
        :disabled="atLiveEdge"
        type="button"
        @click="seekToLive"
      >
        <span class="video-player__live-dot" aria-hidden="true" />
        {{ atLiveEdge ? "LIVE" : `${formatTime(latency)} behind` }}
      </button>
    </div>

    <div class="video-player__details">
      <div>
        <h2 class="m-0 text-lg font-bold text-slate-900">{{ title }}</h2>
        <p class="mb-0 mt-1 text-sm text-slate-500">
          {{
            playerState.isLive
              ? `Live stream · ${formatTime(dvrWindow)} of DVR available`
              : "Progressive source · seekable end to end"
          }}
        </p>
      </div>
      <div class="video-player__debug" aria-label="Player debug information">
        <span>{{ playerState.playbackState }}</span>
        <span>{{ engineName }}</span>
        <span>
          {{
            playerState.isLive
              ? `-${formatTime(latency)}`
              : `${formatTime(playerState.currentTime)} / ${formatTime(playerState.duration)}`
          }}
        </span>
      </div>
    </div>

    <div v-if="playerState.error" class="video-player__error" role="alert">
      <span>{{ playerState.error.message }}</span>
      <button v-if="playerState.error.recoverable" class="video-player__retry" type="button" @click="retry">
        Retry
      </button>
    </div>
  </section>
</template>
