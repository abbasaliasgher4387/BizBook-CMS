import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The floating Next.js badge in the corner. Useful on a developer's machine,
  // confusing on the screen the client is being shown — compile and runtime
  // errors still surface without it.
  devIndicators: false,
};

export default nextConfig;
