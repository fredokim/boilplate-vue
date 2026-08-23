# Vue Performance Report

## Guardrails

- Lazy routes keep initial JavaScript small.
- Atomic components stay lightweight and free of data fetching.
- Pinia stores centralize shared state and avoid duplicate module requests.
- Bundle size is checked with `npm run check:bundle`.
- Dependency size is checked with `npm run check:deps`.
- Lighthouse, memory smoke, and Web Vitals tooling are available.

## Review Checklist

- Avoid unbounded list rendering.
- Keep route-level code splitting intact.
- Avoid deep watchers for data that can be derived.
- Avoid adding large table/chart/date libraries without a replacement review.
- Keep API and memory smoke tests available for performance-sensitive flows.

## Commands

```bash
npm run build
npm run perf:bundle
npm run perf:lighthouse
npm run perf:memory
npm run check:bundle
npm run check:deps
```
