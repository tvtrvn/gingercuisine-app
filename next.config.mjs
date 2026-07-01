/** @type {import("next").NextConfig} */

// Baseline defensive headers. We intentionally do NOT enable a full
// Content-Security-Policy here because the site uses Tailwind + Next.js
// which require inline styles & scripts; a wrong CSP would break the app
// silently. Add a strict CSP later once you can test it end-to-end.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

// Extra-strict headers for the restaurant dashboard: never allow any cross-site
// referer leakage, never cache responses, never allow indexing.
const dashboardHeaders = [
  ...securityHeaders,
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "Cache-Control", value: "no-store, max-age=0" },
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ["zod", "resend", "motion"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/dashboard/:path*",
        headers: dashboardHeaders,
      },
      {
        source: "/api/dashboard/:path*",
        headers: dashboardHeaders,
      },
    ];
  },
};

export default nextConfig;
