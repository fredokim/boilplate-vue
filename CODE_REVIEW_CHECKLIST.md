# AI-Assisted Vue Code Review Checklist

## Boundaries

- Atomic components do not own API calls or business flow.
- Feature code stays under `src/app/modules/{feature}`.
- DTO validation happens before store or view usage.
- Route metadata for auth, permission, title, and layout is intentional.

## State

- Pinia owns global app/session/module state.
- Route query owns shareable filters and deep links.
- Component-local state owns isolated UI interaction.
- Composables are introduced only when ownership is clearer or duplication is real.

## UI Quality

- Existing atomic components and design tokens are reused.
- Loading, empty, and error states are represented through shared patterns.
- Interactive controls have accessible names and keyboard behavior.
- Storybook covers reusable UI variants.

## Performance

- Lazy routes are preserved.
- New dependencies are justified and checked.
- Lists have stable keys and bounded rendering.
- Web Vitals, memory smoke, and bundle budget are considered for heavy UI.

## AI-Specific Review

- The change does not invent requirements.
- The implementation follows repository conventions.
- The diff is smaller than the problem it solves.
- Tests cover AI-generated branches or extracted logic.
- Verification commands are reported.
