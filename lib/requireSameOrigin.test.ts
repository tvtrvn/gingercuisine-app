import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type { NextRequest } from "next/server";

import { isSameOrigin } from "./requireSameOrigin";

function fakeReq(headers: Record<string, string>): NextRequest {
  return { headers: new Headers(headers) } as unknown as NextRequest;
}

const ENV_KEYS = ["VERCEL_ENV", "NEXT_PUBLIC_SITE_URL"] as const;
const saved: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>> = {};

beforeEach(() => {
  for (const k of ENV_KEYS) {
    saved[k] = process.env[k];
    delete process.env[k];
  }
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

describe("isSameOrigin — baseline (no configured site host)", () => {
  it("accepts when Origin matches Host", () => {
    expect(
      isSameOrigin(
        fakeReq({ host: "localhost:3100", origin: "http://localhost:3100" }),
      ),
    ).toBe(true);
  });

  it("rejects when Origin differs from Host", () => {
    expect(
      isSameOrigin(fakeReq({ host: "localhost:3100", origin: "https://evil.com" })),
    ).toBe(false);
  });

  it("fails closed when Origin and Referer are both absent", () => {
    expect(isSameOrigin(fakeReq({ host: "localhost:3100" }))).toBe(false);
  });
});

describe("isSameOrigin — production with NEXT_PUBLIC_SITE_URL set", () => {
  beforeEach(() => {
    process.env.VERCEL_ENV = "production";
    process.env.NEXT_PUBLIC_SITE_URL = "https://gingercuisine.app";
  });

  it("rejects a forged Origin+Host pair that don't match the configured site", () => {
    // Without the configured anchor, Origin === Host would pass. In production
    // the check must anchor to the real site host, not the inbound Host header.
    expect(
      isSameOrigin(fakeReq({ host: "evil.com", origin: "https://evil.com" })),
    ).toBe(false);
  });

  it("accepts the real site Origin regardless of the inbound Host header", () => {
    expect(
      isSameOrigin(
        fakeReq({ host: "some-vercel-node", origin: "https://gingercuisine.app" }),
      ),
    ).toBe(true);
  });
});

describe("isSameOrigin — preview deploys keep Host-based matching", () => {
  it("accepts Origin matching Host when VERCEL_ENV is preview", () => {
    process.env.VERCEL_ENV = "preview";
    process.env.NEXT_PUBLIC_SITE_URL = "https://gingercuisine.app";
    expect(
      isSameOrigin(
        fakeReq({
          host: "app-git-branch.vercel.app",
          origin: "https://app-git-branch.vercel.app",
        }),
      ),
    ).toBe(true);
  });
});
