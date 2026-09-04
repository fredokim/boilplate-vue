import { expect, test } from "@playwright/test";

/**
 * These exist because the application did not boot at all and every gate was
 * green.
 *
 * The router builds a group named after each module directory and mounts that
 * module's routes as its children. Two modules declared a route with the same
 * name as their directory, and vue-router throws during registration when a
 * child shares a name with its ancestor — so nothing rendered, anywhere. Unit
 * tests mount components directly and never build the router, so they cannot
 * see it.
 */

test("the application boots and renders", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/");

  await expect(page.locator("#app")).not.toBeEmpty();
  expect(errors).toEqual([]);
});

test("an anonymous visitor is sent to sign in", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

/**
 * Every module route is visited, because a name collision only shows up on the
 * module that has one. Checking a single page would have missed both of the
 * collisions that were actually there.
 */
for (const path of [
  "/auth",
  "/component",
  "/customizable-dashboard",
  "/dashboard",
  "/live-experience",
  "/user",
  "/visual-graph",
]) {
  test(`${path} registers without a router error`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));

    await page.goto(path);

    expect(errors.filter((message) => message.includes("route"))).toEqual([]);
  });
}
