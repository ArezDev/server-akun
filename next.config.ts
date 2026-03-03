import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true, // ⛔️ Ini yang men-disable linting saat build
  },
};

export default nextConfig;
