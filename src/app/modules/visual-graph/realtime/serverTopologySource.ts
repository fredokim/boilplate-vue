import { apiClient } from "@core/api";
import { tokenStorage } from "@core/auth";
import { TopologySnapshotDto } from "./topologySnapshot.dto";
import type { TopologyRealtimeTransport, Unsubscribe } from "./transport";
import { parseServerTopologyFrame } from "./serverTopologyFrame";
import type { RealtimeConnectionState, TopologyRealtimeEvent, TopologyRuntimeSnapshot } from "./types";

/**
 * The real server transport, alongside the mock one rather than replacing it.
 *
 * Nothing here touches the runtime store or the controller. Batching,
 * coalescing, the pending cap, backoff, and the generation guard are all
 * upstream of the transport and untouched by this file — which is the property
 * the layering exists for.
 *
 * Ported from the React boilerplate, which shares this backend.
 */

/** Fetches the snapshot the controller seeds the store with. */
export async function fetchTopologySnapshot(graphId: string): Promise<TopologyRuntimeSnapshot> {
  const response = await apiClient.get(`/api/graphs/${graphId}/topology/snapshot`, TopologySnapshotDto);

  return {
    topologyId: response.topologyId,
    revision: response.revision,
    capturedAt: response.capturedAt,
    nodes: response.nodes as TopologyRuntimeSnapshot["nodes"],
    edges: response.edges as TopologyRuntimeSnapshot["edges"],
  };
}

export type ServerTransportOptions = {
  getAccessToken: () => string | null;
  /** The highest sequence already applied, so a reconnect replays instead of refetching. */
  getLastSequence: () => number;
  /** Called when the server says the gap is unrecoverable and a fresh snapshot is required. */
  onResyncRequired: (reason: string) => void;
  createSocket?: (url: string) => WebSocket;
};

/**
 * Speaks the gateway's protocol over a browser `WebSocket`.
 *
 * Two things it deliberately does not do: it does not reconnect, and it does
 * not buffer. The controller already owns backoff, and buffering here would
 * duplicate the pending cap that exists one layer up — and hide it.
 */
export class ServerTopologyTransport implements TopologyRealtimeTransport {
  private socket: WebSocket | null = null;
  private state: RealtimeConnectionState = "disconnected";
  private readonly eventListeners = new Set<(event: TopologyRealtimeEvent) => void>();
  private readonly connectionListeners = new Set<(state: RealtimeConnectionState) => void>();

  constructor(private readonly options: ServerTransportOptions) {}

  connect(topologyId: string): Promise<void> {
    this.disconnect();
    this.setState("connecting");

    return new Promise((resolve, reject) => {
      const create = this.options.createSocket ?? ((url: string) => new WebSocket(url));
      const socket = create(this.socketUrl());
      this.socket = socket;

      socket.addEventListener("open", () => {
        this.setState("connected");
        this.send({
          event: "subscribe",
          data: { graphId: topologyId, lastSequence: this.options.getLastSequence() },
        });
        resolve();
      });

      socket.addEventListener("message", (message: MessageEvent<unknown>) => {
        this.handleMessage(message.data);
      });

      socket.addEventListener("close", () => this.setState("disconnected"));
      socket.addEventListener("error", () => {
        this.setState("error");
        reject(new Error("Realtime transport connection failed"));
      });
    });
  }

  disconnect(): void {
    this.socket?.close();
    this.socket = null;
    this.setState("disconnected");
  }

  subscribe(listener: (event: TopologyRealtimeEvent) => void): Unsubscribe {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  subscribeConnection(listener: (state: RealtimeConnectionState) => void): Unsubscribe {
    this.connectionListeners.add(listener);
    return () => this.connectionListeners.delete(listener);
  }

  getConnectionState(): RealtimeConnectionState {
    return this.state;
  }

  private handleMessage(data: unknown): void {
    const frame = parseServerTopologyFrame(data);

    if (frame.kind === "event") {
      this.eventListeners.forEach((listener) => listener(frame.event));
      return;
    }

    if (frame.kind === "resync-required") {
      this.options.onResyncRequired(frame.reason);
    }

    // An `error` frame is deliberately not acted on here, as before. React sets
    // its transport to `error` on one; this app leaves the connection alone. The
    // difference is recorded rather than changed in a pass about validation.
  }

  private send(message: { event: string; data: unknown }): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    }
  }

  private socketUrl(): string {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const base = `${protocol}//${window.location.host}/api/topology`;
    const token = this.options.getAccessToken();

    return token ? `${base}?token=${encodeURIComponent(token)}` : base;
  }

  private setState(state: RealtimeConnectionState): void {
    if (state === this.state) return;

    this.state = state;
    this.connectionListeners.forEach((listener) => listener(state));
  }
}

/** The transport with this repository's token storage already wired in. */
export function createServerTopologyTransport(options: {
  getLastSequence: () => number;
  onResyncRequired: (reason: string) => void;
}) {
  return new ServerTopologyTransport({
    getAccessToken: () => tokenStorage.getAccessToken(),
    ...options,
  });
}
