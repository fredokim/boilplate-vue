# Prompt Playbook

Use these prompts to turn AI into a controlled Vue implementation partner.

## Feature Implementation

```txt
Implement this feature in the existing Vue boilerplate.

Goal:
- [Describe the user-visible result]

Scope:
- Only change [module/files].

Constraints:
- Keep feature files under src/app/modules/{feature}.
- Keep atomic components free of API calls and business flow.
- Validate backend responses with DTOs before store/view usage.
- Use Pinia for global module/session state.
- Reuse existing atomic UI, result boundary, Storybook, and SCSS/token patterns.
- Do not add dependencies unless justified.

Verification:
- Add focused tests or Storybook states.
- Run lint, typecheck, test, and build.

Before editing:
- Summarize affected files and the change plan.
```

## Senior FE Review

```txt
Review this change as a senior Vue frontend engineer.

Prioritize:
- Bugs
- Route/module boundary violations
- API calls inside atomic UI
- DTO validation gaps
- Pinia state ownership mistakes
- Accessibility issues
- Missing tests
- Bundle or dependency risks

Return findings first with file/line references.
```

## Refactoring Slice

```txt
Refactor this Vue module without changing behavior.

Goal:
- Separate view, store, API, DTO, and pure logic.
- Extract repeated logic into a composable or pure utility only when it reduces real duplication.
- Add regression tests for preserved behavior.

Rules:
- Do this in one small slice.
- Keep public route behavior stable.
- Do not add dependencies.
```
