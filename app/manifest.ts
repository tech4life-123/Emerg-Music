import type { MetadataRoute } from "next";

// Lets people install Emerg Music to their phone's home screen; the phone then shows its own splash screen using these colours and the icon.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Emerg Music",
    short_name: "Emerg",
    description: "Discover. Stream. Share. Music from Liberia and Africa.",
    start_url: "/",
    display: "standalone",
    background_color: "#130F18",
    theme_color: "#130F18",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
