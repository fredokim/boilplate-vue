# Generators

## Atomic Component

Creates a Vue component, Storybook story, unit test, and atomic index export.

```bash
npm run generate:component -- atom BaseIconButton
npm run generate:component -- molecule SearchField
npm run generate:component -- organism DataToolbar
```

Supported layers:

- `atom`
- `molecule`
- `organism`
- `template`
- `adapter`

## DTO/API

Creates a decorator DTO and typed API scaffold.

```bash
npm run generate:api -- user User
npm run generate:api -- evaluation EvaluationTask
```

Generated files:

- `src/app/modules/{feature}/dto/{ResourceName}.dto.ts`
- `src/app/modules/{feature}/api/{feature}.api.ts`

## Feature Module

Creates a complete lazy-loaded feature module.

```bash
npm run generate:feature -- user User
npm run generate:feature -- order-list OrderList
```

Generated files:

- `src/app/modules/{feature}/dto/{ResourceName}.dto.ts`
- `src/app/modules/{feature}/api/{feature}.api.ts`
- `src/app/modules/{feature}/views/{ViewName}View.vue`
- `src/app/modules/{feature}/router/routes.ts`
- `src/app/modules/{feature}/store/{feature}.store.ts`
- `src/app/modules/{feature}/stories/{ResourceName}.stories.ts`
- `src/app/modules/{feature}/__tests__/{feature}.store.spec.ts`
- `src/app/modules/{feature}/README.md`
