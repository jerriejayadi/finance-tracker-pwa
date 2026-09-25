import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { QueryProvider } from "@/providers/query-provider";
import "./globals.css";

import { PwaElements } from "@/components/pwa/pwa-elements";
import { SerwistProvider } from "@serwist/turbopack/react";
import { ThemeProvider } from "next-themes";
import { LocaleProvider, localeInitScript } from "@/i18n/locale-provider";
import { defaultLocale } from "@/i18n/config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fintrack",
  description: "Finance Tracking PWA",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Fintrack",
  },
};

export const viewport: Viewport = {
  themeColor: "#111112",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// No cookies/headers read here — keeps every page statically prerenderable.
// Locale is resolved client-side by LocaleProvider.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang={defaultLocale}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: localeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col [html[data-locale-pending]_&]:invisible">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          value={{ light: "light", dark: "dark" }}
        >
          <LocaleProvider>
            <SerwistProvider
              swUrl="/serwist/sw.js"
              disable={
                process.env.NODE_ENV === "development" &&
                process.env.TEST_WITH_PWA !== "true"
              }
              cacheOnNavigation
              reloadOnOnline
            >
              <QueryProvider>
                {children}
                <PwaElements />
              </QueryProvider>
            </SerwistProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
