# Analytics And Performance Hooks

This folder contains vendor-neutral analytics hooks.

## Current Signals

- `page_view`: emitted after every route change.
- `route_change`: route transition duration.
- `api_request`: API duration, success/failure, status, and typed error origin/kind.
- `web_vital`: CLS, FCP, INP, LCP, and TTFB from `web-vitals`.

## Privacy Rule

Do not send request bodies, passwords, tokens, authorization headers, or personal
payloads through analytics. The default service redacts known sensitive keys and
ships with a no-op provider.

## Adding GA Or Another Vendor Later

Replace the provider at app bootstrap:

```ts
import { analytics } from "@core/analytics";

analytics.setProvider({
  track(event) {
    // Send event to GA4, GTM, PostHog, Sentry, or OpenTelemetry.
  },
});
```

