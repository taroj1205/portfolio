import type { MetadataRoute } from "next";

const manifest = (): MetadataRoute.Manifest => ({
  background_color: "#f5f1ea",
  description: "Shintaro Jokagi's portfolio, photos and small games.",
  display: "standalone",
  icons: [
    { purpose: "any", sizes: "192x192", src: "/pwa/192", type: "image/png" },
    { purpose: "any", sizes: "512x512", src: "/pwa/512", type: "image/png" },
    {
      purpose: "maskable",
      sizes: "512x512",
      src: "/pwa/512",
      type: "image/png",
    },
  ],
  id: "/",
  name: "Shintaro Jokagi",
  shortcuts: [{ name: "Games", url: "/games" }],
  short_name: "Shintaro",
  start_url: "/",
  theme_color: "#f5f1ea",
});

export default manifest;
