import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

function printHelp() {
  console.log(`
Usage:
  npm run generate:api -- <feature> <ResourceName>

Example:
  npm run generate:api -- user User
  npm run generate:api -- evaluation EvaluationTask
`);
}

function assertFeatureName(name: string) {
  if (!/^[a-z][a-z0-9-]*$/.test(name)) {
    throw new Error("feature must be kebab-case or lowercase, e.g. user-profile.");
  }
}

function assertResourceName(name: string) {
  if (!/^[A-Z][A-Za-z0-9]*$/.test(name)) {
    throw new Error("ResourceName must be PascalCase, e.g. EvaluationTask.");
  }
}

async function writeNewFile(filePath: string, content: string) {
  if (existsSync(filePath)) {
    throw new Error(`File already exists: ${filePath}`);
  }

  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, content, "utf-8");
}

function toKebabCase(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

function createDtoSource(resourceName: string) {
  return `import "reflect-metadata";
import { IsOptional, IsString } from "class-validator";

export class ${resourceName}Dto {
  @IsString()
  id!: string;

  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export interface Create${resourceName}Request {
  name: string;
  description?: string;
}

export interface Update${resourceName}Request {
  name?: string;
  description?: string;
}
`;
}

function createApiSource(feature: string, resourceName: string) {
  const resourcePath = toKebabCase(resourceName);
  const variableName = `${resourceName.charAt(0).toLowerCase()}${resourceName.slice(1)}`;

  return `import { apiClient } from "@core/api";

import {
  ${resourceName}Dto,
  type Create${resourceName}Request,
  type Update${resourceName}Request,
} from "../dto/${resourceName}.dto";

const basePath = "/api/${feature}/${resourcePath}";

export function fetch${resourceName}(id: string) {
  return apiClient.get(\`\${basePath}/\${id}\`, ${resourceName}Dto);
}

export function create${resourceName}(body: Create${resourceName}Request) {
  return apiClient.post(basePath, body, ${resourceName}Dto);
}

export function update${resourceName}(
  id: string,
  body: Update${resourceName}Request
) {
  return apiClient.request<${resourceName}Dto>(
    {
      method: "PATCH",
      url: \`\${basePath}/\${id}\`,
      data: body,
    },
    ${resourceName}Dto
  );
}

export const ${variableName}Api = {
  create: create${resourceName},
  fetch: fetch${resourceName},
  update: update${resourceName},
};
`;
}

async function main() {
  const [, , featureArg, resourceArg] = process.argv;

  if (!featureArg || !resourceArg || featureArg === "--help" || featureArg === "-h") {
    printHelp();
    return;
  }

  assertFeatureName(featureArg);
  assertResourceName(resourceArg);

  const dtoPath = resolve(
    `src/app/modules/${featureArg}/dto/${resourceArg}.dto.ts`
  );
  const apiPath = resolve(`src/app/modules/${featureArg}/api/${featureArg}.api.ts`);

  await writeNewFile(dtoPath, createDtoSource(resourceArg));
  await writeNewFile(apiPath, createApiSource(featureArg, resourceArg));

  console.log(`Created DTO/API scaffold for ${resourceArg} in module ${featureArg}.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
