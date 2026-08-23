import { expect, test, type Page } from "@playwright/test";

interface MemorySnapshot {
  heapLimit: number;
  totalHeapSize: number;
  usedHeapSize: number;
}

test("dashboard navigation does not grow heap beyond smoke threshold", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Use demo session" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await collectGarbage(page);
  const before = await readMemory(page);
  test.skip(before.usedHeapSize === 0, "performance.memory is unavailable.");

  for (let index = 0; index < 5; index += 1) {
    await page.goto("/dashboard");
    await page.goto("/user");
  }

  await collectGarbage(page);
  const after = await readMemory(page);
  const heapGrowth = after.usedHeapSize - before.usedHeapSize;
  const growthLimit = 10 * 1024 * 1024;

  expect(heapGrowth).toBeLessThan(growthLimit);
});

async function readMemory(page: {
  evaluate<T>(pageFunction: () => T | Promise<T>): Promise<T>;
}) {
  return page.evaluate<MemorySnapshot>(() => {
    const memory = (
      performance as Performance & {
        memory?: {
          jsHeapSizeLimit: number;
          totalJSHeapSize: number;
          usedJSHeapSize: number;
        };
      }
    ).memory;

    return {
      heapLimit: memory?.jsHeapSizeLimit ?? 0,
      totalHeapSize: memory?.totalJSHeapSize ?? 0,
      usedHeapSize: memory?.usedJSHeapSize ?? 0,
    };
  });
}

async function collectGarbage(page: Page) {
  const session = await page.context().newCDPSession(page);

  try {
    await session.send("HeapProfiler.collectGarbage");
  } finally {
    await session.detach();
  }
}
