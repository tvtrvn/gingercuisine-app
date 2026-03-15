/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["stripe", "zod", "resend"],
  },
};

export default nextConfig;

