import {
  test,
  expect,
  request as playwrightRequest,
  type APIRequestContext,
} from "@playwright/test";

// Covers the flows the test-inventory audit found uncovered: session gating,
// wrong-password login, CSRF rejection, invalid-JSON handling, the order
// happy path, viewToken-gated status polling, the staff status machine
// (including reopening a cancelled order), search, and the contact form.
//
// API tests that create orders skip when ordering is closed (hours/pause) —
// same convention as menu.spec.ts. Rate limits are the dev no-op in e2e
// (Upstash env is blanked in playwright.config.ts), so no 429 flake.

const BASE_URL = "http://localhost:3100";
const ORIGIN = { Origin: BASE_URL };

function orderBody(name: string) {
  return {
    items: [{ menuItemId: "pho-beef", quantity: 1 }],
    pickupDetails: {
      name,
      phone: "416 967 1111",
      email: "",
      pickupTimeOption: "asap",
    },
  };
}

async function orderingOpen(api: APIRequestContext): Promise<boolean> {
  const res = await api.get("/api/order/availability");
  if (!res.ok()) return false;
  const data = (await res.json()) as { accepting?: boolean };
  return !!data.accepting;
}

async function anonContext() {
  // Contexts created inside a test inherit the project's storageState (the
  // staff session cookie) — pass an explicitly EMPTY state to be anonymous.
  return playwrightRequest.newContext({
    baseURL: BASE_URL,
    storageState: { cookies: [], origins: [] },
  });
}

test.describe("session gating & request hygiene", () => {
  test("dashboard APIs reject unauthenticated requests", async () => {
    const anon = await anonContext();
    try {
      expect((await anon.get("/api/dashboard/orders")).status()).toBe(401);
      expect(
        (await anon.get("/api/dashboard/orders/search?q=ab")).status(),
      ).toBe(401);
      expect((await anon.get("/api/dashboard/menu")).status()).toBe(401);
      expect(
        (
          await anon.post("/api/dashboard/orders/pause", {
            headers: ORIGIN,
            data: { paused: true },
          })
        ).status(),
      ).toBe(401);
      expect(
        (
          await anon.patch("/api/dashboard/orders/ABC234", {
            headers: ORIGIN,
            data: { orderStatus: "ready" },
          })
        ).status(),
      ).toBe(401);
    } finally {
      await anon.dispose();
    }
  });

  test("wrong dashboard password is rejected", async () => {
    const anon = await anonContext();
    try {
      const res = await anon.post("/api/dashboard/login", {
        headers: ORIGIN,
        data: { password: "definitely-wrong-password" },
      });
      expect(res.status()).toBe(401);
      expect(res.headers()["set-cookie"] ?? "").not.toContain(
        "gc_dashboard_session=v1",
      );
    } finally {
      await anon.dispose();
    }
  });

  test("mutating routes reject cross-origin requests", async () => {
    const anon = await anonContext();
    try {
      const res = await anon.post("/api/contact", {
        headers: { Origin: "https://evil.example" },
        data: { name: "x", email: "x@example.com", message: "hello there" },
      });
      expect(res.status()).toBe(403);
    } finally {
      await anon.dispose();
    }
  });

  test("invalid JSON body returns 400, not 500", async () => {
    const anon = await anonContext();
    try {
      const res = await anon.post("/api/contact", {
        headers: { ...ORIGIN, "Content-Type": "application/json" },
        data: "{ not json",
      });
      expect(res.status()).toBe(400);
    } finally {
      await anon.dispose();
    }
  });
});

test.describe.serial("order lifecycle (API)", () => {
  let orderId = "";
  let viewToken = "";
  const CUSTOMER = `E2E Lifecycle ${Date.now()}`;

  test("customer places an order (happy path)", async () => {
    const anon = await anonContext();
    try {
      test.skip(!(await orderingOpen(anon)), "ordering closed right now");
      const res = await anon.post("/api/order", {
        headers: ORIGIN,
        data: orderBody(CUSTOMER),
      });
      expect(res.status()).toBe(201);
      const data = (await res.json()) as {
        orderId: string;
        viewToken: string;
        totals?: { total?: number };
      };
      expect(data.orderId).toMatch(/^[0-9A-Z]{6}$/);
      expect(data.viewToken).toHaveLength(32);
      expect(data.totals?.total ?? 0).toBeGreaterThan(0);
      orderId = data.orderId;
      viewToken = data.viewToken;
    } finally {
      await anon.dispose();
    }
  });

  test("status polling requires the right viewToken", async () => {
    test.skip(!orderId, "no order (ordering closed)");
    const anon = await anonContext();
    try {
      const ok = await anon.get(
        `/api/order/status?orderId=${orderId}&token=${viewToken}`,
      );
      expect(ok.status()).toBe(200);
      expect(((await ok.json()) as { orderStatus: string }).orderStatus).toBe(
        "new",
      );

      const wrongToken = await anon.get(
        `/api/order/status?orderId=${orderId}&token=${"0".repeat(32)}`,
      );
      expect(wrongToken.status()).toBe(404);

      const missingToken = await anon.get(
        `/api/order/status?orderId=${orderId}`,
      );
      expect(missingToken.status()).toBe(400);
    } finally {
      await anon.dispose();
    }
  });

  test("staff can walk the status machine and reopen a cancelled order", async ({
    request,
  }) => {
    test.skip(!orderId, "no order (ordering closed)");
    for (const status of ["acknowledged", "ready", "completed", "cancelled"]) {
      const res = await request.patch(`/api/dashboard/orders/${orderId}`, {
        headers: ORIGIN,
        data: { orderStatus: status },
      });
      expect(res.status(), `PATCH → ${status}`).toBe(200);
      const { order } = (await res.json()) as {
        order: { orderStatus: string };
      };
      expect(order.orderStatus).toBe(status);
    }

    // The mis-tap recovery path: cancelled → new (Reopen as new).
    const reopened = await request.patch(`/api/dashboard/orders/${orderId}`, {
      headers: ORIGIN,
      data: { orderStatus: "new" },
    });
    expect(reopened.status()).toBe(200);
    const { order } = (await reopened.json()) as {
      order: { orderStatus: string; cancelledAt?: string | null };
    };
    expect(order.orderStatus).toBe("new");
    expect(order.cancelledAt ?? null).toBeNull();
  });

  test("bogus status and unknown order are rejected cleanly", async ({
    request,
  }) => {
    test.skip(!orderId, "no order (ordering closed)");
    const bogus = await request.patch(`/api/dashboard/orders/${orderId}`, {
      headers: ORIGIN,
      data: { orderStatus: "yeeted" },
    });
    expect(bogus.status()).toBe(400);

    const missing = await request.patch(`/api/dashboard/orders/ZZZZZZ`, {
      headers: ORIGIN,
      data: { orderStatus: "ready" },
    });
    expect(missing.status()).toBe(404);
  });

  test("dashboard search finds the order by name", async ({ request }) => {
    test.skip(!orderId, "no order (ordering closed)");
    const res = await request.get(
      `/api/dashboard/orders/search?q=${encodeURIComponent("E2E Lifecycle")}`,
    );
    expect(res.status()).toBe(200);
    const { orders } = (await res.json()) as { orders: { id: string }[] };
    expect(orders.some((o) => o.id === orderId)).toBe(true);
  });
});

test("contact form succeeds (email is a no-op in e2e)", async () => {
  const anon = await anonContext();
  try {
    const res = await anon.post("/api/contact", {
      headers: ORIGIN,
      data: {
        name: "E2E Contact",
        email: "e2e@example.com",
        message: "Hello from the automated test suite.",
      },
    });
    expect(res.status()).toBe(200);
  } finally {
    await anon.dispose();
  }
});

test("new-order alarm still fires while dashboard search is active", async ({
  page,
}) => {
  // Regression for the silent-tablet bug: polling used to stop entirely while
  // the search box had text, so new orders never chimed or toasted.
  const anon = await anonContext();
  try {
    test.skip(!(await orderingOpen(anon)), "ordering closed right now");

    await page.goto("/dashboard");
    await page.getByPlaceholder("Name, phone, or order #").fill("zzqx");

    const name = `E2E Toast ${Date.now()}`;
    const res = await anon.post("/api/order", {
      headers: ORIGIN,
      data: orderBody(name),
    });
    expect(res.status()).toBe(201);

    // Poll interval is 10s; give it two cycles.
    await expect(
      page.getByRole("status").filter({ hasText: name }),
    ).toBeVisible({ timeout: 25_000 });
  } finally {
    await anon.dispose();
  }
});
