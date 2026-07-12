import { test, expect } from "@playwright/test";

// Guards the user-visible base-switch pricing on a premium-default dish — the
// exact regression we just fixed (default Pad Thai base must show the listed
// $18.95, not double-charge to $19.95). Reads the public /menu page only, so it
// needs no auth and falls open to the base catalog without a test DB.
const CARD = "menu-card-specialty-chicken-shrimp-pad-thai";

test("premium-default dish prices its base switches correctly on /menu", async ({
  page,
}) => {
  await page.goto("/menu");
  const card = page.getByTestId(CARD);
  await expect(card).toBeVisible();

  // Default base (Pad Thai) — listed price, the +$1 already baked in.
  // (The collapsed card shows the default price honestly, before customizing.)
  await expect(card.getByText("$18.95", { exact: false })).toBeVisible();

  // Base-switch chips now live behind the per-card "Customize" disclosure.
  await card.getByRole("button", { name: /Customize/ }).click();

  // Switch to a different premium base (Udon) — adds $1.
  await card.getByRole("button", { name: /Udon/ }).click();
  await expect(card.getByText("$19.95", { exact: false })).toBeVisible();

  // Switch down to a cheap base (White Rice) — no discount, back to listed.
  await card.getByRole("button", { name: /White Rice/ }).click();
  await expect(card.getByText("$18.95", { exact: false })).toBeVisible();
});
