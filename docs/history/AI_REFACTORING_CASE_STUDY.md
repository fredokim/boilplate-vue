# AI-Assisted Refactoring Case Study

## Goal

Document how AI can draft a refactoring while the developer controls Vue architecture and verification.

## Before

A legacy Vue module often has these symptoms:

- API calls, filtering, state, labels, and rendering mixed in one view.
- Business labels embedded directly in template code.
- Store state used where local state or route query would be enough.
- Hard to test logic without mounting the full view.

## Prompt Used

```txt
Refactor this Vue module without changing behavior.

Goal:
- Move API contract code to dto/api files.
- Keep module state in Pinia only when it is shared or persistent.
- Extract pure filtering/status logic into a tested utility.
- Keep atomic UI free of business logic.

Constraints:
- Keep route behavior stable.
- Do not add dependencies.
- Add regression tests.
```

## After

Expected split:

```txt
src/app/modules/{feature}
  api/
  dto/
  store/
  views/
  composables/
  __tests__/
```

## Human Decisions

- Decide whether state belongs in Pinia, route query, composable-local state, or component-local state.
- Decide which logic must be extracted before AI-generated changes continue.
- Keep dependency additions out unless the use case is proven.
- Require lint, typecheck, test, build, and e2e for user-facing changes.
