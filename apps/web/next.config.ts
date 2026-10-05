import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  outputFileTracingRoot: new URL("../..", import.meta.url).pathname,
};

export default nextConfig;
