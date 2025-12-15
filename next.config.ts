import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "openweathermap.org",
      },
      {
        protocol: "https",
        hostname: "*.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "plant.id",
      },
    ],
  },
  // Add empty turbopack config to silence warning
  turbopack: {},
};

// Note: next-pwa doesn't support Next.js 16 with Turbopack yet
// PWA will be handled via service worker in production
export default nextConfig;
