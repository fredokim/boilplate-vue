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

## AI And API Guidance

- `DESIGN_RATIONALE.md`: problem definition, component design method, key decisions, results, and retrospective.
- `AI_DEVELOPMENT_GUIDE.md`: implementation rules for AI agents and teammates.
- `API_CONTRACT.md`: backend response envelope and typed error ownership.
- `ARCHITECTURE.md`: module boundaries, UI/data rules, and reactivity rules.
- `CONTRIBUTING.md`: checklist for new components, composables, and modules.
- `DEPENDENCY_STRATEGY.md`: package replacement and dependency review rules.
- `AI_WORKFLOW.md`: AI-assisted Vue workflow and verification gates.
- `PROMPT_PLAYBOOK.md`: prompts for implementation, review, refactoring, and testing.
- `CODE_REVIEW_CHECKLIST.md`: review checklist for AI-generated Vue code.
- `AI_REFACTORING_CASE_STUDY.md`: Vue before/after refactoring playbook.
- `PERFORMANCE_REPORT.md`: route, bundle, dependency, Web Vitals, and memory guardrails.
- `I18N_STRATEGY.md`: typed dictionary, fallback locale, and formatting strategy.
- `AI_CHANGELOG.md`: AI-assisted work log and verification notes.
- MSW handlers live under `src/test/msw` for backend-free feature testing.

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
