import type { NextConfig } from "next";

const dev = process.env.NODE_ENV !== "production";

/**
 * What the browser is allowed to load and do on these pages.
 *
 * Nothing here comes from off-site: next/font self-hosts the typefaces, the
 * logos are files in /public, and there is no analytics or CDN. So the policy is
 * "this origin, nothing else" — which is what turns a script somebody managed to
 * store into a string that never runs.
 *
 * `'unsafe-inline'` on scripts is Next's own bootstrap and hydration payload;
 * dropping it means minting a nonce on every request. `'unsafe-eval'` is React
 * Fast Refresh and belongs to `next dev` alone.
 */
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  // Clickjacking: nothing may put this app in a frame. X-Frame-Options below
  // says the same to browsers too old to read this.
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
  `connect-src 'self'${dev ? " ws: wss:" : ""}`,
  ...(dev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          // Every quotation and bill URL carries a document id. Handing that to
          // whatever site somebody clicks through to is the customer list
          // leaking one row at a time.
          { key: "Referrer-Policy", value: "same-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          // Two years, so a browser that has been here once never tries http
          // again — that first request is the one readable on the wire.
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
    ];
  },

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
