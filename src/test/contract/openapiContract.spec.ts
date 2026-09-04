import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Checks this frontend's assumptions against the backend's published OpenAPI
 * document.
 *
 * The backend is shared with the React and Next.js boilerplates and lives in
 * its own repository, so the spec is vendored rather than read across a path
 * that does not exist here. `npm run contract:sync` refreshes it.
 *
 * The cost of vendoring is stated plainly: this copy can fall behind the server
 * without anything here noticing. What it still catches is the failure it was
 * written for — this frontend calling an endpoint the spec it was built against
 * does not describe.
 */

const SPEC_PATH = resolve(__dirname, "../../../contracts/openapi.json");

type OpenApiDocument = {
  paths: Record<string, Record<string, unknown>>;
  components: { schemas: Record<string, { properties?: Record<string, unknown>; required?: string[] }> };
};

function loadSpec(): OpenApiDocument | null {
  if (!existsSync(SPEC_PATH)) return null;

  return JSON.parse(readFileSync(SPEC_PATH, "utf8")) as OpenApiDocument;
}

const spec = loadSpec();

const describeIfSpec = spec ? describe : describe.skip;

/**
 * Every URL this app passes to `apiClient`, reduced to a comparable path shape.
 *
 * Parameter names are discarded: a client writes whatever expression it has to
 * hand (`${graphId}`) while the server names the placeholder in its route
 * decorator, and comparing the names reports a mismatch for two spellings of
 * the same endpoint.
 *
 * `basePath` constants are resolved per file, because most call sites are
 * written as `` `${basePath}/login` `` and a literal-only scan would miss them
 * entirely — reporting nothing, which is the failure mode a contract test can
 * least afford.
 */
function frontendEndpoints(): string[] {
  const root = resolve(__dirname, "../..");
  const found = new Set<string>();

  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = resolve(dir, entry.name);

      if (entry.isDirectory()) {
        walk(full);
        continue;
      }

      if (!entry.name.endsWith(".ts")) continue;
      if (entry.name.includes(".spec.")) continue;

      const source = readFileSync(full, "utf8");

      if (!source.includes("apiClient.")) continue;

      const basePath = /const basePath = "([^"]+)"/.exec(source)?.[1] ?? "";

      for (const match of source.matchAll(/apiClient\.(?:get|post|put|patch|delete)\(\s*[`"]([^`"]+)[`"]/g)) {
        const raw = (match[1] ?? "")
          .replace(/\$\{basePath\}/g, basePath)
          .replace(/\$\{[^}]*\}/g, "{}")
          .split("?")[0];

        if (raw === undefined || !raw.startsWith("/")) continue;

        found.add(raw);
      }

      // `apiClient.post(basePath, ...)` passes the constant on its own.
      if (basePath !== "" && new RegExp(String.raw`apiClient\.\w+\(\s*basePath\b`).test(source)) {
        found.add(basePath);
      }
    }
  };

  walk(root);

  return [...found].sort();
}

/**
 * Endpoints this app calls that the backend deliberately does not implement.
 *
 * Social login is a frontend extension demonstrating the OAuth redirect shape;
 * the shared backend implements first-party credentials only, and OAuth was
 * excluded from it on purpose. Listing them here keeps the exception visible —
 * skipping the paths silently would let a genuinely missing endpoint hide among
 * them.
 */
const UNBACKED_BY_DESIGN = ["/api/auth/oauth/{}/authorize", "/api/auth/oauth/{}/callback"];

describeIfSpec("server contract", () => {
  it("publishes every endpoint the frontend calls", () => {
    const published = new Set(
      Object.keys(spec?.paths ?? {}).map((path) => path.replace(/\{[^}]*\}/g, "{}")),
    );

    const called = frontendEndpoints();

    // A scan that finds nothing would pass this test forever.
    expect(called.length).toBeGreaterThan(5);

    // Every listed exception must still be a path this app actually calls,
    // or the list outlives the code and starts hiding real gaps.
    expect(UNBACKED_BY_DESIGN.filter((endpoint) => !called.includes(endpoint))).toEqual([]);

    const missing = called
      .filter((endpoint) => !published.has(endpoint))
      .filter((endpoint) => !UNBACKED_BY_DESIGN.includes(endpoint));

    expect(missing).toEqual([]);
  });

  /** The fields this app's auth DTOs validate on arrival. */
  it("matches the auth shapes the DTOs validate", () => {
    const properties = (schema: string) =>
      Object.keys(spec?.components.schemas[schema]?.properties ?? {}).sort();

    expect(properties("AuthUserResponseDto")).toEqual(["email", "id", "name", "permissions"]);
    expect(properties("LoginResponseDto")).toEqual(["accessToken", "user"]);
    expect(properties("SessionResponseDto")).toEqual(["user"]);
  });

  /** The error envelope is the one shape every failure path shares. */
  it("publishes the shared error envelope", () => {
    const envelope = spec?.components.schemas.ApiErrorEnvelope;
    const error = (envelope?.properties?.error ?? {}) as { required?: string[] };

    expect(Object.keys(envelope?.properties ?? {}).sort()).toEqual(["error", "success"]);
    expect(error.required).toEqual(expect.arrayContaining(["code", "message"]));
  });
});
