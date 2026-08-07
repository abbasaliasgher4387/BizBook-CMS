import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The floating Next.js badge in the corner. Useful on a developer's machine,
  // confusing on the screen the client is being shown — compile and runtime
  // errors still surface without it.
  devIndicators: false,

  // The headless Chromium that prints PDFs ships as ~67 MB of brotli blobs in
  // @sparticuz/chromium/bin. No line of code imports them — they are opened by
  // path at runtime — so Next's file tracing sees nothing pointing at them and
  // leaves them out of the deployed function, which then fails with
  //   The input directory "/var/task/node_modules/@sparticuz/chromium/bin"
  //   does not exist.
  // Both PDF routes sit under /api, so one glob covers them. The key is matched
  // against the route path, which is why it is not the folder name: writing the
  // bracket of /api/quotations/[id]/pdf here would be read as a character class.
  outputFileTracingIncludes: {
    "/api/**": ["./node_modules/@sparticuz/chromium/bin/**"],
  },
};

export default nextConfig;
