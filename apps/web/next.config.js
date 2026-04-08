const path = require("node:path");

/** Monorepo root (`estateiq/`), not `apps/web` — required so file tracing pulls Prisma engines from `packages/database`. */
const tracingRoot = path.join(__dirname, "..", "..");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep Prisma as external (runtime env + native engine). Do NOT list `@estateiq/database` here —
  // it lives outside `node_modules` and externalizing it drops the generated query-engine binaries
  // from the Netlify bundle (Prisma looks for `libquery_engine-rhel-openssl-3.0.x.so.node`).
  serverExternalPackages: ["@prisma/client", "prisma"],
  // Monorepo + Netlify: trace from repo root so `packages/database/...` resolves; paths below are
  // relative to `tracingRoot` (see https://pris.ly/d/engine-not-found-nextjs).
  outputFileTracingRoot: tracingRoot,
  outputFileTracingIncludes: {
    "/*": ["./packages/database/src/generated/prisma/**/*"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          { key: "X-XSS-Protection", value: "1; mode=block" },
        ],
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

module.exports = nextConfig;
