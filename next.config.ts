import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // standalone is for self-hosting (bun .next/standalone/server.js); Vercel
  // builds break on its output-file tracing, so disable it there.
  output: process.env.VERCEL ? undefined : "standalone",
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: false,
  outputFileTracingIncludes: {
    "/api/**": ["./db/custom.db"],
  },
};

export default nextConfig;
