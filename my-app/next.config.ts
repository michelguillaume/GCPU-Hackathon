import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
    eslint: {
        ignoreDuringBuilds: true, // Ignore ESLint lors de la construction
    },
};

export default nextConfig;
