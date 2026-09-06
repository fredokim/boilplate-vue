# Vue Boilerplate Architecture

## Boundaries

- `app/components/atomic/atoms`: reusable controls with no API, router, or store dependency.
- `app/components/atomic/molecules` and `organisms`: composed UI, still props-in/events-out.
- `app/components/atomic/adapters`: the only place an atom is bound to form or modal plumbing.
- `app/components/global`: app-level singletons such as snackbars and dialogs.
- `app/modules/*/views`: props-only feature UI.
- `app/modules/*/containers`: state, routing, service, and analytics wiring.
- `app/modules/*/composables`: reactive logic that a view should not own.
- `app/modules/*/dto` and `app/dto`: runtime API contracts.
- `app/modules/*/router/routes.ts`: the file the router glob picks up. A `route/`
  directory is not scanned.
- `app/store`: Pinia stores for session and cross-module UI state.
- `core`: cross-module infrastructure — API client, auth, analytics, observability,
  theme, form, and shared composables.

## UI Rules

- Put reusable controls in Storybook with at least default, loading/error/empty, and
  disabled states when relevant.
- Tailwind is used for component-level styling.
- SCSS is reserved for layout/page shells and for third-party widget overrides.
- Atoms take `v-model` and emit events. They do not reach into stores or services.
- Avoid importing module logic into atomic UI.

## Data Rules

- API responses must pass DTO validation before reaching a view. `apiClient` wraps the
  response in the envelope DTO and validates both layers.
- Zod validates user input before mutations.
- Pinia owns session and client UI state.
- Server/cache state has no global library. Where a module needs deduplication and stale
  windows, it owns a small cache; see the server-state caching decision in
  `DEPENDENCY_STRATEGY.md`.

## Reactivity Rules

- Composables clean up in `onScopeDispose`, never in a component hook, so they work
  inside a bare `effectScope` and can be tested without mounting anything.
- `computed` getters stay pure. Counters and side effects belong in `onUpdated` or an
  explicit watcher.
- Prefer `shallowRef` for values replaced wholesale, such as store snapshots.

## Mock Scenarios

Use `src/test/msw/handlers.ts` and `src/test/msw/mock-registry.ts` for consistent API
states: success, empty, invalid DTO, backend error, and timeout. Tests and stories should
reuse these instead of creating one-off mock shapes.

## Framework-Agnostic Modules

The interactive examples keep their domain logic free of Vue on purpose — the graph
model, editing commands, layout, realtime store, and dashboard builder are plain
TypeScript. The same files exist in the React and Next boilerplates. When changing one,
consider whether the change belongs in the shared logic or in the Vue layer above it.
