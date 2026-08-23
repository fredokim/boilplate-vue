# Contributing

## Before Coding

1. Check the target boundary: `atom`, `molecule`, `organism`, `view`, `container`,
   `composable`, `store`, `dto`, or `core`.
2. Reuse existing components before adding new ones. The atomic library is broad.
3. Keep API and store logic out of views and atoms.
4. Put new module routes in `modules/{name}/router/routes.ts`. The router globs
   `modules/**/router/routes.ts` and will not see any other path.

## New Component Checklist

1. Create the component under `src/app/components/atomic/{atoms,molecules,organisms}`.
2. Export it from `src/app/components/atomic/index.ts`.
3. Add a Storybook story with normal and edge states.
4. Add a focused `*.spec.ts` for rendering or interaction.
5. Keep props explicit and avoid `any`.

The generator does this baseline automatically:

```bash
npm run generate -- component SearchInput
```

## New Composable Checklist

1. Put cross-module composables in `src/core/composables`, module-specific ones in
   `modules/{name}/composables`.
2. Clean up in `onScopeDispose`, not `onUnmounted`, so the composable works inside a
   bare `effectScope`.
3. Test it by running it in an `effectScope` rather than mounting a component.

## Verification

Run this before finishing a feature:

```bash
npm run check:ci
```

That chain is lint, typecheck, tests, the AI-workflow and automation gates, dependency
size, build, bundle budget, and Storybook build. To iterate faster, run the pieces:

```bash
npm run lint
npm run typecheck
npm run test
npm run build-storybook
```
