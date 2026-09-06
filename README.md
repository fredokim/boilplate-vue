# Vue TypeScript Boilerplate

Vue 3, Vite, TypeScript, Pinia, DTO validation, Storybook, and an atomic
design-system scaffold.

## Quality Gate

Development and CI are guarded by generated design tokens, ESLint, TypeScript,
unit tests, app build, and Storybook build.

```bash
npm run dev
npm run check:ci
npm run check:automation
npm run generate -- feature order Order
npm run generate -- contract product
npm run generate -- layout AdminShell
npm run generate -- page orders list
```

`any` is blocked by ESLint. Prefer `unknown`, generics, DTO classes, and type
guards. Avoid inline `eslint-disable` comments unless the team documents the
reason in code review.

## API Contract Pattern

DTO classes live near feature modules and are validated through `@core/api`.
A backend response contract mismatch is reported as a typed backend error, while
network/request setup failures are reported as frontend errors.

See `src/app/modules/user` for the reference feature:

- DTO: `dto/User.dto.ts`
- API client: `api/user.api.ts`
- Pinia store: `store/user.store.ts`
- Lazy route view: `views/UserContractView.vue`

## Auth Session Pattern

JWT sessions are centralized through the auth store and API client.

- `@core/auth/token-storage`: access/refresh token persistence.
- `@core/api/http-client`: automatic `Authorization: Bearer` injection.
- `src/app/modules/auth`: login, session, and refresh API contract.
- `src/app/store/auth.store.ts`: login, session check, refresh, logout state.
- `src/app/router/index.ts`: `meta.auth` and `meta.permission` route guard.

Backend endpoints expected by the scaffold:

- `POST /api/auth/login`
- `GET /api/auth/session`
- `POST /api/auth/refresh`

Social login is intentionally prepared but disabled until provider keys are
available. Enable providers from `src/app/modules/auth/social/social-provider.ts`
and connect these backend contracts later:

- `GET /api/auth/oauth/{provider}/authorize`
- `POST /api/auth/oauth/{provider}/callback`

## Atomic Design

Atomic UI components live in `src/app/components/atomic`.

```bash
npm run storybook
npm run generate:component -- atom BaseDateInput
```

The generator creates the component, Storybook story, unit test, and index export.

## Testing

```bash
npm run test
npm run test:coverage
```

Use component tests for UI behavior and DTO tests for API contract boundaries.

## Added Architecture Standards

- Unified generator entry: `npm run generate -- <feature|component|contract|form|layout|page|api>`.
- Contract generator: `npm run generate -- contract product` creates DTO, form schema, state schema, mock data, and validation spec files.
- Form generator: `npm run generate -- form product` creates a schema-inferred Vue form view and Storybook story.
- Layout/page generators create reusable layout shells, module routes, page views, stories, and page specs.
- Automation checks: `npm run check:automation` enforces Storybook presence, validation coverage, and MSW mock registry presence.
- Dependency checks: `npm run check:deps` flags oversized runtime packages before they become defaults.
- Bundle budget: `npm run check:bundle` fails CI when built JS chunks exceed the configured size cap.
- Form validation: Zod validates user input before store/API mutations.
- Date utilities: common date parsing, formatting, ranges, and relative labels live in `src/core/utils/date-utils.ts`.
- API validation: DTO decorators continue to validate backend responses.
- Observability: logger, error reporter, performance reporter, and analytics are adapter-based.
- State management: Pinia remains the source for global app/session/module state.
- Testing: Vitest, Storybook build, Playwright e2e, memory smoke, and API smoke scripts are available.

## Documentation

Everything below is reachable from here, and `npm run check:docs` fails if a
document stops being.

**Architecture** — what the boundaries are and why

- [ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md) — module boundaries, UI/data rules, and reactivity rules.
- [DESIGN_RATIONALE.md](docs/architecture/DESIGN_RATIONALE.md) — problem definition, component design method, key decisions, and retrospective.
- [REALTIME_INTEGRATION.md](docs/architecture/REALTIME_INTEGRATION.md) — binding the stream to Vue reactivity, and why `shallowRef` and `onScopeDispose` are required.
- [VISUAL_GRAPH.md](docs/architecture/VISUAL_GRAPH.md) — layer map, Vue Flow swap, realtime pipeline, and editing model for the graph module.

**API** — the contract with the backend

- [API_CONTRACT.md](docs/api/API_CONTRACT.md) — backend response envelope and typed error ownership.
- [`boilplate-server`](https://github.com/fredokim/boilplate-server) — the shared backend. Setup, request flow and envelope ownership live in its own README.

**Development** — how to work in here

- [CONTRIBUTING.md](docs/development/CONTRIBUTING.md) — checklist for new components, composables, and modules.
- [FEATURE_CONTRACT.md](docs/development/FEATURE_CONTRACT.md) — what files a module is made of. `npm run check:generators` enforces it.
- [CODE_REVIEW_CHECKLIST.md](docs/development/CODE_REVIEW_CHECKLIST.md) — review checklist for AI-generated Vue code.
- [DEPENDENCY_STRATEGY.md](docs/development/DEPENDENCY_STRATEGY.md) — package replacement and dependency review rules.
- [I18N_STRATEGY.md](docs/development/I18N_STRATEGY.md) — typed dictionary, fallback locale, and formatting.
- [AI_WORKFLOW.md](docs/development/AI_WORKFLOW.md) — where AI is allowed to draft and where the developer decides.
- [AI_DEVELOPMENT_GUIDE.md](docs/development/AI_DEVELOPMENT_GUIDE.md) — implementation rules for AI agents and teammates.
- [PROMPT_PLAYBOOK.md](docs/development/PROMPT_PLAYBOOK.md) — prompts for implementation, review, refactoring, and testing.

Three guides live beside the code they describe rather than in `docs/`, because
that is where someone browsing the directory will find them:
[atomic components](src/app/components/atomic/README.md),
[Pinia stores](src/app/store/README.md),
[analytics hooks](src/core/analytics/README.md), and
[the generators](scripts/README.md).

MSW handlers live under `src/test/msw` for backend-free feature testing.

**Deployment**

- [DEPLOYMENT.md](docs/deployment/DEPLOYMENT.md) — one origin, the proxy, and what the browser must never see.

**History** — records of a past state, kept rather than maintained

[`docs/history/`](docs/history) holds the AI changelog, the refactoring case
study, the performance report, and the planning prompts. They describe the
repository as it was, so `check:docs` does not hold them to today's layout.

**Ecosystem** — [BOILPLATE](https://github.com/fredokim/BOILPLATE) introduces all
four repositories and holds the decisions that span them.

## Performance Tooling

Vendor-neutral analytics hooks are available under `src/core/analytics`.

- API duration is tracked inside the typed HTTP client.
- Route duration and page views are tracked from the router.
- Web Vitals are collected through `web-vitals`.
- Future GA/GTM/PostHog/Sentry integrations can replace the no-op analytics provider.

Performance scripts:

```bash
npm run perf:bundle
npm run perf:lighthouse
npm run perf:memory
```

API load testing uses k6, which must be installed separately:

```bash
k6 run tests/performance/api-smoke.k6.js
```

## Design tokens

Colours, spacing, radii, and shadows come from `tokens/tokens.json`, which the
React, Next.js, and Vue boilerplates share. `src/core/theme/tokens.ts` and
`src/assets/scss/generated/` are generated from it; editing them is undone by
the next build.

```bash
# after editing tokens/tokens.json
npm run tokens:build
```

`npm run check:tokens` renders the outputs and compares them against what is
committed, failing with the file, line, and both values when they differ. It
runs as part of `check:ci`. It compares rather than regenerating on purpose: a
check that rewrites the file it is checking cannot fail.

Light and dark themes are both defined in the source and emitted as
`:root[data-theme]` blocks, as before.

`TOKEN_INVENTORY.md` in the React repository records what the three sets looked
like before they were merged, including two tokens that were deliberately not
merged.

## Module generator

```bash
npm run generate:feature -- billing-report            # infers BillingReport
npm run generate:feature -- billing-report Billing    # explicit resource name
```

Creates the DTO, api module, Pinia store, view, `router/routes.ts`, story, spec,
and a README. The router collects `modules/**/router/routes.ts`, so a generated
module is reachable without editing the router.

`FEATURE_CONTRACT.md` records what a generated module contains and why, derived
from the modules that already exist rather than copied from the React
boilerplate — the conventions genuinely differ.

`npm run check:generators` runs the generator and checks its output against the
contract; it is part of `check:ci`. Regenerating over an existing module refuses
rather than overwriting.

## Backend

The API lives in [boilplate-server](https://github.com/fredokim/boilplate-server),
shared with the React and Next.js boilerplates.

```bash
npm run dev                # demo data, no backend needed
npm run dev:server-mode    # proxies /api to a backend on 127.0.0.1:3001
npm run check:contract     # this app's calls against the backend's published spec
npm run contract:sync      # refresh contracts/openapi.json from a local checkout
```

`VITE_DATA_MODE` decides where data comes from, and a production build refuses
mock mode. Every request path must start with `/api`, or the dev proxy will not
forward it — see DEPLOYMENT.md.
