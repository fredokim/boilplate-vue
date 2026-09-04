import { chatMode } from "@core/config/dataMode";
import { MockChatTransport, type MockChatOptions } from "./mockChatTransport";
import { ServerBackedChatTransport } from "./serverChatRoomTransport";
import type { ChatTransport } from "./types";

/**
 * The broadcast the demo page joins.
 *
 * In server mode this must name a row in the backend's `Broadcast` table — the
 * seed creates one with exactly this id, so a freshly seeded database has
 * something to join. Mock mode uses it only as a room key.
 */
export const liveChatRoomId = "summer-stage";

/**
 * One transport per page, so navigating away and back does not spawn a second
 * stream.
 *
 * Which one is `chatMode`'s decision. In the React boilerplate this module
 * constructed the mock unconditionally while a fully tested server transport
 * sat unused beside it, so server mode showed generated messages and the page
 * reported "Connected" while doing it. The switch has to reach this line or it
 * decides nothing.
 */
export const liveChatTransport: ChatTransport =
  chatMode === "server" ? new ServerBackedChatTransport() : new MockChatTransport({ messagesPerSecond: 1 });

/**
 * A dedicated mock transport, for tests and Storybook that need to script the
 * stream. Deliberately not mode-aware: a story asking for a mock wants a mock.
 */
export function createLiveChatTransport(options: MockChatOptions = {}) {
  return new MockChatTransport(options);
}
