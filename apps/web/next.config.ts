import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@regularizando/ui", "@regularizando/db"],
};

export default nextConfig;
