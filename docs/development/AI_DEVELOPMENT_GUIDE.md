# AI Development Guide

Use this guide when asking an AI agent or teammate to add features.

## Default Feature Flow

1. Create or generate a feature module under `src/app/modules/{feature}`.
2. Keep route views lazy-loaded through `router/routes.ts`.
3. Put API contracts in `dto/*.dto.ts` and validate backend responses with decorators.
4. Put typed API calls in `api/*.api.ts`.
5. Put feature state in a Pinia setup store.
6. Wrap loading, empty, and error UI with `ResultBoundary`.
7. Add Storybook stories for UI states.
8. Add focused tests for DTO contracts, stores, and interactive UI.

## Rules

- Do not use `any`. Prefer `unknown`, generics, DTOs, and type guards.
- Do not put API calls in atomic components.
- Do not put business logic in atoms, molecules, or organisms.
- Use `variant`, `tone`, `size`, `radius`, and `state` for shared component props.
- Use `StoreFailure.origin` and `StoreFailure.kind` to expose typed API failures.
- Use route `meta.auth`, `meta.permission`, `meta.title`, and `meta.layout`.
- Use Zod for user input validation and class-validator DTOs for API response validation.
- Keep observability behind adapters. Do not import GA, Sentry, or vendor SDKs directly inside UI components.
- Prefer `npm run generate -- feature <name> <Resource>` for new modules so routes, store, DTO, stories, and tests stay aligned.

## Commands

```bash
npm run generate:feature -- order Order
npm run generate -- feature order Order
npm run generate:component -- atom BaseDateInput
npm run check:ci
```

## AI Workflow Docs

- `AI_WORKFLOW.md`: what AI drafts and what the developer owns.
- `PROMPT_PLAYBOOK.md`: reusable prompts for feature work, review, testing, and refactoring.
- `CODE_REVIEW_CHECKLIST.md`: senior Vue review checklist for AI-generated code.
- `AI_REFACTORING_CASE_STUDY.md`: before/after refactoring guidance.
- `PERFORMANCE_REPORT.md`: performance guardrails and commands.
- `I18N_STRATEGY.md`: locale ownership, fallback, and formatting rules.
