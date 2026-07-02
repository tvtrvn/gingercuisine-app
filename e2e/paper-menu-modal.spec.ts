import { test, expect, type Page } from "@playwright/test";

// Regression guard for the "Paper Menu" lightbox: the overlay must fully cover
// the viewport (no featured-dish photos bleeding over it) and the page behind
// must not scroll while it is open. Both mount sites are covered — the homepage
// hero (Hero.tsx) and the /menu header (MenuPageClient.tsx) — because the fix is
// a portal that has to escape whatever ancestor stacking/transform context it
// renders under.

const POINTS_FRACTIONS = [
  { fx: 0.5, fy: 0.5 },
  { fx: 0.5, fy: 0.75 },
  { fx: 0.3, fy: 0.6 },
  { fx: 0.7, fy: 0.4 },
];

async function bodyOverflow(page: Page): Promise<string> {
  return page.evaluate(() => document.body.style.overflow);
}

for (const path of ["/", "/menu"]) {
  test(`paper menu modal isolates the page on ${path}`, async ({ page }) => {
    await page.goto(path);

    const openBtn = page.getByTestId("paper-menu-open");
    await expect(openBtn).toBeVisible();
    await openBtn.click();

    const overlay = page.getByTestId("modal-overlay");
    await expect(overlay).toBeVisible();

    const vp = page.viewportSize();
    if (!vp) throw new Error("no viewport size");

    // 1. Overlay covers the whole viewport (fixed inset-0 at the document root).
    const box = await overlay.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeLessThanOrEqual(1);
    expect(box!.y).toBeLessThanOrEqual(1);
    expect(box!.width).toBeGreaterThanOrEqual(vp.width - 1);
    expect(box!.height).toBeGreaterThanOrEqual(vp.height - 1);

    // 2. No bleed-through: at several viewport points, the topmost element is
    //    inside the modal — not a featured-dish photo painting over it.
    for (const { fx, fy } of POINTS_FRACTIONS) {
      const x = Math.round(vp.width * fx);
      const y = Math.round(vp.height * fy);
      const covered = await page.evaluate(
        ({ x, y }) => {
          const el = document.elementFromPoint(x, y);
          return !!(el && el.closest('[data-testid="modal-overlay"]'));
        },
        { x, y },
      );
      expect(covered, `point ${x},${y} should be covered by the modal`).toBe(
        true,
      );
    }

    // 3. Background scroll is locked while the modal is open.
    expect(await bodyOverflow(page)).toBe("hidden");

    // 4. Closing (Escape) removes the overlay, restores scroll-lock, and the
    //    page scrolls again.
    await page.keyboard.press("Escape");
    await expect(overlay).toBeHidden();
    expect(await bodyOverflow(page)).toBe("");

    const beforeScroll = await page.evaluate(() => window.scrollY);
    await page.mouse.move(Math.round(vp.width / 2), Math.round(vp.height / 2));
    await page.mouse.wheel(0, 600);
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(beforeScroll);
  });
}

test("paper menu modal closes via X button and backdrop click", async ({
  page,
}) => {
  await page.goto("/");
  const openBtn = page.getByTestId("paper-menu-open");
  const overlay = page.getByTestId("modal-overlay");

  // Close button (X) in the panel header.
  await openBtn.click();
  await expect(overlay).toBeVisible();
  await page.getByRole("button", { name: /close menu/i }).click();
  await expect(overlay).toBeHidden();
  expect(await bodyOverflow(page)).toBe("");

  // Backdrop click (top-left corner, away from the centered panel).
  await openBtn.click();
  await expect(overlay).toBeVisible();
  await overlay.click({ position: { x: 5, y: 5 } });
  await expect(overlay).toBeHidden();
  expect(await bodyOverflow(page)).toBe("");
});
