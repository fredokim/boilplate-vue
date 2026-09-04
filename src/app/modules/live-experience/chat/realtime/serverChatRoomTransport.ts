import { createServerChatTransport, type ServerChatMessage } from "./serverChatTransport";
import type { ChatMessage } from "../model/chatMessage";
import type { ChatConnectionState, ChatTransport, Unsubscribe } from "./types";

/**
 * Presents the server transport as the `ChatTransport` the chat page consumes.
 *
 * Two shapes exist because they were built for different things. The page's
 * `ChatTransport` predates the backend and speaks in whole `ChatMessage`s; the
 * server transport speaks the wire protocol — stream events carrying sequences
 * and tombstones. Mapping between them leaves the store, the controller, and
 * every test written against them untouched.
 */

/**
 * The server has no avatar field, and inventing one per author would put a face
 * on a person the database never described. A single neutral placeholder says
 * "unknown" honestly.
 */
const DEFAULT_AVATAR = "/avatars/default.svg";

function toChatMessage(message: ServerChatMessage): ChatMessage {
  return {
    id: message.id,
    userId: message.authorId,
    displayName: message.displayName,
    profileImageUrl: DEFAULT_AVATAR,
    message: message.body,
    timestamp: message.sentAt,
  };
}

export class ServerBackedChatTransport implements ChatTransport {
  private readonly inner: ReturnType<typeof createServerChatTransport>;
  private state: ChatConnectionState = "idle";

  /**
   * The highest sequence seen, handed to the server on reconnect so it resumes
   * rather than replaying the room from the start. It only ever moves forward:
   * an out-of-order frame must not walk the resume point backwards and cause a
   * duplicate replay.
   */
  private lastSequence = 0;

  private readonly messageListeners = new Set<(message: ChatMessage) => void>();
  private readonly connectionListeners = new Set<(state: ChatConnectionState) => void>();

  constructor() {
    this.inner = createServerChatTransport(() => this.lastSequence);

    this.inner.subscribe((event) => {
      if (event.kind !== "message") {
        // A tombstone has no place in a transcript the page models as
        // append-only. Tracking its sequence still matters: skipping it would
        // make the next reconnect ask for messages the server already sent.
        this.lastSequence = Math.max(this.lastSequence, event.sequence);
        return;
      }

      this.lastSequence = Math.max(this.lastSequence, event.message.sequence);

      const message = toChatMessage(event.message);
      this.messageListeners.forEach((listener) => listener(message));
    });
  }

  async connect(roomId: string): Promise<void> {
    this.setState("connecting");
    await this.inner.connect(roomId, (state) => this.setState(state));
  }

  disconnect(): void {
    this.inner.disconnect();
    this.setState("disconnected");
  }

  subscribe(listener: (message: ChatMessage) => void): Unsubscribe {
    this.messageListeners.add(listener);
    return () => this.messageListeners.delete(listener);
  }

  subscribeConnection(listener: (state: ChatConnectionState) => void): Unsubscribe {
    this.connectionListeners.add(listener);
    return () => this.connectionListeners.delete(listener);
  }

  getConnectionState(): ChatConnectionState {
    return this.state;
  }

  private setState(state: ChatConnectionState): void {
    if (state === this.state) return;

    this.state = state;
    this.connectionListeners.forEach((listener) => listener(state));
  }
}
