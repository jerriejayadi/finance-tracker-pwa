import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { withSerwist } from "@serwist/turbopack";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  allowedDevOrigins: [process.env.DEV_ORIGIN || "http://localhost:3000"],
};

export default withNextIntl(withSerwist(nextConfig));
