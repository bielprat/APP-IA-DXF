import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  transpilePackages: ["@cr/catalog", "@cr/prompt-engine"],
  outputFileTracingRoot: new URL("../..", import.meta.url).pathname,
};

export default nextConfig;
