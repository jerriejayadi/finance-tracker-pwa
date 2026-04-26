import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Personal Finance Tracker",
    short_name: "FinTrack",
    description: "Track your expenses and manage your budget offline.",
    start_url: "/",
    display: "standalone", // This removes the browser UI (address bar, navigation)
    background_color: "#ffffff",
    theme_color: "#000000",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
