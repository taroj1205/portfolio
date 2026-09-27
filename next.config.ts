import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  rewrites() {
    return [{ source: "/", destination: "/en" }];
  },
  images: {
    remotePatterns: [{ hostname: "avatars.githubusercontent.com" }],
  },
  reactCompiler: true,
};

export default nextConfig;
