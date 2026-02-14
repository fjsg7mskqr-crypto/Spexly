import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['127.0.0.1', '192.168.1.128'],
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
