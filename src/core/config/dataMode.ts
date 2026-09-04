/**
 * The single decision about where data comes from.
 *
 * `VITE_DATA_MODE` decides for every module. Per-module variables still exist
 * as an override *within* the chosen mode, for bringing one module up against
 * the real server while the rest stay on demo data.
 *
 * What "mock" means here is not what it means in the React boilerplate. There
 * is no browser-side MSW in this repository — `setupWorker` is never called and
 * there is no worker file in `public/`. MSW is used by tests and by one
 * Storybook story, both of which run in Node. In the browser, mock mode means
 * the screens offer demo data of their own: the login view's "Use demo session"
 * button, and the demo buttons on generated feature views.
 */
export type DataMode = "mock" | "server";

const rawMode: unknown = import.meta.env.VITE_DATA_MODE;

function resolveMode(): DataMode {
  if (rawMode === "server") return "server";
  if (rawMode === "mock" || rawMode === undefined || rawMode === "") return "mock";

  // A typo like `VITE_DATA_MODE=prod` must not silently mean "mock". Failing
  // here is loud and immediate; falling back would be neither.
  //
  // The value is described rather than stringified: `String()` on a non-string
  // produces "[object Object]", which says nothing about what was set.
  const received = typeof rawMode === "string" ? `"${rawMode}"` : typeof rawMode;

  throw new Error(`VITE_DATA_MODE must be "mock" or "server". Received: ${received}`);
}

export const dataMode: DataMode = resolveMode();

/**
 * Mock mode in a production build is refused, not warned about.
 *
 * The failure it prevents is a deployed application that looks like it works —
 * it renders, it navigates, it shows data — while every value on the screen was
 * made up locally. Nobody notices that from the UI, which is exactly why it has
 * to be impossible rather than discouraged.
 */
if (import.meta.env.PROD && dataMode === "mock") {
  throw new Error(
    "VITE_DATA_MODE=mock is not allowed in a production build. " +
      "A production bundle on demo data looks healthy while showing values the server never sent.",
  );
}

/** A per-module override, valid only within the chosen mode. */
function moduleMode(value: unknown): DataMode {
  if (value === "server") return "server";
  if (value === "mock") return "mock";
  return dataMode;
}

export const topologyMode = moduleMode(import.meta.env.VITE_TOPOLOGY_SOURCE);
export const chatMode = moduleMode(import.meta.env.VITE_CHAT_SOURCE);

/**
 * Whether a screen may offer to fabricate a session.
 *
 * In server mode it must not. The demo session carries a token the backend
 * never issued, so the first authenticated request fails — which reads as a
 * broken login rather than as demo data, and sends whoever clicked it looking
 * for a bug in the auth flow.
 */
export const shouldOfferDemoSession = dataMode === "mock";
