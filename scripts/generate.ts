const [, , kind, ...rest] = process.argv;

export {};

const commandMap: Record<string, string> = {
  api: "scripts/generate-api.ts",
  component: "scripts/generate-component.ts",
  contract: "scripts/generate-contract.ts",
  feature: "scripts/generate-feature.ts",
  form: "scripts/generate-form.ts",
  layout: "scripts/generate-layout.ts",
  page: "scripts/generate-page.ts",
};

if (!kind || !commandMap[kind]) {
  console.log(`
Usage:
  npm run generate -- <feature|component|contract|form|layout|page|api> [...args]

Examples:
  npm run generate -- feature order Order
  npm run generate -- component BaseChip
  npm run generate -- contract product
  npm run generate -- form product
  npm run generate -- layout AdminShell
  npm run generate -- page order-list list
  npm run generate -- api user User
`);
  process.exit(0);
}

const { spawnSync } = await import("node:child_process");

const result = spawnSync("tsx", [commandMap[kind], ...rest], {
  stdio: "inherit",
  shell: true,
});

process.exitCode = result.status ?? 1;
