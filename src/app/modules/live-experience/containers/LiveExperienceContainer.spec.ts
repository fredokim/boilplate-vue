import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import LiveExperienceContainer from "./LiveExperienceContainer.vue";
import { MockChatTransport } from "../chat/realtime/mockChatTransport";

function mountContainer(transport: MockChatTransport) {
  return mount(LiveExperienceContainer, { props: { transport } });
}

describe("LiveExperienceContainer (Vue)", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("shows the empty state and connecting status before the handshake lands", async () => {
    const wrapper = mountContainer(new MockChatTransport({ handshakeMs: 350, messagesPerSecond: 0 }));
    await flushPromises();

    expect(wrapper.text()).toContain("Waiting for the first message…");
    const debug = wrapper.get('[aria-label="Chat debug information"]').text();
    expect(debug).toContain("Shown: 0");
    expect(debug).toContain("Connection: connecting");

    wrapper.unmount();
  });

  it("renders messages only after the flush tick, not per message", async () => {
    const transport = new MockChatTransport({ handshakeMs: 10, messagesPerSecond: 0 });
    const wrapper = mountContainer(transport);
    await vi.advanceTimersByTimeAsync(10);
    await flushPromises();

    transport.emit(transport.createMessage(0));
    transport.emit(transport.createMessage(1));
    await flushPromises();
    expect(wrapper.findAll(".live-chat__message")).toHaveLength(0);

    await vi.advanceTimersByTimeAsync(120);
    await flushPromises();
    expect(wrapper.findAll(".live-chat__message").length).toBeGreaterThan(0);

    wrapper.unmount();
  });

  it("exposes the chat feed as a polite live region", async () => {
    const wrapper = mountContainer(new MockChatTransport({ handshakeMs: 10, messagesPerSecond: 0 }));
    await flushPromises();

    expect(wrapper.find('[aria-live="polite"]').exists()).toBe(true);

    wrapper.unmount();
  });

  it("disconnects the transport when the component unmounts", async () => {
    const transport = new MockChatTransport({ handshakeMs: 10, messagesPerSecond: 0 });
    const wrapper = mountContainer(transport);
    await vi.advanceTimersByTimeAsync(10);
    expect(transport.getConnectionState()).toBe("connected");

    wrapper.unmount();
    expect(transport.getConnectionState()).toBe("disconnected");
  });
});
