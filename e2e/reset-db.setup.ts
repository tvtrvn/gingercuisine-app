import { test as setup } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

// Wipe the test-DB state that specs mutate, so leftovers from an interrupted
// run can't poison assertions. (This exact failure happened: a stale
// sold-out-small override on pho-beef made the price-override test read
// $101.99 instead of $99.99.) TEST_DATABASE_URL is a throwaway database —
// see docs/e2e-testing.md — so wiping orders wholesale is safe.
setup("reset test database", async () => {
  const url = process.env.TEST_DATABASE_URL;
  setup.skip(!url, "TEST_DATABASE_URL not set — nothing to reset");

  const prisma = new PrismaClient({ datasourceUrl: url });
  try {
    await prisma.restaurantSetting.deleteMany({
      where: { key: { in: ["menuCustomizations", "menuAuditLog"] } },
    });
    await prisma.order.deleteMany({});
  } finally {
    await prisma.$disconnect();
  }
});
