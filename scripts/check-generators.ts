import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";

/**
 * Runs the feature generator and checks its output against docs/development/FEATURE_CONTRACT.md.
 *
 * The existing automation check asserted that four generator *files existed*.
 * It never ran one, and generate-feature.ts — the only generator that produces
 * a whole module — was not among the four. So the generator could have emitted
 * a module the router cannot see and nothing would have reported it.
 */

const ROOT = resolve(process.cwd());

/** A name no human would pick, so a leftover directory is obviously ours. */
const FEATURE = "generator-contract-probe";
const PASCAL = "GeneratorContractProbe";

const moduleDir = join(ROOT, "src", "app", "modules", FEATURE);

const REQUIRED = [
  `views/${PASCAL}View.vue`,
  "router/routes.ts",
  `stories/${PASCAL}.stories.ts`,
  `__tests__/${FEATURE}.store.spec.ts`,
  `dto/${PASCAL}.dto.ts`,
  `api/${FEATURE}.api.ts`,
  `store/${FEATURE}.store.ts`,
];

const failures: string[] = [];

function cleanup() {
  rmSync(moduleDir, { recursive: true, force: true });
}

function run(args: string[]) {
  execFileSync("npx", ["tsx", "scripts/generate-feature.ts", ...args], {
    cwd: ROOT,
    stdio: "pipe",
    shell: true,
  });
}

cleanup();

try {
  run([FEATURE]);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  failures.push(`generate-feature.ts failed to run: ${message}`);
}

for (const relative of REQUIRED) {
  if (!existsSync(join(moduleDir, relative))) {
    failures.push(`generate-feature.ts did not create ${FEATURE}/${relative}`);
  }
}

/**
 * The route file has to sit where the router looks, not merely exist. The glob
 * is read from the router itself so that changing one and not the other is
 * reported here rather than discovered as a module nobody can open.
 */
const routerSource = readFileSync(join(ROOT, "src/app/router/index.ts"), "utf-8");

if (!routerSource.includes("modules/**/router/routes.ts")) {
  failures.push(
    "src/app/router/index.ts no longer globs modules/**/router/routes.ts; the generated route path needs updating too",
  );
}

/** Re-running must refuse rather than overwrite work that is not committed. */
let refused = false;

try {
  run([FEATURE]);
} catch {
  refused = true;
}

if (!refused) failures.push("generate-feature.ts overwrote an existing module instead of refusing");

/** A name with a path separator must not be able to write outside modules/. */
let rejectedPath = false;

try {
  run(["../escaped"]);
} catch {
  rejectedPath = true;
}

if (!rejectedPath) failures.push("generate-feature.ts accepted a name containing a path separator");

cleanup();

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  console.error("\nSee docs/development/FEATURE_CONTRACT.md for what a generated module must contain.");
  process.exit(1);
}

console.log("[generators] Generated modules match docs/development/FEATURE_CONTRACT.md.");
