# Realtime Integration (Vue)

How the streaming layer binds to Vue reactivity, what this adapter has to get right, and
what to reach for when adding another realtime feature.

The same core exists in the React and Next boilerplates. Each has its own version of this
document, because the core is identical and the binding is not.

## The line that must not move

Everything under `src/app/modules/visual-graph/realtime/` except `useTopologyRealtime.ts`
is plain TypeScript with no Vue import:

| File | Role |
| --- | --- |
| `types.ts` | Wire contract — events, snapshots, connection states |
| `transport.ts` | `TopologyRealtimeTransport` interface, `WebSocketTopologyTransport` |
| `runtimeStore.ts` | Buffering, coalescing, ordering, diagnostics |
| `controller.ts` | Connection lifecycle, flush timer, reconnect, resync |
| `mockTransport.ts`, `graphRuntimeSource.ts` | Development event sources |

All the correctness rules — ordering, duplicate suppression, coalescing, backpressure,
reconnect backoff, resync generation guards — live in the store and controller. Do not
reimplement any of them in a composable. If a rule needs changing, change it there and all
three boilerplates get it.

The store's contract is two methods:

```ts
subscribe(listener: () => void): () => void
getSnapshot(): RuntimeStoreSnapshot
```

React consumes that pair through `useSyncExternalStore`. Vue has no equivalent primitive,
so the composable does the subscription by hand — which is why the choices below matter
more here than they do in the React boilerplates.

## What to use

```ts
const runtime = shallowRef(store.getSnapshot());

const unsubscribe = store.subscribe(() => {
  runtime.value = store.getSnapshot();
});

onScopeDispose(() => {
  unsubscribe();
  controller.stop();
});
```

Three deliberate choices, each of which has a wrong alternative that looks fine at first.

### `shallowRef`, never `ref` or `reactive`

`ref()` and `reactive()` deep-proxy their contents. A runtime snapshot holds
`nodes: Record<string, NodeRuntimeState>` — up to 2,000 entries in the large fixture — plus
`edges`, `summary`, and `diagnostics`. Deep reactivity would:

- create thousands of proxies on **every flush**, 20 times a second;
- break identity comparisons, because a proxy is not the object the store stored. The
  canvas memoises on `previous.data.runtimeState === next.data.runtimeState`; wrap the
  snapshot in a deep proxy and that check is never true again, so every node re-renders on
  every flush.

The store already treats snapshots as immutable and replaces them wholesale. `shallowRef`
matches that exactly: reassigning `.value` is the only mutation, and it triggers exactly one
update.

### `onScopeDispose`, never `onUnmounted`

`onUnmounted` only works inside a component instance. `onScopeDispose` works in any
`effectScope`, which means the composable can be created and torn down without mounting
anything. That is what lets `useTopologyRealtime.spec.ts` drive the whole stream — connect,
resync, apply deltas, disconnect — with no component and no DOM.

If a composable in this module uses `onUnmounted`, its test has to mount a component, and
the test stops being about the stream.

### Getters for reactive parameters

`useTopologyRealtime` takes `selectedNodeId` as `MaybeRefOrGetter<string | null>` and reads
it with `toValue` inside a `watch`. The container passes
`() => interaction.selection.nodeIds[0] ?? null`.

Passing the raw value instead would freeze the composable to whatever was selected at setup
time. Passing a `computed` would work too; the getter form is just the lightest.

### Not Pinia

Pinia owns session and cross-module UI state. A topology stream is neither: it is transient,
scoped to one view, and torn down with it. Putting it in a store would make its lifetime
global and its teardown someone else's problem. Keep stream state in the composable.

## What this adapter must manage

### 1. The flush timer is the only update driver

The enqueue path replaces the store's snapshot to record diagnostics but does **not**
notify. Only `flush()` and `applySnapshot()` emit. That keeps a 500 events/second stream at
one Vue update per 50ms tick rather than 500 per second.

If you add a code path that emits per event, the batching is gone and the canvas will
thrash. The React boilerplate pins this with a render-count test; the equivalent here is
that `runtime.value` identity must only change on flush.

### 2. Purity of `computed`

A `computed` getter must not write reactive state. `GraphCanvas` originally counted renders
inside the `computed` that builds nodes — that is a bug Vue will warn about and whose
behaviour is undefined. Counters and side effects belong in `onUpdated` or an explicit
watcher.

### 3. Teardown covers everything the composable started

`useTopologyRealtime` starts five things: the store subscription, the connection
subscription, the controller, a stale-tick interval, and a `visibilitychange` listener. All
five are released in one `onScopeDispose`. Adding a sixth without adding its cleanup leaves
a timer feeding a disposed scope.

The spec asserts this directly: after `scope.stop()`, the transport reports `disconnected`.

### 4. Transport lifetime vs component lifetime

`networkRuntimeSource` is a module singleton, so navigating away and back reuses one
transport. That is deliberate for a page-level stream, but it means `stop()` genuinely
disconnects. If a feature needs two independent streams on one page, give each its own
source through the `realtimeSource` prop rather than sharing the singleton.

### 5. Page visibility

The controller drops the flush interval from 50ms to 250ms when `document.hidden` and
resyncs on return. The composable owns that listener and must remove it on dispose, or a
backgrounded tab keeps a dead controller alive.

## Sharp edges

- **`ref(snapshot)`** — the single most damaging mistake available here. See above.
- **Deriving inside the subscription callback.** Assign the snapshot and derive with
  `computed`. Work done in the callback runs on every flush whether or not anyone reads it.
- **Reading `runtime.diagnostics` for UI logic.** Those counters are for the debug panel.
  They change without notification, so a `watch` on them will not fire reliably.
- **Assuming a node has runtime state.** Until the first resync lands, `runtime.nodes` is
  empty and every node reads `unknown`. Views must render that state, not crash on it.
- **`onUnmounted` in a composable.** Works until someone tests it without mounting.

## Testing the adapter

Three layers, in order of cost:

1. **Store and controller** — plain unit specs, no Vue. `runtimeStore.spec.ts`,
   `controller.spec.ts`. Most realtime bugs should be caught here.
2. **The composable in an `effectScope`** — `useTopologyRealtime.spec.ts`. No component, no
   DOM. Asserts snapshots reach reactivity, deltas apply through the flush timer, and
   disposing the scope disconnects the transport.
3. **The real container** — `GraphViewerContainer.spec.ts` mounts the container with a
   stubbed canvas and covers the orchestration around the stream.

Stub the canvas, not the stream — and make the stub honour `defineExpose`, or the view's
`canvasRef.value?.focusRoute(...)` throws. Stubbing the composable proves nothing about the
adapter.

## Production signals

`runtime.value.diagnostics` is the built-in telemetry. Each counter names the rule that
fired:

| Counter | Climbing means |
| --- | --- |
| `staleIgnored` | Out-of-order delivery, or a resync racing deltas |
| `duplicatesIgnored` | The transport is redelivering |
| `unknownEntities` | Server knows topology the client does not — refetch the graph |
| `dropped` | Backpressure — the client cannot keep up with the stream |
| `coalesced` | Normal under load; the batching is doing its job |
| `reconnectCount` | Link instability |

Wire these into `src/core/analytics` and `src/core/observability` rather than logging from
the view.

## Open question: a shared reactivity adapter

React and Next bind the store with `useSyncExternalStore`; this repo binds it by hand.
Whether the hand-written binding should become a named helper — something like
`useExternalStore(subscribe, getSnapshot)` in `src/core/composables` — is worth deciding
before a second realtime feature copies the current code. It is not decided here.
