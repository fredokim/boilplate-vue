# Deployment

## The browser must see one origin

The backend lives in [boilplate-server](https://github.com/fredokim/boilplate-server)
and is shared with the React and Next.js boilerplates.

Its refresh token is an HttpOnly cookie with `sameSite: 'lax'`. Serve this app
from a different origin than the API and the browser never sends it: sign-in
appears to work, and then the session ends without explanation the moment the
access token expires. The two WebSocket gateways fail the same way.

So this app does not call the backend across origins. **It proxies `/api` to
it**, and the browser sees one origin.

This is also why every request path starts with `/api`. A call written without
that prefix is not forwarded — it reaches the SPA fallback and comes back as a
200 with an HTML body, which then fails at DTO validation pointing somewhere
else entirely. Three dashboard calls were written that way; `npm run
check:contract` is what now catches it.

### Development

`vite.config.ts` proxies `/api`, WebSocket upgrades included.
`VITE_API_TARGET` points it somewhere other than `http://127.0.0.1:3001`.

```bash
npm run dev                          # demo data, no backend needed
npm run dev:server-mode              # against a backend on 127.0.0.1:3001
VITE_API_TARGET=https://api.example.com npm run dev:server-mode
```

### Production

The build is static files. Deploy them to a host that can rewrite `/api/*` to
the backend — Vercel, Netlify, and Cloudflare Pages all express this as a
rewrite rule, and a plain reverse proxy does it in a few lines. What matters is
that the rewrite happens on the server side, so the browser only ever sees one
origin. A client-side redirect or an absolute API URL does not work: both put
the cookie back in cross-site territory.

`VITE_DATA_MODE=server` is required for a production build that talks to the
backend. Mock mode is refused at startup in a production build — the bundle
still compiles, because the guard throws at runtime, so checking `vite build`'s
exit code proves nothing here.

---

## What mock mode means here

There is no browser-side MSW in this repository. `setupWorker` is never called
and there is no worker file in `public/`; MSW is used by tests and one
Storybook story, both in Node.

In the browser, mock mode means the screens offer their own demo data — the
login view's "Use demo session" button, and the demo buttons on generated
feature views. Server mode hides that button, because a fabricated session
carries a token the backend never issued and the first authenticated request
then fails in a way that reads as a broken login.

---

## What has not been verified

- **Nothing has been deployed.** The app has run against a hosted PostgreSQL
  from a developer machine, through the Vite proxy. No rewrite rule on a real
  host has been exercised, so TLS termination, `TRUST_PROXY` on the backend, and
  a platform's idle timeout on a WebSocket are all untested.
- **Social login has no backend.** The `social/` module demonstrates the OAuth
  redirect shape; the shared backend implements first-party credentials only.
  The contract test lists those two endpoints as unbacked by design.
