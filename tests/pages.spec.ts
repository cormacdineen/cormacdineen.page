import { expect, test } from "@playwright/test";

const NAV_PAGES = [
  { path: "/", title: "Cormac Dineen" },
  { path: "/blog", title: "Blog" },
  { path: "/photography", title: "Photography" },
  { path: "/recommendations", title: "Cultural Stew" },
  { path: "/about", title: "About" },
];

test.describe("Page accessibility — no 404s", () => {
  for (const page of NAV_PAGES) {
    test(`${page.path} returns 200`, async ({ page: p }) => {
      const response = await p.goto(page.path);
      expect(response?.status()).toBe(200);
    });
  }
});

test.describe("Page titles", () => {
  for (const page of NAV_PAGES) {
    test(`${page.path} has correct title`, async ({ page: p }) => {
      await p.goto(page.path);
      const title = await p.title();
      expect(title).toContain(page.title);
    });
  }
});

test.describe("Internal link crawl", () => {
  test("no broken internal links on main pages", async ({ page }) => {
    const allHrefs = new Set<string>();
    const broken: string[] = [];

    // First pass: collect all internal links from each page
    for (const navPage of NAV_PAGES) {
      await page.goto(navPage.path);
      const hrefs = await page
        .locator("a[href^='/']")
        .evaluateAll((els) => els.map((el) => el.getAttribute("href")).filter(Boolean) as string[]);
      for (const href of hrefs) {
        if (href.includes("#") || href.endsWith(".xml") || href === "/search") continue;
        allHrefs.add(href);
      }
    }

    // Second pass: visit each unique link and check for 404
    for (const href of allHrefs) {
      const response = await page.goto(href);
      if (response && response.status() === 404) {
        broken.push(href);
      }
    }

    expect(broken, `Broken links: ${broken.join(", ")}`).toHaveLength(0);
  });
});

test.describe("Photography lightbox", () => {
  test("opens and closes lightbox on click and Escape", async ({ page }) => {
    await page.goto("/photography");
    const lightbox = page.locator("#lightbox");

    // Lightbox should be hidden initially
    await expect(lightbox).toHaveClass(/hidden/);

    // Click first gallery image
    const firstImage = page.locator(".gallery-item").first();
    await firstImage.click();

    // Lightbox should be visible
    await expect(lightbox).not.toHaveClass(/hidden/);
    await expect(lightbox).toHaveClass(/flex/);

    // Counter should show "1 of X"
    const counter = page.locator("#lb-counter");
    await expect(counter).toContainText("1 of");

    // Press Escape to close
    await page.keyboard.press("Escape");
    await expect(lightbox).toHaveClass(/hidden/);
  });

  test("navigates with arrow keys", async ({ page }) => {
    await page.goto("/photography");

    // Open lightbox
    await page.locator(".gallery-item").first().click();
    const counter = page.locator("#lb-counter");
    await expect(counter).toContainText("1 of");

    // Navigate forward
    await page.keyboard.press("ArrowRight");
    await expect(counter).toContainText("2 of");

    // Navigate backward
    await page.keyboard.press("ArrowLeft");
    await expect(counter).toContainText("1 of");
  });
});

test.describe("Cultural Stew filtering", () => {
  test("category filter shows correct cards", async ({ page }) => {
    await page.goto("/recommendations");

    const allCards = page.locator(".rec-card");
    const totalCount = await allCards.count();
    expect(totalCount).toBeGreaterThan(0);

    // Click "Books" filter
    await page.locator('.filter-btn[data-filter="book"]').click();

    // Only book cards should be visible
    const visibleCards = page.locator('.rec-card:not([style*="display: none"])');
    const bookCards = page.locator('.rec-card[data-type="book"]:not([style*="display: none"])');
    const visibleCount = await visibleCards.count();
    const bookCount = await bookCards.count();
    expect(visibleCount).toBe(bookCount);
    expect(bookCount).toBeGreaterThan(0);

    // Click "All" to reset
    await page.locator('.filter-btn[data-filter="all"]').click();
    const resetCount = await page.locator('.rec-card:not([style*="display: none"])').count();
    expect(resetCount).toBe(totalCount);
  });

  test("tag filter narrows results", async ({ page }) => {
    await page.goto("/recommendations");

    const totalCount = await page.locator(".rec-card").count();

    // Click a tag button
    const firstTag = page.locator(".tag-btn").first();
    await firstTag.click();

    // Should have fewer or equal visible cards
    const filteredCount = await page.locator('.rec-card:not([style*="display: none"])').count();
    expect(filteredCount).toBeLessThanOrEqual(totalCount);
    expect(filteredCount).toBeGreaterThan(0);
  });
});
