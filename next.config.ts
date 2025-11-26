import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exclude WASM files from static optimization
  serverExternalPackages: [],
  
  // Turbopack configuration (Next.js 16+ uses Turbopack by default)
  turbopack: {
    // Turbopack handles WASM files better, no special config needed
  },
};

export default nextConfig;
