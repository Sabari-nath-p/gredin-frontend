import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.STANDALONE_BUILD === 'true' ? 'standalone' : undefined,
  env: {
    BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:3000',
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.BACKEND_URL || 'http://localhost:3000'}/:path*`,
      },
    ];
  },
};

export default nextConfig;
