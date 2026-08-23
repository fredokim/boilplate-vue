# Vue i18n Strategy

## Rules

- Keep dictionaries typed with `as const`.
- Provide a fallback locale for unsupported locales.
- Format numbers and dates with `Intl`.
- Test dictionary key parity when adding locales.
- Use route query or route segment locale only when the locale must be shareable.

## Vue Ownership

- Locale state can be component-local for isolated widgets.
- Locale should move to Pinia only when multiple modules need it.
- Server responses should remain locale-independent unless the backend owns translations.

## Upgrade Path

```txt
src/core/i18n
  - locale utilities
  - dictionary parity tests
src/app/modules/{feature}/i18n
  - feature dictionaries
```
