import { createSerwistRoute } from "@serwist/turbopack";

// Serves the bundled service worker at /serwist/sw.js. Files in public/ and
// Next static chunks are precached automatically — don't add them again via
// additionalPrecacheEntries or the worker throws on conflicting entries.
export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } =
  createSerwistRoute({
    swSrc: "src/app/sw.ts",
    useNativeEsbuild: true,
  });
