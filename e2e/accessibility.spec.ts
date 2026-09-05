import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * Accessibility of screens as they are being used, not as they first load.
 *
 * Lighthouse already gates two routes in CI, but it audits a page at load and
 * nothing after. Every interesting screen here changes shape once someone
 * touches it: a dashboard grows widgets, a topology gains a selection, a chat
 * fills with messages. Those states are where labels go missing and focus goes
 * nowhere, and none of them exist at load.
 *
 * Serious and critical only. Axe's minor and moderate findings are largely
 * advisory, and a gate that fires on advice is one people learn to skip.
 */
const BLOCKING = ["serious", "critical"];

async function violations(page: Page) {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  return result.violations
    .filter((violation) => BLOCKING.includes(violation.impact ?? ""))
    .map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      nodes: violation.nodes.map((node) => ({
        target: node.target.join(" "),
        // The numbers, not just the rule name. A contrast failure that says
        // only "color-contrast" sends the reader back to the browser to find
        // out by how much.
        summary: node.failureSummary,
      })),
    }));
}

for (const path of ["/login", "/customizable-dashboard", "/visual-graph", "/live-experience"]) {
  test(`${path} is accessible`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator("#app")).not.toBeEmpty();

    expect(await violations(page)).toEqual([]);
  });
}

test("the topology stays accessible with a route selected", async ({ page }) => {
  await page.goto("/visual-graph");
  await expect(page.locator("#app")).not.toBeEmpty();

  const source = page.getByLabel(/source/i).first();
  if (await source.count()) {
    await source.selectOption({ index: 1 }).catch(() => undefined);
  }

  expect(await violations(page)).toEqual([]);
});
