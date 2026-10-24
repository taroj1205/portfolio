import type { MetadataRoute } from "next";

import icon from "@/assets/profile.webp";

const manifest = (): MetadataRoute.Manifest => ({
  background_color: "#f5f1ea",
  description: "Shintaro Jokagi's portfolio, photos and small games.",
  display: "standalone",
  icons: (["any", "maskable"] as const).map((purpose) => ({
    purpose,
    sizes: "192x192 512x512",
    src: icon.src,
    type: "image/webp",
  })),
  id: "/",
  name: "Shintaro Jokagi",
  shortcuts: [{ name: "Games", url: "/games" }],
  short_name: "Shintaro",
  start_url: "/",
  theme_color: "#f5f1ea",
});

export default manifest;
