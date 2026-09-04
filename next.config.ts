import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  images: { remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }] },
  experimental: {
    cpus: 1,
    optimizePackageImports: ["lucide-react", "recharts"],
  },
};
export default nextConfig;
