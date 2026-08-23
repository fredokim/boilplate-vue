import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const failures: string[] = [];

function walk(dir: string): string[] {
  if (!existsSync(dir)) {
    return [];
  }

  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    failures.push(message);
  }
}

const storyFiles = walk(join(root, "src/app/components/atomic/stories")).filter((file) => file.endsWith(".stories.ts"));
assert(storyFiles.length > 0, "No atomic Storybook stories found.");

const schemaFiles = walk(join(root, "src")).filter(
  (file) => file.endsWith(".schema.ts") && !file.includes(`${join("src", "core", "schema")}`),
);
const specFiles = walk(join(root, "src")).filter((file) => file.endsWith(".spec.ts"));
const specText = specFiles.map((file) => readFileSync(file, "utf8")).join("\n");
for (const schemaPath of schemaFiles) {
  const schemaName = schemaPath.split(/[\\/]/).pop()?.replace(".ts", "") ?? "";
  assert(specText.includes(schemaName) || specText.includes(schemaName.replace(".schema", "Schema")), `Schema has no validation spec reference: ${relative(root, schemaPath)}`);
}

const registryPath = join(root, "src/test/msw/mock-registry.ts");
assert(existsSync(registryPath), "Missing MSW mock registry.");
if (existsSync(registryPath)) {
  const registry = readFileSync(registryPath, "utf8");
  assert(registry.includes("mockRegistry"), "Mock registry must export mockRegistry.");
  assert(registry.includes("endpoint"), "Mock registry entries must include endpoint metadata.");
}

for (const generator of ["scripts/generate-contract.ts", "scripts/generate-layout.ts", "scripts/generate-page.ts", "scripts/generate-form.ts"]) {
  assert(existsSync(join(root, generator)), `Missing automation generator: ${generator}`);
}

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}

console.log("Automation checks passed.");
