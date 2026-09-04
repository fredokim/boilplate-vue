# Atomic Design Components

This directory is for UI-only design system components.

## Rules

- `atoms` contain primitive UI only.
- `molecules` compose atoms, but do not own feature business logic.
- `organisms` compose molecules for larger UI sections.
- `templates` describe page-level layout slots.
- `adapters` connect UI-only components to application logic.

Designers and UI contributors should be able to change files under
`atoms`, `molecules`, and `organisms` without changing API or domain logic.

Application logic should be injected through props, emits, slots, or adapter
components.

## Input Strategy

Inputs are intentionally split by use case:

- `BaseInput`: primitive input rendering and state styling.
- `TextInput`: text-specific preset.
- `PasswordInput`: password-specific preset with visibility control.
- `BaseSelect`: native select with typed options.
- `BaseCheckbox`: boolean checkbox.
- `BaseRadioGroup`: string radio group.
- `BaseTextarea`: multiline text input.
- `BaseBadge`: status or category marker.
- `BaseAvatar`: image or initials avatar.
- `BaseSwitch`: boolean switch.
- `BaseTooltip`: hover/focus tooltip.
- `BaseIconButton`: compact circular icon action.
- `SearchInput`: dashboard search input.
- `BaseSpinner`: loading spinner.
- `BaseSkeleton`: loading placeholder.

## Composition Components

- `FormField`: label, help text, and error state wrapper.
- `BaseTabs`: tab trigger shell with active slot state.
- `BaseDropdown`: native details-based action menu.
- `BasePagination`: page navigation.
- `BaseScrollArea`: bounded scroll container.
- `BaseModal`: common modal shell.
- `BaseTable`: slot-friendly table shell.
- `PaginatedTable`: table and pagination composition for client-side paging.
- `InfiniteScrollList`: scroll list with observer cleanup and retained render cap.
- `EmptyState`: standardized no-data state.
- `LoadingState`: standardized spinner or skeleton loading state.
- `ErrorState`: standardized typed failure state.
- `ResultBoundary`: switches loading, error, empty, and success content.
- `AppTopbar`: DashStack-style dashboard header.
- `AppSidebar`: DashStack-style dashboard sidebar.
- `DashboardShell`: composed dashboard layout shell.
- `DataToolbar`: table/list toolbar.

## Modal Strategy

`BaseModal` is a UI-only shell. The modal body is supplied through slots, so
feature screens can replace only the content while preserving the same overlay,
header, close button, footer, spacing, and accessibility shape.

`ModalContentHost` is an adapter for HOC-like usage. It receives a component and
mounts it inside `BaseModal`.

More inputs should be added as separate variants when they carry distinct UX:

- `SearchInput`
- `NumberInput`
- `CurrencyInput`
- `DateInput`
- `TextareaInput`
- `FileInput`
- `OtpInput`

Each input remains UI-only. Validation, API binding, and form orchestration live
in adapters or feature modules.

## Styling Rule

Common UI components use Tailwind utility classes in the component template.
Layout and page skeleton styling should live in SCSS files.

## Storybook

Storybook is the working surface for UI-only components.

```bash
npm run storybook
npm run build-storybook
```

Stories live under `src/app/components/atomic/stories`.

Keep stories focused on component states and composition examples. Do not import
API clients, router guards, or feature stores into atomic stories.

## Generator

Use the component generator to create the component, story, unit test, and index
export in one step.

```bash
npm run generate:component -- atom BaseIconButton
npm run generate:component -- molecule SearchField
npm run generate:component -- organism DataToolbar
```

## Prop Naming Standard

Use the shared names from `types.ts` before introducing a new prop name:

- `variant`: visual style family such as solid, outline, ghost.
- `tone`: semantic color such as primary, success, warning, error.
- `size`: component scale such as sm, md, lg.
- `radius`: border radius token.
- `state`: interactive or validation state such as idle, invalid, readonly.

## Test Rule

Every generated component receives a basic render test. Expand it when the
component owns interaction, keyboard behavior, validation state, or emitted
events.

## Table And Scroll Strategy

Use `PaginatedTable` when users need stable page positions, totals, and direct
navigation. It composes `BaseTable` and `BasePagination` so page slicing is not
reimplemented in feature screens.

Use `InfiniteScrollList` when the feed grows by cursor or page. It keeps the
intersection observer scoped to the component lifecycle and only renders the
latest `maxItems` entries to reduce long-list DOM and memory pressure. The
source array is not mutated, so feature stores can decide whether to keep,
cache, or prune server data.

## Result State Strategy

Feature screens should prefer `ResultBoundary` over hand-written `v-if` chains
for loading, empty, and typed API failures. Store failures can pass the
`origin`, `kind`, `code`, and `message` produced by DTO/API validation so users
and developers can tell frontend request issues from backend contract issues.
