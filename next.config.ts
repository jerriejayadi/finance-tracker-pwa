import type { NextConfig } from "next";

import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public", // Where the service worker files will be generated
  cacheOnFrontEndNav: true, 
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development", // Disables PWA in dev mode to prevent caching issues while coding
});

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.132.152"],
};

export default withPWA(nextConfig);
