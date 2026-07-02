import { test, expect, type Page } from "@playwright/test";

// A base catalog item that is stable and has no price-affecting default
// modifiers (default size "small" = +0, default flavor = +$0), so an override
// price shows verbatim on the customer card.
const BASE_ID = "pho-beef";
const BASE_NAME = "Classic Beef Pho";

// Open the inline override panel for a base item on /dashboard/menu.
async function openOverride(page: Page) {
  await page.goto("/dashboard/menu");
  const row = page.getByTestId(`row-${BASE_ID}`);
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Edit" }).click();
}

test.describe.serial("menu management", () => {
  test("base item sold-out → customer sees badge + disabled add", async ({
    page,
    context,
  }) => {
    await openOverride(page);
    await page.getByTestId("ov-soldout").check();
    await page.getByTestId("ov-save").click();
    await expect(page.getByRole("status")).toContainText(/saved/i);

    const customer = await context.newPage();
    await customer.goto("/menu");
    const card = customer.getByTestId(`menu-card-${BASE_ID}`);
    // The badge is a <span>; the disabled add button also reads "Sold out".
    await expect(card.locator("span", { hasText: "Sold out" })).toBeVisible();
    await expect(
      card.getByRole("button", { name: "Sold out", exact: true }),
    ).toBeDisabled();
    await customer.close();
  });

  test("base item price override → customer sees new price", async ({
    page,
    context,
  }) => {
    await openOverride(page);
    await page.getByTestId("ov-soldout").uncheck(); // clear sold-out from prior test
    await page.getByTestId("ov-price").fill("99.99");
    await page.getByTestId("ov-save").click();
    await expect(page.getByRole("status")).toContainText(/saved/i);

    const customer = await context.newPage();
    await customer.goto("/menu");
    const card = customer.getByTestId(`menu-card-${BASE_ID}`);
    await expect(card).toContainText("$99.99");
    await expect(
      card.getByRole("button", { name: "Add to cart" }),
    ).toBeEnabled();
    await customer.close();
  });

  test("custom item: add → edit → appears on menu → delete → gone", async ({
    page,
    context,
  }) => {
    const name = `E2E Dish ${Date.now()}`;

    // Add (no photo — upload is intentionally out of scope for E2E).
    await page.goto("/dashboard/menu");
    await page.getByRole("button", { name: "Add item" }).click();
    await page.getByTestId("form-name").fill(name);
    await page.getByTestId("form-category").selectOption("appetizers");
    await page.getByTestId("form-price").fill("12.34");
    await page.getByTestId("form-submit").click();
    await expect(page.getByRole("status")).toContainText(/added/i);

    const customer = await context.newPage();
    await customer.goto("/menu");
    await expect(customer.getByRole("heading", { name })).toBeVisible();

    // Edit the price.
    const row = page
      .locator('[data-testid^="row-custom-"]')
      .filter({ hasText: name });
    await row.getByRole("button", { name: "Edit" }).click();
    await page.getByTestId("form-price").fill("21.00");
    await page.getByTestId("form-submit").click();
    await expect(page.getByRole("status")).toContainText(/updated/i);

    await customer.reload();
    const customerCard = customer
      .locator('[data-testid^="menu-card-custom-"]')
      .filter({ hasText: name });
    await expect(customerCard).toContainText("$21.00");

    // Delete (confirm() dialog).
    page.once("dialog", (d) => d.accept());
    await page
      .locator('[data-testid^="row-custom-"]')
      .filter({ hasText: name })
      .getByRole("button", { name: "Delete item" })
      .click();
    await expect(page.getByRole("status")).toContainText(/deleted/i);

    await customer.reload();
    await expect(customer.getByRole("heading", { name })).toHaveCount(0);
    await customer.close();
  });

  test("server rejects ordering a sold-out item (skips if ordering closed)", async ({
    page,
  }) => {
    // Ensure the item is sold out.
    await openOverride(page);
    await page.getByTestId("ov-soldout").check();
    await page.getByTestId("ov-save").click();
    await expect(page.getByRole("status")).toContainText(/saved/i);

    await page.goto("/order");
    const accepting = await page.evaluate(async () => {
      const r = await fetch("/api/order/availability");
      if (!r.ok) return false;
      const d = await r.json();
      return !!d.accepting;
    });
    test.skip(
      !accepting,
      "Ordering is closed (hours/pause). The sold-out gate is also covered by lib/pricing unit tests.",
    );

    // Crafted order straight to the API (bypassing the disabled UI) must still
    // be rejected by the server-side priceCart gate.
    const result = await page.evaluate(async (menuItemId) => {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ menuItemId, quantity: 1 }],
          pickupDetails: {
            name: "E2E Tester",
            phone: "+16472223344",
            pickupTimeOption: "asap",
          },
        }),
      });
      return { status: res.status, body: await res.text() };
    }, BASE_ID);

    expect(result.status).toBe(400);
    expect(result.body).toMatch(/sold out/i);
  });

  test("change history: an override logs a clean, itemized entry on its own page", async ({
    page,
  }) => {
    // Make a recognizable price edit on the base item.
    await openOverride(page);
    await page.getByTestId("ov-soldout").uncheck();
    await page.getByTestId("ov-price").fill("33.33");
    await page.getByTestId("ov-save").click();
    await expect(page.getByRole("status")).toContainText(/saved/i);

    // History lives on its own page, reachable from the menu header link.
    await page.getByRole("link", { name: /change history/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/menu\/history/);

    const newest = page.locator("section ul > li").first();
    await expect(newest).toContainText(BASE_NAME); // which item
    await expect(newest).toContainText("$33.33"); // the new price
    await expect(newest).toContainText("Updated"); // action badge
    // None of the old no-op noise.
    await expect(newest).not.toContainText("8.95→8.95");
    await expect(newest).not.toContainText("renamed");
    await expect(newest).not.toContainText("description edited");
    await expect(newest).not.toContainText("sold-out option(s)");
  });

  test("change history: a no-op save creates no entry", async ({ page }) => {
    // Open the override panel and save without changing anything.
    await openOverride(page);
    await page.getByTestId("ov-save").click();
    await expect(page.getByRole("status")).toContainText(/saved/i);

    // The newest entry is still the prior price edit — a no-op never prepends
    // an empty "Updated" card.
    await page.goto("/dashboard/menu/history");
    const newest = page.locator("section ul > li").first();
    await expect(newest).toContainText("$33.33");
  });
});
