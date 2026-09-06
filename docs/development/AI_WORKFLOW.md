# AI-Assisted Vue Frontend Workflow

This workflow defines how AI is used in this Vue boilerplate without giving up engineering ownership. AI can draft
module files, DTOs, stories, tests, and refactoring slices; the developer owns route boundaries, Pinia state ownership,
API contracts, accessibility, performance, and release risk.

## Operating Principles

- Keep atomic components free of API calls and business flow.
- Keep feature work inside `src/app/modules/{feature}`.
- Validate backend responses with DTO decorators before store/view usage.
- Treat AI output as draft code until lint, typecheck, tests, build, and reviewer checks pass.
- Prefer generator-backed files so routes, stores, DTOs, stories, and tests stay aligned.

## AI-Owned Draft Work

- Generate module scaffolds from existing feature conventions.
- Draft DTOs, Zod schemas, Pinia store tests, and mock payloads.
- Expand Storybook states for loading, empty, error, and populated cases.
- Identify repeated logic and propose composable/store refactoring slices.
- Draft Playwright, memory smoke, or API smoke scenarios.

## Developer-Owned Decisions

- Route/module boundaries and lazy-loading strategy.
- State ownership: Pinia, route query, composable-local state, or component-local state.
- API contract shape and backwards compatibility.
- Accessibility acceptance criteria.
- Performance tradeoffs such as route splitting, bundle size, Web Vitals, and dependency cost.
- Rollout risk and operational monitoring.

## Verification Gate

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
npm run check:automation
```

For dependency, Storybook, or performance-related changes:

```bash
npm run check:deps
npm run check:bundle
npm run build-storybook
npm run perf:memory
```

## Portfolio Summary

AI is used to accelerate implementation drafts, while senior frontend decisions remain under human review: module
boundaries, API contract validation, Pinia state ownership, performance, accessibility, and verification.
