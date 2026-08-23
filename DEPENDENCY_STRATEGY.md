# Dependency Strategy

This boilerplate keeps Vue dependencies focused around typed contracts, atomic UI, Pinia state, and fast Vite builds.

## Keep

- `vite`: primary Vue bundler. It keeps dev, Storybook, Vitest, and bundle analysis aligned.
- `@vitejs/plugin-vue`: required Vue SFC transform plugin.
- `pinia`: global/session/module state.
- `vue-router`: route meta, permission checks, lazy pages, and layout routing.
- `axios`: retained while request/response interceptors are first-class architecture.
- `class-validator`, `class-transformer`, `reflect-metadata`: retained for decorator DTO runtime validation.
- `zod`: form and local state validation.
- `mitt`: small typed event bus.
- `@vueuse/core`: composable helpers where it reduces browser API boilerplate.
- `tailwindcss`, `sass`: utility-first components plus SCSS layout/page structure.
- `msw`: mock API scenarios for local and Storybook workflows.

## Avoid

- Adding a second global state library beside Pinia.
- Adding UI kits that hide atomic component ownership.
- Adding vendor SDKs directly to Vue components. Use adapters.
- Adding browser helpers that duplicate a small existing composable or VueUse primitive.
- Adding date libraries for basic formatting, ranges, and relative labels. Use `src/core/utils/date-utils.ts` first.

## Replace Later

- `axios` can be replaced by native `fetch` only if interceptor behavior, typed failures, and cancellation are preserved.
- Decorator DTO validation can be replaced by schema-first validation only if API response typing, error ownership, and generator output are migrated together.
- Vite major upgrades should be done with `@vitejs/plugin-vue`, Storybook, Vitest, and `vue-tsc` compatibility checked together.
- Tailwind v4 migration should be a dedicated styling migration.

## Review Checklist

- Run `npm run check:deps` before adding a runtime dependency.
- Runtime dependencies above 6MB installed size need a written reason or a lighter alternative.
- Is the package used in production code, generator output, tests, or Storybook?
- Does Vue, Pinia, Vue Router, or VueUse already solve it?
- Does it increase client bundle size?
- Can it be lazy-loaded or kept in dev dependencies?
- Is there a typed adapter boundary so it can be swapped later?
