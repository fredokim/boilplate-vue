import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [, , rawName] = process.argv;

if (!rawName) {
  throw new Error("Usage: npm run generate -- contract <name>");
}

const kebabName = rawName.replace(/([a-z])([A-Z])/g, "$1-$2").replace(/\s+/g, "-").toLowerCase();
const pascalName = kebabName
  .split("-")
  .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
  .join("");
const camelName = `${pascalName.charAt(0).toLowerCase()}${pascalName.slice(1)}`;
const base = `src/app/modules/${kebabName}`;

function write(path: string, content: string) {
  mkdirSync(join(process.cwd(), path, ".."), { recursive: true });
  writeFileSync(join(process.cwd(), path), content);
}

write(`${base}/dto/${pascalName}.dto.ts`, `import "reflect-metadata";\nimport { IsString } from "class-validator";\n\nexport class ${pascalName}Dto {\n  @IsString()\n  id!: string;\n\n  @IsString()\n  name!: string;\n}\n\nexport class ${pascalName}RequestDto {\n  @IsString()\n  name!: string;\n}\n`);
write(`${base}/schema/${kebabName}.schema.ts`, `import { z } from "zod";\nimport type { InferDto } from "@core/dto/infer-dto";\nimport type { ${pascalName}RequestDto } from "../dto/${pascalName}.dto";\n\nexport const ${camelName}Schema = z.object({\n  name: z.string().min(1, "Name is required."),\n}) satisfies z.ZodType<InferDto<typeof ${pascalName}RequestDto>>;\n\nexport type ${pascalName}Input = z.infer<typeof ${camelName}Schema>;\n`);
write(`${base}/store/${kebabName}.schema.ts`, `import { z } from "zod";\nimport type { InferDto } from "@core/dto/infer-dto";\nimport type { ${pascalName}Dto } from "../dto/${pascalName}.dto";\n\nexport const ${camelName}StateSchema = z.object({\n  id: z.string().min(1),\n  name: z.string().min(1),\n}) satisfies z.ZodType<InferDto<typeof ${pascalName}Dto>>;\n\nexport type ${pascalName}State = z.infer<typeof ${camelName}StateSchema>;\n`);
write(`${base}/mocks/${kebabName}.mock.ts`, `export const ${camelName}Mock = {\n  id: "${kebabName}-demo",\n  name: "${pascalName} Demo",\n};\n\nexport const invalid${pascalName}Mock = {\n  id: 1,\n  name: null,\n};\n`);
write(`${base}/schema/${kebabName}.schema.spec.ts`, `import { describe, expect, it } from "vitest";\nimport { ${camelName}Schema } from "./${kebabName}.schema";\n\ndescribe("${camelName}Schema", () => {\n  it("validates form input", () => {\n    expect(${camelName}Schema.parse({ name: "${pascalName}" }).name).toBe("${pascalName}");\n  });\n});\n`);

console.log(`Generated contract: ${kebabName}`);
