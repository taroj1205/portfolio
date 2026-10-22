import type { NextConfig } from "next";

const daily = [{ key: "Cache-Control", value: "public, max-age=86400" }];

const nextConfig: NextConfig = {
  headers() {
    return [
      "/manifest.webmanifest",
      "/apple-icon",
      "/pwa/:size",
      "/games/mochitsuki/art/:layer",
      "/games/masu/art/:layer",
    ].map((source) => ({ headers: daily, source }));
  },
  rewrites() {
    return [{ source: "/", destination: "/en" }];
  },
  images: {
    remotePatterns: [{ hostname: "avatars.githubusercontent.com" }],
  },
  reactCompiler: true,
};

export default nextConfig;
