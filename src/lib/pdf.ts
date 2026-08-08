// The PDF is made the same way the paper is: a real browser prints the same
// page, so there is no second layout to keep in sync. Locally that is the
// installed Chrome, on Vercel the bundled headless build; CHROME_PATH overrides.
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import { SESSION_COOKIE } from "@/lib/auth";

const LOCAL_CHROME = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium-browser",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
];

async function localExecutable(): Promise<string> {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const { existsSync } = await import("node:fs");
  const found = LOCAL_CHROME.find((p) => existsSync(p));
  if (!found) {
    throw new Error(
      "Chrome was not found. Install Google Chrome, or set CHROME_PATH to its executable, to download PDFs.",
    );
  }
  return found;
}

/** One named cookie out of a Cookie header, or null. */
function readCookie(header: string | null | undefined, name: string): string | null {
  for (const part of (header ?? "").split(";")) {
    const eq = part.indexOf("=");
    if (eq > 0 && part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim();
  }
  return null;
}

/**
 * Renders a page of this app to an A4 PDF. `url` must be absolute, and must come
 * from originOf() — never from anything the caller sent.
 *
 * `cookie` is the Cookie header of the request that asked for the download. The
 * pages being printed sit behind the sign-in guard, so without it the headless
 * browser is a stranger and every PDF comes out as the login screen. Passing it
 * on also means a download is rendered as — and only as — whoever asked for it.
 *
 * The session is handed over as a cookie tied to this app's own origin, not as a
 * blanket Cookie header. A header is attached to *every* request the page makes,
 * so one off-site <img> on a letterhead would be sent somebody's live session.
 */
export async function renderPdf(url: string, cookie?: string | null): Promise<Uint8Array> {
  const onVercel = Boolean(process.env.VERCEL);

  const browser = await puppeteer.launch(
    onVercel
      ? { args: chromium.args, executablePath: await chromium.executablePath(), headless: true }
      : { executablePath: await localExecutable(), headless: true, args: ["--no-sandbox"] },
  );

  try {
    const session = readCookie(cookie, SESSION_COOKIE);
    if (session) {
      const target = new URL(url);
      await browser.setCookie({
        name: SESSION_COOKIE,
        value: session,
        domain: target.hostname,
        path: "/",
        secure: target.protocol === "https:",
        httpOnly: true,
      });
    }

    const page = await browser.newPage();
    // networkidle0 so the letterhead webfonts have finished loading — without
    // it the first PDF after a cold start comes out in a fallback face.
    await page.goto(url, { waitUntil: "networkidle0", timeout: 30_000 });
    await page.emulateMediaType("print");
    return await page.pdf({ format: "a4", printBackground: true, preferCSSPageSize: true });
  } finally {
    await browser.close();
  }
}

/**
 * What both PDF routes answer with when the render fails. The message goes back
 * as the body rather than a bare 500: a headless browser fails for a dozen
 * unrelated reasons — no Chrome, out of memory, the page timed out — and being
 * told which one is the difference between a fix and a guess. Only signed-in
 * staff can reach these routes, so there is nobody to leak it to.
 */
export function pdfError(e: unknown): Response {
  console.error("PDF render failed:", e);
  return new Response(e instanceof Error ? e.message : "The PDF could not be generated.", {
    status: 500,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

/**
 * The app's own origin — the one address the headless browser is ever pointed
 * at.
 *
 * Not the request's Host or X-Forwarded-Host header. Those are typed by whoever
 * is calling, and this URL is then fetched by a browser running on the server
 * and carrying that caller's session: one `X-Forwarded-Host: attacker.example`
 * and the server fetches whatever the attacker likes — an internal address, the
 * cloud metadata endpoint — and hands the result back as a PDF. The origin has
 * to come from configuration, which no request can rewrite.
 *
 * On Vercel, VERCEL_URL is set by the platform and is safe for the same reason.
 * APP_ORIGIN overrides it for anywhere else.
 */
export function originOf(req: Request): string {
  const configured = process.env.APP_ORIGIN ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);
  if (configured) return configured.replace(/\/+$/, "");

  if (process.env.NODE_ENV === "production") {
    throw new Error("APP_ORIGIN is not set. PDF downloads need the site's own address, e.g. https://bizbook.example.");
  }

  // Development: the dev server's own port, and only ever this machine.
  const host = req.headers.get("host") ?? "localhost:3000";
  if (!/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host)) {
    throw new Error(`Refusing to render a PDF from "${host}". Set APP_ORIGIN to this app's address.`);
  }
  return `http://${host}`;
}

/** Turns a document number into a safe download filename. */
export function pdfFilename(name: string): string {
  return `${name.replace(/[^A-Za-z0-9._-]+/g, "-")}.pdf`;
}
