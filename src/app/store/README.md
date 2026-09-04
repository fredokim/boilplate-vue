# Pinia Stores

Pinia is the default state layer for the Vue boilerplate.

## Role

Use Pinia for state that should survive across components or routes:

- authenticated user/session state
- app boot or environment state
- layout and page UI state
- feature/domain state

Do not use Pinia for one-off UI events such as toast, confirm, or dynamic dialog
open events. Use the typed event bus for those.

## Default Stores

- `useAppStore`: app name, boot lifecycle, boot failure.
- `useAuthStore`: user, access token, auth status, role helpers.
- `useUiStore`: sidebar state, page title, breadcrumbs, global loading count.

## Pattern

Prefer setup stores:

```ts
export const useExampleStore = defineStore("example", () => {
  const state = ref("");
  const derived = computed(() => state.value.toUpperCase());

  function setState(nextState: string) {
    state.value = nextState;
  }

  return {
    derived,
    state,
    setState,
  };
});
```

Keep API calls in feature services or composables when possible. Stores should
own state transitions and expose typed actions.
