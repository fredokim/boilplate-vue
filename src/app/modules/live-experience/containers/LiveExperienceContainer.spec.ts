import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import LiveExperienceContainer from "./LiveExperienceContainer.vue";
import { createMockRealtimeChatAdapter } from "../chat/realtime/mockRealtimeChatAdapter";

describe("LiveExperienceContainer (Vue)", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("shows the empty state and connecting status before the handshake lands", async () => {
    const wrapper = mount(LiveExperienceContainer, {
      props: { adapter: createMockRealtimeChatAdapter(1000) },
    });
    await vi.advanceTimersByTimeAsync(0);

    expect(wrapper.text()).toContain("Waiting for the first message…");
    expect(wrapper.get('[aria-label="Chat debug information"]').text()).toContain("Messages: 0");
    expect(wrapper.get('[aria-label="Chat debug information"]').text()).toContain("Connection: connecting");

    wrapper.unmount();
  });

  it("renders streamed messages with author, avatar, and a machine-readable timestamp", async () => {
    const wrapper = mount(LiveExperienceContainer, {
      props: { adapter: createMockRealtimeChatAdapter(1000) },
    });

    await vi.advanceTimersByTimeAsync(350 + 1000);

    expect(wrapper.get('[aria-label="Chat debug information"]').text()).toContain("Connection: connected");
    const messages = wrapper.findAll(".live-chat__message");
    expect(messages).toHaveLength(1);
    expect(messages[0]?.find("img").attributes("alt")).toBe("Mina's profile");
    expect(messages[0]?.find("time").attributes("datetime")).toBeTruthy();

    wrapper.unmount();
  });

  it("exposes the chat feed as a polite live region", async () => {
    const wrapper = mount(LiveExperienceContainer, {
      props: { adapter: createMockRealtimeChatAdapter(1000) },
    });
    await vi.advanceTimersByTimeAsync(0);

    expect(wrapper.find('[aria-live="polite"]').exists()).toBe(true);

    wrapper.unmount();
  });

  it("stops the adapter when the component unmounts", async () => {
    const wrapper = mount(LiveExperienceContainer, {
      props: { adapter: createMockRealtimeChatAdapter(1000) },
    });
    await vi.advanceTimersByTimeAsync(350 + 1000);
    const delivered = wrapper.findAll(".live-chat__message").length;
    expect(delivered).toBeGreaterThan(0);

    wrapper.unmount();
    await vi.advanceTimersByTimeAsync(5000);

    // No timers should still be feeding a torn-down component.
    expect(vi.getTimerCount()).toBe(0);
  });
});
