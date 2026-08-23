# Visual Graph Module

Reference for `src/app/modules/visual-graph`, this repo's largest worked example. It
exists to show how a non-trivial, interaction-heavy module stays inside the boundary
rules: props-only views, containers that own orchestration, and framework-free domain
logic that unit tests can drive without mounting a component.

Route: `/visual-graph`. The router globs `modules/*/router/routes.ts` and mounts each
module under `/{moduleName}`, so the module's own `path` is `""`.

## What is shared with the other boilerplates

This module was ported from the React boilerplate, and all 33 framework-agnostic modules
moved across with **no code changes at all**. Both repos build on Vite, so even
`import.meta.env` carried over; the only edit was renaming test files to `*.spec.ts`,
which is what this repo's vitest config collects.

Everything under `model/`, `editing/`, `layout/`, `network/`, `performance/`,
`realtime/` (except the composable), and `services/` is plain TypeScript with no Vue
import. The same files exist in the React and Next boilerplates. When changing one,
decide first whether the change belongs in that shared logic or in the Vue layer above it.

## Layer map

| Directory | Owns | Vue? |
| --- | --- | --- |
| `model/` | Graph document, selection, interaction state, visual-state derivation | No |
| `editing/` | Undoable edit session, commands, clipboard, validation, serialization | Composable only |
| `layout/` | Layout engines, dagre service, worker executor, stale-response coordinator | No |
| `network/` | Demo topology, large topology, route fixtures, realtime wiring | No |
| `realtime/` | Transport, runtime store, controller, mock source, `useTopologyRealtime` | Composable only |
| `performance/` | Search index, detail-level adapter, deterministic fixtures, measurement | No |
| `services/` | Route service interface and mock implementation | No |
| `components/` | `GraphCanvas` (Vue Flow adapter) and `GraphNodeCard` | Yes |
| `views/` | `GraphViewerView`, `GraphEditorView` | Yes, props-in/events-out |
| `containers/` | `GraphViewerContainer` — where state, effects, and services meet | Yes |

## Vue Flow instead of React Flow

The canvas is the one component with a genuine library swap. Consequences worth knowing:

- The stylesheet targets `.vue-flow__*` selectors where the React original targeted
  `.react-flow__*`. Class names we compose ourselves (`graph-edge--dimmed`,
  `graph-node--runtime-warning`) are unchanged, because this repo uses plain SCSS rather
  than CSS Modules and they are not hashed.
- Viewport helpers are exposed through `defineExpose` (`fitAll`, `focusNode`,
  `focusRoute`) rather than a forwarded ref. Anything that mocks `GraphCanvas` in a test
  must provide those methods, or the view's `canvasRef.value?.focusRoute(...)` call fails.
- The pane click handler cannot return a boolean through an event, so the canvas emits a
  mutable `handled` flag the editor sets when it consumes the click.
- `@vue-flow/*` lives in its own `graph` vendor chunk and dagre in `graph-layout`.
  Bundled together they exceeded the 190KB per-chunk budget; see `vite.config.ts`.

## Realtime pipeline

Runtime health is **not** part of the graph document. `networkGraph` describes topology;
status and metrics arrive separately as a stream. A node whose realtime state never
arrives renders as `unknown` rather than blocking the topology from drawing.

```
transport ──events──▶ store.enqueue ──coalesce──▶ [pending]
                                                    │ flush timer (50ms / 250ms hidden)
                                                    ▼
                        store.flush ──▶ snapshot ──▶ shallowRef ──▶ view
controller ──resync──▶ store.applySnapshot
```

`TopologyRuntimeStore` exposes `subscribe`/`getSnapshot`. React consumes that through
`useSyncExternalStore`; here `realtime/useTopologyRealtime.ts` subscribes and assigns
each snapshot into a `shallowRef`. Nothing below the composable knows which framework is
rendering, which is why `useTopologyRealtime.spec.ts` drives it through a bare
`effectScope` with no component involved.

The composable releases everything in `onScopeDispose`: the store subscription, the
connection subscription, the stale-tick interval, the `visibilitychange` listener, and
the controller itself.

### Correctness rules

These are the properties the realtime specs defend:

- **Ordering.** Every entity carries a monotonic `sequence`. An event at or below the
  applied sequence is dropped as stale — checked on enqueue and again on flush, because
  a resync can land in between.
- **Duplicates.** `eventId` is remembered in a bounded LRU (5,000). Redelivery is counted
  and discarded.
- **Coalescing.** Pending events are keyed by `entity:id:kind`, so a burst of metric
  updates collapses to the newest while a status change for the same entity survives.
- **Backpressure.** The pending map is capped (2,000); overflow drops the oldest and
  increments `dropped`, which the debug panel shows rather than hiding.
- **Batching.** The store flushes on a timer, not per event — 50ms visible, 250ms hidden.
  One render per flush regardless of event rate.
- **Unknown entities.** Events for ids absent from the graph are counted and ignored.
- **Reconnect.** Exponential backoff with jitter (0.8×–1.2×) up to 30s.
- **Resync races.** `resync()` stamps a generation before awaiting and discards its result
  if a newer resync or a `stop()` happened meanwhile.
- **Subscribe before snapshot.** `start()` subscribes before loading the snapshot;
  sequence checks then preserve deltas that arrive during the load.

`runtime.diagnostics` counts each of these. If a number climbs unexpectedly, it names the
rule that fired.

## Editing

`editing/graphEditorSession.ts` models edit mode as a discriminated union rather than an
`isEditing` boolean: a session is either viewing or editing. A draft with no edit mode, or
undo history while viewing, is unrepresentable.

- Commands are pure `(graph, args) => { graph, changed, error? }`. `changed: false` is how
  a no-op is reported.
- History is capped at 50 entries.
- Structural validation is synchronous and local; `NetworkValidationService` is async and
  injectable, so a real backend check can replace the mock.
- Export is versioned; import validates with Zod and returns `{ success: false, errors }`
  rather than throwing. Because a Vue event cannot return a value, the editor asks for the
  JSON through a receiver object the container fills in.
- `useGraphEditorShortcuts` binds undo/redo/copy/paste/duplicate/delete/escape and
  releases the listener in `onScopeDispose`.
- The container guards `beforeunload` while a draft is dirty and confirms before cancel.

## Layout

Automatic layout goes through dagre in a Web Worker:

`layoutCoordinator` → `createWorkerLayoutExecutor()` → `layout.worker.ts` → positions.

Two failure paths are handled: if `Worker` is undefined or the worker errors,
`fallbackLayoutExecutor` runs dagre on the main thread. The coordinator tags each request
so a slow layout resolving after a newer one returns `{ status: "stale" }` instead of
snapping the graph back.

## Performance

- `graphSearchIndex` builds a flat id/label/metadata index once per graph.
- `graphViewAdapter` derives a detail level from zoom (compact under 0.65, detailed over
  1.2). Compact hides type labels and runtime badges; edge labels drop past 1,000 edges.
- `largeGraphFixture` generates deterministic 50 / 500 / 2,000-node graphs.
- `GraphCanvas` counts renders in `onUpdated`, never inside a `computed` — a computed
  getter that mutates reactive state is a bug this module already made once.

## Tests

42 tests across the module, none of which need a real Vue Flow canvas:

- The agnostic specs (`model/`, `editing/`, `performance/`, `realtime/`) are plain unit
  tests shared verbatim with the other boilerplates.
- `realtime/useTopologyRealtime.spec.ts` runs the composable in an `effectScope` and
  asserts snapshots reach Vue reactivity, streamed events apply through the flush timer,
  and disposing the scope disconnects the transport.
- `containers/GraphViewerContainer.spec.ts` mounts the real container with a stubbed
  canvas and covers viewer rendering, edit mode and cancel, a route result populating the
  ordered path, a no-route result keeping the topology, and Save staying disabled on a
  pristine draft.

## Extending it

- **Real backend.** Replace `MockTopologyTransport` with `WebSocketTopologyTransport`,
  passing a socket factory. Nothing above the transport changes.
- **Real snapshots.** Swap `loadSnapshot` for an API call returning
  `TopologyRuntimeSnapshot`.
- **Real persistence, validation, routing.** Implement `GraphRepository`,
  `NetworkValidationService`, `GraphRouteService`.

Each is a constructor argument or container prop, not an import to rewrite.

## Known gaps

- No Storybook stories yet. The React and Next boilerplates carry a large story set for
  this feature; this module does not.
- The editor is reachable only from the viewer's Edit button; there is no direct route.

## Open question: realtime wiring across boilerplates

The store, controller, and transport are identical in all three boilerplates. The wiring
above them is not: React and Next use `useSyncExternalStore`, this repo pushes snapshots
into a `shallowRef`. Whether that adapter should be unified — and where a server-rendered
framework should start the stream at all — is still open. It is deliberately not
prescribed here.
