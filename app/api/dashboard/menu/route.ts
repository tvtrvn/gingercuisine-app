import { del } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

import {
  addCustomItem,
  deleteCustomItem,
  getMenuAuditLog,
  getMenuItems,
  updateCustomItem,
  upsertOverride,
} from "@/lib/menuStore";
import {
  dashboardReadRateLimit,
  dashboardRateLimitKey,
  dashboardWriteRateLimit,
  retryAfterSeconds,
} from "@/lib/rateLimit";
import { requireDashboardApi } from "@/lib/requireDashboardSession";
import { isSameOrigin } from "@/lib/requireSameOrigin";
import {
  customItemSchema,
  menuDeleteSchema,
  menuPatchSchema,
} from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** A URL we uploaded to Vercel Blob (so it's safe to delete on cleanup). */
function isBlobUrl(url: string | undefined): url is string {
  return !!url && url.includes(".blob.vercel-storage.com/");
}

async function bestEffortDeleteBlob(url: string | undefined): Promise<void> {
  if (!isBlobUrl(url)) return;
  try {
    await del(url);
  } catch (error) {
    // Cleanup failure must never block the user's edit/delete.
    console.error("[/api/dashboard/menu] blob cleanup failed:", error);
  }
}

function tooMany(reset: number) {
  return NextResponse.json(
    { error: "Too many updates in a short time. Slow down a bit." },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds(reset)) } },
  );
}

async function parseJson(req: NextRequest): Promise<unknown | null> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

/** GET — the merged menu + recent audit entries for the dashboard UI. */
export async function GET(req: NextRequest) {
  const unauthorized = await requireDashboardApi();
  if (unauthorized) return unauthorized;

  const rl = await dashboardReadRateLimit.limit(await dashboardRateLimitKey(req));
  if (!rl.success) return tooMany(rl.reset);

  try {
    const [items, audit] = await Promise.all([
      getMenuItems(),
      getMenuAuditLog(),
    ]);
    // Newest audit entries first, capped for the UI.
    return NextResponse.json(
      { items, audit: audit.slice(-50).reverse() },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[/api/dashboard/menu GET]", error);
    return NextResponse.json(
      { error: "Failed to load the menu." },
      { status: 500 },
    );
  }
}

/** POST — add a new custom item. */
export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const unauthorized = await requireDashboardApi();
  if (unauthorized) return unauthorized;

  const actor = await dashboardRateLimitKey(req);
  const rl = await dashboardWriteRateLimit.limit(actor);
  if (!rl.success) return tooMany(rl.reset);

  const parsed = customItemSchema.safeParse(await parseJson(req));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const item = await addCustomItem(parsed.data, actor);
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("[/api/dashboard/menu POST]", error);
    return NextResponse.json(
      { error: "Failed to add the item." },
      { status: 500 },
    );
  }
}

/** PATCH — override a base item OR edit a custom item (discriminated body). */
export async function PATCH(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const unauthorized = await requireDashboardApi();
  if (unauthorized) return unauthorized;

  const actor = await dashboardRateLimitKey(req);
  const rl = await dashboardWriteRateLimit.limit(actor);
  if (!rl.success) return tooMany(rl.reset);

  const parsed = menuPatchSchema.safeParse(await parseJson(req));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    if (parsed.data.kind === "override") {
      await upsertOverride(parsed.data.itemId, parsed.data.patch, actor);
      return NextResponse.json({ ok: true });
    }

    const result = await updateCustomItem(
      parsed.data.itemId,
      parsed.data.patch,
      actor,
    );
    if (!result) {
      return NextResponse.json({ error: "Item not found." }, { status: 404 });
    }
    // If the photo was swapped for a different one, clean up the old blob.
    if (result.previousImage !== result.updated.image) {
      await bestEffortDeleteBlob(result.previousImage);
    }
    return NextResponse.json({ item: result.updated });
  } catch (error) {
    console.error("[/api/dashboard/menu PATCH]", error);
    return NextResponse.json(
      { error: "Failed to save changes." },
      { status: 500 },
    );
  }
}

/** DELETE — remove a custom item and clean up its blob image. */
export async function DELETE(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const unauthorized = await requireDashboardApi();
  if (unauthorized) return unauthorized;

  const actor = await dashboardRateLimitKey(req);
  const rl = await dashboardWriteRateLimit.limit(actor);
  if (!rl.success) return tooMany(rl.reset);

  const parsed = menuDeleteSchema.safeParse(await parseJson(req));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const removed = await deleteCustomItem(parsed.data.itemId, actor);
    if (!removed) {
      return NextResponse.json({ error: "Item not found." }, { status: 404 });
    }
    await bestEffortDeleteBlob(removed.image);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[/api/dashboard/menu DELETE]", error);
    return NextResponse.json(
      { error: "Failed to delete the item." },
      { status: 500 },
    );
  }
}
