// Is the app still usable on a phone? Run it against a running `npm run dev`:
//
//     npm run check:mobile
//
// At 390px and 360px no page may be wider than the screen. Also checks the
// 210mm sheet and that the menu opens over the page rather than pushing it
// down. Screenshots land in scripts/.mobile-shots/.
//
// Signs its own session cookie as src/lib/auth.ts does, so it never needs a
// password.
import { createHmac } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import pg from "pg";
import puppeteer from "puppeteer-core";

const HERE = dirname(fileURLToPath(import.meta.url));
const SHOTS = join(HERE, ".mobile-shots");
const BASE = process.env.BASE_URL ?? "http://localhost:3000";

config({ path: join(HERE, "..", ".env"), quiet: true });
mkdirSync(SHOTS, { recursive: true });

const CHROME =
  process.env.CHROME_PATH ??
  [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "/usr/bin/google-chrome",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ].find(existsSync);

if (!CHROME) throw new Error("Chrome was not found. Set CHROME_PATH to its executable.");

/* -------------------------------------------------- a cookie, minted locally */

const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();
const { rows: users } = await db.query(
  `SELECT id, "passwordHash" FROM "User" WHERE "isActive" = true ORDER BY role LIMIT 1`,
);
const { rows: quotes } = await db.query(`SELECT id FROM "Quotation" LIMIT 1`);
const { rows: bills } = await db.query(`SELECT id FROM "Bill" LIMIT 1`);
await db.end();

if (!users.length) throw new Error("No active user in the dev database — nothing to sign in as.");

const expires = Date.now() + 60 * 60 * 1000;
const secret = process.env.AUTH_SECRET || "bizbook-development-secret-not-for-production";
const mac = createHmac("sha256", secret).update(`${users[0].id}.${expires}.${users[0].passwordHash}`).digest("hex");

/* ------------------------------------------------------------------- sweep */

const PAGES = [
  ["/", "Dashboard"],
  // Renders for a signed-in browser too: the proxy only redirects *towards* it.
  ["/login", "Login"],
  ["/quotations", "Quotations list"],
  ["/quotations?q=al&status=SENT", "Quotations filtered"],
  ["/quotations/new", "New quotation"],
  ["/bills", "Bills list"],
  ["/bills/new", "New bill"],
  ["/templates", "Designs"],
  ["/templates?kind=bill", "Designs as bills"],
  ["/companies", "Companies"],
  ["/customers", "Customers"],
  ...(quotes.length ? [[`/quotations/${quotes[0].id}`, "Quotation view"]] : []),
  ...(bills.length ? [[`/bills/${bills[0].id}`, "Bill view"], [`/bills/${bills[0].id}/edit`, "Edit bill"]] : []),
];

/** The two ends of what people actually hold. Anything wider only gets easier. */
const SCREENS = [
  [390, "iPhone 14"],
  [360, "small Android"],
];

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
await browser.setCookie({
  name: "bizbook_session",
  value: `${users[0].id}.${expires}.${mac}`,
  domain: "localhost",
  path: "/",
});

let failed = 0;

for (const [width, label] of SCREENS) {
  console.log(`\n--- ${width}px (${label}) ---`);
  await page.setViewport({ width, height: 844, isMobile: true, hasTouch: true });

  for (const [path, name] of PAGES) {
    const res = await page.goto(`${BASE}${path}`, { waitUntil: "networkidle0", timeout: 45_000 });
    // Turbopack answers 500 while it is recompiling. One retry, then believe it.
    const status = res.status() === 500 ? (await page.reload({ waitUntil: "networkidle0" })).status() : res.status();

    const m = await page.evaluate(() => ({
      scrollWidth: document.scrollingElement.scrollWidth,
      inner: window.innerWidth,
      // Names what pokes out. An element inside its own overflow-x:auto box is
      // fine and does not widen the page, so this is a note, not the verdict.
      over: [
        ...new Set(
          [...document.querySelectorAll("body *")]
            .filter((el) => el.getBoundingClientRect().right > window.innerWidth + 1)
            .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).split(" ")[0]}`),
        ),
      ].slice(0, 3),
    }));

    const ok = status === 200 && m.scrollWidth <= m.inner + 1;
    if (!ok) failed++;
    await page.screenshot({ path: join(SHOTS, `${width}-${name.replace(/\W+/g, "-").toLowerCase()}.png`) });
    console.log(
      `${ok ? "PASS" : "FAIL"}  ${name.padEnd(18)} ${status}  page ${m.scrollWidth}/${m.inner}px` +
        (m.over.length ? `  (inside a scroller: ${m.over.join(", ")})` : ""),
    );
  }
}

/* ------------------------------------- the drawer: opens over, not downwards */

await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
await page.goto(`${BASE}/templates`, { waitUntil: "networkidle0" });

const mainTopBefore = await page.evaluate(() => document.querySelector("main").getBoundingClientRect().top);
await page.evaluate(() => document.querySelector('button[aria-label="Open menu"]').click());
await new Promise((r) => setTimeout(r, 400));

const drawer = await page.evaluate(() => {
  const d = document.querySelector("dialog");
  const box = d.getBoundingClientRect();
  return {
    modal: d.matches(":modal"),
    left: Math.round(box.left),
    height: Math.round(box.height),
    mainTop: document.querySelector("main").getBoundingClientRect().top,
  };
});
await page.screenshot({ path: join(SHOTS, "390-drawer-open.png") });

// Esc must shut it — half the reason for using <dialog> at all.
await page.keyboard.press("Escape");
await new Promise((r) => setTimeout(r, 400));
const stillOpen = await page.evaluate(() => document.querySelector("dialog").open);

/* ------------------------------ and on paper, still 210mm and not a mm less */

// A zoom left switched on for print would shrink every PDF the office sends,
// unnoticed until a client held one.
let sheetOnPaper = 0;
if (quotes.length) {
  // At A4 width, the page Chrome lays out against when it prints.
  await page.setViewport({ width: 794, height: 1123 });
  await page.emulateMediaType("print");
  await page.goto(`${BASE}/quotations/${quotes[0].id}`, { waitUntil: "networkidle0" });
  sheetOnPaper = await page.evaluate(() =>
    Math.round(document.querySelector(".sheet-fit > * > *").getBoundingClientRect().width),
  );
  await page.emulateMediaType(null);
}

await browser.close();

const drawerOk =
  drawer.modal && drawer.left === 0 && drawer.height > 700 && drawer.mainTop === mainTopBefore && !stillOpen;
if (!drawerOk) failed++;
console.log(
  `\n${drawerOk ? "PASS" : "FAIL"}  Menu drawer  modal=${drawer.modal} left=${drawer.left}px ` +
    `full-height=${drawer.height > 700} pushes-page-down=${drawer.mainTop !== mainTopBefore} ` +
    `closes-on-Esc=${!stillOpen}`,
);

// 210mm = 793.7px. Anything less means the screen zoom leaked into print.
const printOk = !quotes.length || Math.abs(sheetOnPaper - 794) <= 2;
if (!printOk) failed++;
if (quotes.length) {
  console.log(`${printOk ? "PASS" : "FAIL"}  Print media  sheet ${sheetOnPaper}px (must be ~794px = 210mm)`);
}

console.log(`\nScreenshots: ${SHOTS}`);
console.log(failed ? `${failed} check(s) failed.` : "All checks passed.");
process.exit(failed ? 1 : 0);
