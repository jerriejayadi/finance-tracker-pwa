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
  allowedDevOrigins: [process.env.DEV_ORIGIN || "http://localhost:3000"], // Allow the development origin for PWA features
};

export default withPWA(nextConfig);
