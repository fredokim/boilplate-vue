# Design Rationale

This document explains the problem definition, component design method, key decisions, results, and retrospective behind the Vue boilerplate.

## Problem Definition

The Vue boilerplate was designed around recurring problems in Vue 3 service development.

- API response contracts are typed but not always validated at runtime.
- Pinia stores can grow into mixed containers for server data, UI state, session state, and derived labels.
- Route views often contain data fetching, permission checks, form logic, rendering, and error handling together.
- Atomic UI components are useful, but composition rules are needed for real product screens.
- Storybook, MSW, memory checks, and API smoke checks are often added after structure has already drifted.

The goal was to make a Vue foundation where API contracts, state ownership, routing, UI components, and verification are designed together.

## Component Design Method

Vue components are split by feature, state ownership, and UI responsibility.

| Layer | Responsibility |
| --- | --- |
| Module Route | Lazy route entry and route metadata |
| View | Page-level composition and props-to-template rendering |
| Store | Pinia state, actions, and module-level state ownership |
| Composable | Reusable behavior such as forms, theme, notification, route menu, or infinite scroll |
| DTO/API | Runtime validation and typed HTTP access |
| Atomic Component | Reusable atoms, molecules, and organisms |
| Story | UI state documentation and mock scenarios |

Reference pattern:

```txt
src/app/modules/example/
  api/
    example.api.ts
  dto/
    Example.dto.ts
  store/
    example.store.ts
  views/
    ExampleView.vue
  router/
    routes.ts
```

The intent is to keep feature logic close to the module while keeping cross-cutting concerns in `src/core`.

## Key Decisions

### 1. Keep DTO validation in the API layer

DTO decorators validate backend responses before the data reaches stores or views.

Why:

- Runtime contract drift should be caught before UI rendering.
- API errors, validation errors, and frontend request failures need different handling.
- Stores can work with trusted data instead of defensive payload checks.

### 2. Use Pinia as global/module state, not as a dumping ground

Pinia owns app/session/module state, while temporary UI behavior stays local or in composables.

Why:

- Global stores stay easier to reason about.
- Local UI state does not become accidental application state.
- Feature modules can remain portable.

### 3. Use atomic UI with composition examples

Atomic components are paired with Storybook examples for forms, data display, loading, empty, error, modal, and pagination states.

Why:

- Teams need both small reusable controls and realistic screen compositions.
- State examples prevent each page from inventing its own loading/error UI.
- Storybook becomes a review surface for design-system consistency.

### 4. Include performance and API smoke checks

The boilerplate includes memory smoke and API smoke scripts in addition to lint, typecheck, test, build, and Storybook checks.

Why:

- Vue apps with large lists and long-lived state can regress in memory behavior.
- API contract failures should be tested separately from UI rendering.
- Performance concerns should be visible before production.

## Results

- Vue 3/Vite/TypeScript foundation with Pinia, DTO validation, Storybook, and atomic UI.
- Lazy route module structure with route metadata.
- Auth/session pattern with token storage and route guards.
- Component generator for atomic UI, stories, tests, and exports.
- Verification through unit tests, Storybook build, Playwright e2e, memory smoke, and API smoke scripts.

## Retrospective

What worked:

- DTO validation keeps backend contract issues out of view components.
- Pinia plus composables gives a clear split between module state and reusable behavior.
- Atomic UI stories make loading, empty, and error states more consistent.
- Memory/API smoke scripts align well with data-heavy Vue service screens.

Trade-offs:

- Atomic design alone is not enough; module composition rules still need documentation.
- Pinia store boundaries require review when features grow.
- Full automation may be more than a small MVP needs.

Next improvements:

- Add lightweight, standard, and strict presets.
- Add more real-world table, filter, and permission examples.
- Expand generator support for module-level API, DTO, store, view, and stories together.
- Add a clearer migration guide for legacy Vue 2 screens moving into this structure.
