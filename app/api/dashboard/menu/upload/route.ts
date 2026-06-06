import { put } from "@vercel/blob";
import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import {
  dashboardRateLimitKey,
  dashboardWriteRateLimit,
  retryAfterSeconds,
} from "@/lib/rateLimit";
import { requireDashboardApi } from "@/lib/requireDashboardSession";
import { isSameOrigin } from "@/lib/requireSameOrigin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 5_000_000; // 5 MB

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
};

/**
 * Sniff the real image type from the leading bytes. We deliberately ignore the
 * client's Content-Type header — it's trivially spoofed; the magic bytes are
 * the authoritative signal for what we'll actually store.
 */
function sniffImageExt(b: Uint8Array): keyof typeof CONTENT_TYPES | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) {
    return "jpg";
  }
  if (
    b.length >= 8 &&
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
    b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a
  ) {
    return "png";
  }
  if (
    b.length >= 12 &&
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && // RIFF
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50 // WEBP
  ) {
    return "webp";
  }
  if (
    b.length >= 12 &&
    b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70 && // ftyp
    b[8] === 0x61 && b[9] === 0x76 && b[10] === 0x69 && b[11] === 0x66 // avif
  ) {
    return "avif";
  }
  return null;
}

/**
 * POST a raw image body → stores it in Vercel Blob and returns its public URL.
 * The BLOB_READ_WRITE_TOKEN never leaves the server; the client only gets a URL.
 */
export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const unauthorized = await requireDashboardApi();
  if (unauthorized) return unauthorized;

  const rl = await dashboardWriteRateLimit.limit(await dashboardRateLimitKey(req));
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many uploads in a short time. Slow down a bit." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds(rl.reset)) } },
    );
  }

  const buf = Buffer.from(await req.arrayBuffer());
  if (buf.byteLength === 0) {
    return NextResponse.json({ error: "Empty upload." }, { status: 400 });
  }
  if (buf.byteLength > MAX_BYTES) {
    return NextResponse.json(
      { error: "Image is too large (max 5 MB)." },
      { status: 413 },
    );
  }

  const ext = sniffImageExt(buf);
  if (!ext) {
    return NextResponse.json(
      { error: "Unsupported file type. Use JPEG, PNG, WebP, or AVIF." },
      { status: 415 },
    );
  }

  try {
    // Server-generated key — never trust the client filename.
    const blob = await put(`menu-items/${randomUUID()}.${ext}`, buf, {
      access: "public",
      contentType: CONTENT_TYPES[ext],
      addRandomSuffix: false,
    });
    return NextResponse.json({ url: blob.url }, { status: 201 });
  } catch (error) {
    console.error("[/api/dashboard/menu/upload]", error);
    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 500 },
    );
  }
}
