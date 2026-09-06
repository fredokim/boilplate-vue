import { apiClient } from "@core/api";
import { tokenStorage } from "@core/auth";
import { ChatHistoryDto } from "./serverChat.dto";
import { parseServerChatFrame } from "./serverChatFrame";

/**
 * Server-backed chat, alongside the mock transport rather than replacing it.
 *
 * `dataMode` chooses and the default stays mock, so tests, Storybook, and a
 * backend-free session behave exactly as before.
 *
 * The chat store's bounded retention, ordering, de-duplication, and flush
 * batching are all upstream of this file and untouched — this only produces
 * messages for them to consume.
 *
 * Ported from the React boilerplate, which shares this backend.
 */

export type ServerChatMessage = {
  id: string;
  clientMessageId: string;
  broadcastId: string;
  sequence: number;
  authorId: string;
  displayName: string;
  body: string;
  sentAt: string;
  deleted: boolean;
};

export type ChatStreamEvent =
  | { kind: "message"; message: ServerChatMessage }
  | { kind: "deleted"; messageId: string; sequence: number };

/** Fetches one page of history. */
export function fetchChatHistory(broadcastId: string, afterSequence = 0, limit = 50) {
  return apiClient.get(
    `/api/live/broadcasts/${broadcastId}/chat/messages?afterSequence=${String(afterSequence)}&limit=${String(limit)}`,
    ChatHistoryDto,
  );
}

export type ServerChatTransportOptions = {
  getAccessToken: () => string | null;
  /** The highest sequence already applied, so a reconnect resumes rather than replaying the room. */
  getLastSequence: () => number;
  createSocket?: (url: string) => WebSocket;
};

/**
 * Read-only, deliberately: sending goes over HTTP, where the permission check,
 * the idempotency key, and the rate limit already live. Implementing them again
 * on the socket would mean two answers to "may this person post?" that have to
 * agree forever.
 */
export class ServerChatTransport {
  private socket: WebSocket | null = null;
  private readonly eventListeners = new Set<(event: ChatStreamEvent) => void>();

  constructor(private readonly options: ServerChatTransportOptions) {}

  connect(broadcastId: string, onState: (state: "connected" | "disconnected" | "error") => void): Promise<void> {
    this.disconnect();

    return new Promise((resolve, reject) => {
      const create = this.options.createSocket ?? ((url: string) => new WebSocket(url));
      const socket = create(this.socketUrl());
      this.socket = socket;

      socket.addEventListener("open", () => {
        onState("connected");
        this.send({
          event: "join",
          data: { broadcastId, afterSequence: this.options.getLastSequence() },
        });
        resolve();
      });

      socket.addEventListener("message", (message: MessageEvent<unknown>) => {
        this.handleMessage(message.data);
      });

      socket.addEventListener("close", () => onState("disconnected"));
      socket.addEventListener("error", () => {
        onState("error");
        reject(new Error("Chat transport connection failed"));
      });
    });
  }

  disconnect(): void {
    this.socket?.close();
    this.socket = null;
  }

  subscribe(listener: (event: ChatStreamEvent) => void): () => void {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  private handleMessage(data: unknown): void {
    const frame = parseServerChatFrame(data);

    if (frame.kind === "message") {
      this.eventListeners.forEach((listener) => listener({ kind: "message", message: frame.message }));
      return;
    }

    if (frame.kind === "deleted") {
      this.eventListeners.forEach((listener) =>
        listener({ kind: "deleted", messageId: frame.messageId, sequence: frame.sequence }),
      );
    }
  }

  private send(message: { event: string; data: unknown }): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    }
  }

  /**
   * Built per connect, so a token refreshed since the last attempt is picked up.
   * The handshake authenticates from the query string; the server closes with
   * 4401 when it does not verify.
   */
  private socketUrl(): string {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const base = `${protocol}//${window.location.host}/api/live/chat`;
    const token = this.options.getAccessToken();

    return token ? `${base}?token=${encodeURIComponent(token)}` : base;
  }
}

/** The transport with this repository's token storage already wired in. */
export function createServerChatTransport(getLastSequence: () => number) {
  return new ServerChatTransport({
    getAccessToken: () => tokenStorage.getAccessToken(),
    getLastSequence,
  });
}
