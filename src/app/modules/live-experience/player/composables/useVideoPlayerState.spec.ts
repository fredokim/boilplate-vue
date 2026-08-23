import { effectScope } from "vue";
import { describe, expect, it } from "vitest";

import { initialPlayerState } from "../model/player";
import { useVideoPlayerState } from "./useVideoPlayerState";

function videoElement(currentTime: number, duration: number, seekable: [number, number] | null = null) {
  const ranges = seekable
    ? ({ length: 1, start: () => seekable[0], end: () => seekable[1] } as unknown as TimeRanges)
    : ({ length: 0, start: () => 0, end: () => 0 } as unknown as TimeRanges);
  return { currentTime, duration, seekable: ranges } as HTMLVideoElement;
}

function runComposable() {
  const scope = effectScope();
  const player = scope.run(() => useVideoPlayerState());
  if (!player) throw new Error("composable did not run");
  return { player, scope };
}

describe("useVideoPlayerState (Vue)", () => {
  it("starts idle with no timing", () => {
    const { player, scope } = runComposable();

    expect(player.playerState.value).toEqual(initialPlayerState);

    scope.stop();
  });

  it("keeps timing when the playback state changes", () => {
    const { player, scope } = runComposable();

    player.updateTiming(videoElement(12.5, 60));
    player.setPlaybackState("playing");

    expect(player.playerState.value).toMatchObject({ playbackState: "playing", currentTime: 12.5, duration: 60 });

    scope.stop();
  });

  it("treats a non-finite duration as unknown", () => {
    const { player, scope } = runComposable();

    player.updateTiming(videoElement(4, Number.POSITIVE_INFINITY));

    // Live streams report Infinity until the manifest ends; the UI formats 0 rather than "Infinity:NaN".
    expect(player.playerState.value.duration).toBe(0);
    expect(player.playerState.value.currentTime).toBe(4);

    scope.stop();
  });

  it("treats NaN duration as unknown", () => {
    const { player, scope } = runComposable();

    player.updateTiming(videoElement(0, Number.NaN));

    expect(player.playerState.value.duration).toBe(0);

    scope.stop();
  });
});
