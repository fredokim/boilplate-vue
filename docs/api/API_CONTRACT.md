# API Contract

**Field lists are not here.** The server's
[`openapi.json`](https://github.com/fredokim/boilplate-server/blob/main/openapi.json)
is the authoritative description of every request and response shape, it is
regenerated on every build, and `src/test/contract` compares this repository's
DTOs against it in four directions. A table of fields in a Markdown document
could only ever be a second, slower, wrong copy.

This document is for what a schema cannot say: what an error *means*, who is
allowed to call what, what the socket promises, what is safe to retry, and which
of three numbers orders things.

---

## Error semantics

Every response uses one envelope:

```json
{ "success": true, "data": {} }
```

```json
{ "success": false, "error": { "code": "AUTH_REQUIRED", "message": "Authentication is required." } }
```

> This document described a different envelope —
> `{ status: "SUCCESS" | "FAILURE", code?, message?, data }` — long after the code
> stopped using it. No response from the shared backend can satisfy that shape:
> there is no `status` field in it, so validation failed before any call could
> succeed. `api-response.dto.ts` was corrected and this document was not, which is
> the exact kind of drift a contract document is supposed to prevent.

`data` is optional on the DTO, because a failure envelope carries `error` and no
`data`. Declaring it required would turn every backend error into a validation
error and point at the wrong thing.

**HTTP status describes the transport outcome; `error.code` describes the domain
outcome.** Several codes share a status, and a code keeps its meaning even if the
status changes — so client code branches on the code, never on the status. The
full code table is
[in the React boilerplate's copy of this document](https://github.com/fredokim/boilplate-react/blob/main/docs/api/API_CONTRACT.md#error-semantics);
the codes are the server's and identical for all three clients.

**Where a failure came from is two axes, not one.** `ApiError` carries an
`origin` and a `kind`, and the pair is what a store keeps:

| `origin` | `kind` | Means |
| --- | --- | --- |
| `frontend` | `network` | The request was sent and no response came back. |
| `frontend` | `request_setup` | The request could not be created. |
| `frontend` | `unknown` | An unexpected frontend-side failure. |
| `backend` | `http_status` | A non-2xx status. |
| `backend` | `business_status` | The envelope reported failure. |
| `backend` | `response_contract` | The response did not match the DTO. Our contract is wrong, or the backend moved. |

Feature stores preserve `origin`, `kind`, `code` and `message` in `StoreFailure`
so `ResultBoundary` can render something actionable rather than "an error
occurred".

## Authentication policy

**The access token lives in memory. The refresh token is an `HttpOnly`,
`SameSite=Lax` cookie scoped to `/api/auth`, never in a response body and never
in browser storage.** `localStorage` is readable by any injected script, and a
refresh token is the credential that mints new ones —
[ADR 0007](https://github.com/fredokim/BOILPLATE/blob/main/docs/adr/0007-refresh-cookie-and-one-origin.md)
is the reasoning.

`SameSite=Lax` has an architectural consequence, not a deployment preference:
**the browser must see one origin.** In development Vite proxies `/api`
(`VITE_API_TARGET`); in production Caddy does (`BACKEND_ORIGIN`). A browser
calling the backend directly works for plain requests and silently fails to
refresh, which looks like random logouts.

**Refresh is single-flight.** A page that fires five requests into an expired
token must send one refresh, not five — against a rotating token, four of them
would present one that has already been replaced. See
`src/core/api/refresh-single-flight.ts`.

**Which permission each route requires** is the server's policy and is listed
once, in
[its ARCHITECTURE.md](https://github.com/fredokim/boilplate-server/blob/main/docs/architecture/ARCHITECTURE.md).
Three hand-maintained copies would disagree within a month, and `openapi.json`
cannot carry it — the specification says an operation is secured, and the
permission strings appear nowhere in it.

### Social sign-in is not backed by anything

`src/app/modules/auth/api/auth.api.ts` calls
`/api/auth/oauth/{provider}/authorize` and `/api/auth/oauth/{provider}/callback`.
**The shared backend implements neither**, and grepping it for `oauth` returns
nothing.

This is a recorded divergence rather than an oversight: the client-side flow is
prepared for when provider keys exist, and the contract test carries it as a
known exception so it does not silently become "the backend removed an endpoint".
Calling either route today fails with `NOT_FOUND`.

## WebSocket delivery semantics

Two sockets, both authenticated by `?token=<access token>`. The token is a query
parameter because a browser cannot set headers on an upgrade — which is why it is
the short-lived access token and never the refresh token.

| | |
| --- | --- |
| `/api/topology` | Client sends `{ event: 'subscribe', data: { graphId, lastSequence? } }` |
| `/api/live/chat` | Client sends `{ event: 'join', data: { broadcastId, afterSequence? } }`. **Read-only** — sending goes over HTTP, where the idempotency key, the rate limit and the mute check already live. |

**Delivery is at-least-once.** The server may resend. The client de-duplicates
and orders; neither is optional.

| Server frame | Meaning |
| --- | --- |
| `subscribed` / `joined` | Attached. Says how many missed events were replayed first. |
| `event` / `message` | One domain event. |
| `deleted` | A tombstone. Clients that already have the message must drop it. |
| `resync-required` | The gap is unrecoverable. Take a fresh snapshot; do not assume continuity. |
| `heartbeat` / `pong` | Liveness only. |
| `error` | `code` is one of the server's domain codes. |

**Close codes match their HTTP cousins** so a client that learns one socket's
vocabulary does not relearn the other's: 4400 protocol, 4401 unauthenticated,
4403 forbidden, 4408 slow consumer, 4429 rate limited. The 4000–4999 range is
reserved for the application by RFC 6455.

**An unknown frame type is ignored, not fatal.** A server that has learned a new
frame is ahead of this client, not broken. A *malformed* frame is also dropped,
with a reason — every frame is validated on arrival, the same way every HTTP
response is. See
[ADR 0005](https://github.com/fredokim/BOILPLATE/blob/main/docs/adr/0005-websocket-contract-by-shared-types.md).

Streams are held in `shallowRef` and released in `onScopeDispose` — see
[REALTIME_INTEGRATION.md](../architecture/REALTIME_INTEGRATION.md) for why deep
reactivity over a high-frequency event store is the wrong tool.

## Idempotency

**Chat sends are idempotent on `clientMessageId`**, chosen by the sender and
unique per broadcast. A retry after a timeout returns the stored message rather
than posting twice, and the idempotency check runs *before* the rate limit — a
retry of something already stored must not spend budget.

`clientMessageId` never becomes the message id and orders nothing. It names a
send *attempt*.

**`POST /api/auth/logout` is idempotent**, and public: logging out with no
session is a success, not a 401.

Optimistic writes are not idempotent and are not meant to be. `expectedVersion`
makes a repeated write fail with 409 rather than silently apply twice.

## Version and sequence

Three numbers, none interchangeable. Getting them confused is the failure this
section exists for.

| | Belongs to | Means |
| --- | --- | --- |
| `version` | a dashboard or graph **document** | Optimistic lock on the structure. Every write sends `expectedVersion`; a mismatch answers 409 with `details.currentVersion`, which is what to re-read rather than blindly refetch. |
| `sequence` | a **stream** — topology events, chat messages | The order, and the resume point. Monotonic per graph or per broadcast, allocated by the server. |
| `timestamp` / `sentAt` | display | A wall clock. **Orders nothing.** |

`Graph.version` and `Graph.sequence` sit on the same object and count different
things; one is structure, the other is runtime.

**Order on `sequence`, never on the clock.** `sentAt` is `now()`, which in
Postgres is transaction *start* time, while `sequence` is handed out when the
write takes its row lock — so two concurrent writes can receive their sequences
in one order and their timestamps in the other. This client sorted on the
timestamp until it did not.

**De-duplicate on the identity, not the order.** Topology events de-duplicate on
`eventId`, chat on `id`. A replay repeats an id on purpose.

**Resume by handing back the highest sequence applied** — `lastSequence` on
topology, `afterSequence` on chat. It only ever moves forward: an out-of-order
frame must not walk the resume point backwards and cause a duplicate replay.

## Security policy

**The manifest URL is never returned with broadcast metadata and never logged.**
It is issued only through a playback session, which carries an expiry — a leaked
URL stops working on its own.

**`isLive` comes from the stored status, never from the clock.** A broadcast is
live because someone said so, not because the current time falls in a window.

**A deleted chat message keeps its row.** It is served with an empty body and
`deleted: true`, so a removal can still be audited, and it is announced to live
clients as a tombstone rather than vanishing.

**Errors carry no detail in production.** `INTERNAL_ERROR` is deliberately
uninformative to a caller; the detail is in the server's logs, correlated by
request id.

**Chat bodies are never logged.** A chat log inside an access log is a privacy
problem and a compliance one.
