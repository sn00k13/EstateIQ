import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prisma must not be bundled into server chunks as a single static client — breaks Netlify/serverless
  // when DATABASE_URL is only available at runtime.
  serverExternalPackages: ["@prisma/client", "prisma", "@estateiq/database"],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options',           value: 'DENY'              },
          { key: 'X-Content-Type-Options',    value: 'nosniff'           },
          { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'X-XSS-Protection',          value: '1; mode=block'     },
        ],
      },
    ]
  },


  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
