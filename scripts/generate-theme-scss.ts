import * as fs from "fs";
import * as path from "path";

import {
  darkTheme,
  designTokens,
  lightTheme,
} from "../src/core/theme/tokens";

function gen(themeName: string, theme: Record<string, string>) {
  let out = `:root[data-theme="${themeName}"] {\n`;
  for (const [k, v] of Object.entries(theme)) {
    out += `  --color-${k}: ${v};\n`;
  }
  out += `}\n\n/* utility classes for ${themeName} */\n`;
  for (const k of Object.keys(theme)) {
    out += `.bg-${k} { background-color: var(--color-${k}); }\n`;
    out += `.text-${k} { color: var(--color-${k}); }\n`;
    out += `.border-${k} { border-color: var(--color-${k}); }\n`;
  }
  out += "\n";
  return out;
}

function genDesignTokens() {
  let out = ":root {\n";

  for (const [groupName, group] of Object.entries(designTokens)) {
    for (const [tokenName, value] of Object.entries(group)) {
      out += `  --ds-${groupName}-${tokenName}: ${value};\n`;
    }
  }

  out += "}\n\n";

  for (const [tokenName] of Object.entries(designTokens.spacing)) {
    out += `.gap-ds-${tokenName} { gap: var(--ds-spacing-${tokenName}); }\n`;
    out += `.p-ds-${tokenName} { padding: var(--ds-spacing-${tokenName}); }\n`;
  }

  for (const [tokenName] of Object.entries(designTokens.radius)) {
    out += `.rounded-ds-${tokenName} { border-radius: var(--ds-radius-${tokenName}); }\n`;
  }

  for (const [tokenName] of Object.entries(designTokens.shadow)) {
    out += `.shadow-ds-${tokenName} { box-shadow: var(--ds-shadow-${tokenName}); }\n`;
  }

  return `${out}\n`;
}

const scss = `// AUTO-GENERATED\n\n${genDesignTokens()}${gen("light", lightTheme)}${gen("dark", darkTheme)}`;
const outPath = path.resolve("src/assets/scss/generated/theme.scss");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, scss, "utf-8");
console.log("theme-classes.scss generated");
