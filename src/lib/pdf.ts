// A quotation is a printed document, so the PDF is produced the same way the
// paper is: a real browser renders the same page and prints it. No second
// layout to keep in sync, and what downloads is exactly what a printer emits.
//
// Locally that is the Chrome already installed on the machine; on Vercel it is
// the bundled headless build. Set CHROME_PATH to override either.
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

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

/**
 * Renders a page of this app to an A4 PDF. `url` must be absolute.
 *
 * `cookie` is the Cookie header of the request that asked for the download. The
 * pages being printed sit behind the sign-in guard, so without it the headless
 * browser is a stranger and every PDF comes out as the login screen. Passing it
 * on also means a download is rendered as — and only as — whoever asked for it.
 */
export async function renderPdf(url: string, cookie?: string | null): Promise<Uint8Array> {
  const onVercel = Boolean(process.env.VERCEL);

  const browser = await puppeteer.launch(
    onVercel
      ? { args: chromium.args, executablePath: await chromium.executablePath(), headless: true }
      : { executablePath: await localExecutable(), headless: true, args: ["--no-sandbox"] },
  );

  try {
    const page = await browser.newPage();
    if (cookie) await page.setExtraHTTPHeaders({ cookie });
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

/** The app's own origin, as seen by the incoming request. */
export function originOf(req: Request): string {
  const h = req.headers;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/** Turns a document number into a safe download filename. */
export function pdfFilename(name: string): string {
  return `${name.replace(/[^A-Za-z0-9._-]+/g, "-")}.pdf`;
}
