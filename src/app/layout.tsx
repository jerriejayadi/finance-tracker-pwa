import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { QueryProvider } from "@/providers/query-provider";
import "./globals.css";

import { PwaElements } from "@/components/pwa/pwa-elements";
import { ThemeProvider } from "next-themes";
import type { Viewport } from "next";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fintrack",
  description: "Finance Tracking PWA",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Fintrack",
  },
};

export const viewport: Viewport = {
  themeColor: "#05bd89",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background-light dark:bg-background-dark">
        <ThemeProvider attribute="class" defaultTheme="light">
          <QueryProvider>
            {children}
            <PwaElements />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
