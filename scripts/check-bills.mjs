// Does the bill workflow actually work? Run it against a running `npm run dev`:
//
//     npm run check:bills
//
// Drives the real path in a headless browser — accepted quotation -> Ready to
// bill -> charges -> bill -> PDF — then checks the money agrees in all three
// places it could differ: the form's running total, the printed sheet, and the
// stored row.
//
// WRITES to whatever DATABASE_URL points at: marks a quotation ACCEPTED, sets a
// company's default GST, and leaves the bill behind. Keep .env on local.
//
// It signs its own session cookie exactly as src/lib/auth.ts does, off the dev
// secret and the dev database, so it never needs anybody's password.
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

const GST = 18;
const CARTAGE = 4500;
const paisa = (n) => Math.round(n * 100) / 100;
const rupees = (n) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();

/* -------------------------------------------------------------- the fixture */

const { rows: users } = await db.query(
  `SELECT id, "passwordHash" FROM "User" WHERE "isActive" = true ORDER BY role LIMIT 1`,
);
if (!users.length) throw new Error("No active user in the dev database — nothing to sign in as.");

// A quotation nobody has billed yet. Marked ACCEPTED so it turns up in the
// queue, which is the first thing being tested.
const { rows: candidates } = await db.query(`
  SELECT q.id, q.number, q."companyId", c.code
  FROM "Quotation" q
  JOIN "Company" c ON c.id = q."companyId"
  WHERE NOT EXISTS (SELECT 1 FROM "Bill" b WHERE b."quotationId" = q.id)
  ORDER BY q.number
  LIMIT 1
`);
if (!candidates.length) {
  throw new Error("Every quotation in the dev database has been billed already — nothing left to test with.");
}
const quotation = candidates[0];

await db.query(`UPDATE "Quotation" SET status = 'ACCEPTED' WHERE id = $1`, [quotation.id]);
await db.query(`UPDATE "Company" SET "defaultGstPercent" = $1 WHERE id = $2`, [GST, quotation.companyId]);

// What the quotation's lines come to. The bill starts as a copy of them, so this
// is the subtotal every later figure is measured against.
const { rows: sums } = await db.query(
  `SELECT COALESCE(SUM(amount), 0)::float8 AS subtotal FROM "QuotationItem" WHERE "quotationId" = $1`,
  [quotation.id],
);
const subtotal = paisa(sums[0].subtotal);
const expectedGst = paisa((subtotal * GST) / 100);
const expectedTotal = paisa(subtotal + expectedGst + CARTAGE);

console.log(`Fixture:   quotation ${quotation.code}-${quotation.number}, subtotal ${rupees(subtotal)}`);
console.log(`Expecting: GST ${GST}% = ${rupees(expectedGst)} + cartage ${rupees(CARTAGE)} = ${rupees(expectedTotal)}\n`);

/* -------------------------------------------------------------- the browser */

const expires = Date.now() + 60 * 60 * 1000;
const secret = process.env.AUTH_SECRET || "bizbook-development-secret-not-for-production";
const mac = createHmac("sha256", secret).update(`${users[0].id}.${expires}.${users[0].passwordHash}`).digest("hex");

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] });
await browser.setCookie({
  name: "bizbook_session",
  value: `${users[0].id}.${expires}.${mac}`,
  domain: "localhost",
  path: "/",
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });

let failed = 0;
const check = (name, ok, detail = "") => {
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name.padEnd(48)}${detail}`);
};

/** Turbopack answers 500 while it is recompiling. One retry, then believe it. */
async function open(path) {
  const res = await page.goto(`${BASE}${path}`, { waitUntil: "networkidle0", timeout: 60_000 });
  return res.status() === 500 ? (await page.reload({ waitUntil: "networkidle0" })).status() : res.status();
}

const clickByText = (label) =>
  page.evaluate((t) => [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === t).click(), label);

try {
  /* -- 1. the accepted quotation is queued for billing --------------------- */

  const billsStatus = await open("/bills");
  const readyHref = `/bills/new?from=${quotation.id}`;
  check(
    "Ready to bill lists the accepted quotation",
    billsStatus === 200 && Boolean(await page.$(`a[href="${readyHref}"]`)),
    `status ${billsStatus}`,
  );

  /* -- 2. opening it copies the lines and prefills the company's GST ------- */

  await open(readyHref);

  const prefill = await page.evaluate(() => ({
    lines: document.querySelectorAll('input[name="itemDescription"]').length,
    label: document.querySelector('input[name="chargeLabel"]')?.value ?? "",
    percent: document.querySelector('input[name="chargePercent"]')?.value ?? "",
  }));
  const { rows: lineCount } = await db.query(`SELECT count(*)::int AS n FROM "QuotationItem" WHERE "quotationId" = $1`, [
    quotation.id,
  ]);
  check("Lines copied from the quotation", prefill.lines === lineCount[0].n, `${prefill.lines} of ${lineCount[0].n}`);
  check(
    "GST prefilled from the company",
    prefill.label === "GST" && Number(prefill.percent) === GST,
    `"${prefill.label}" ${prefill.percent}%`,
  );

  /* -- 3. add a flat cartage charge --------------------------------------- */

  await clickByText("Add charge");
  await page.waitForSelector('input[aria-label="Charge 2 name"]');
  await page.type('input[aria-label="Charge 2 name"]', "Cartage");

  // A fresh amount box must be empty, not "0" — otherwise typing 4500 into it
  // lands beside the zero and bills the customer 45,000. Asserted rather than
  // worked around, because that is what a person would hit too.
  const freshAmount = await page.$eval('input[aria-label="Charge 2 amount"]', (el) => el.value);
  check("New charge's amount box starts empty", freshAmount === "", `"${freshAmount}"`);
  await page.type('input[aria-label="Charge 2 amount"]', String(CARTAGE));

  // The percentage row's amount box must be locked — a figure derived from the
  // rate is not something to type over.
  check("Percentage charge's amount is read-only", await page.$eval('input[aria-label="Charge 1 amount"]', (el) => el.readOnly));

  const onScreenTotal = await page.evaluate(() => {
    const dt = [...document.querySelectorAll("dt")].find((el) => el.textContent.trim() === "Total");
    return dt?.nextElementSibling?.textContent.trim() ?? "";
  });
  check("Running total in the form", onScreenTotal === rupees(expectedTotal), `${onScreenTotal} vs ${rupees(expectedTotal)}`);

  /* -- 4. save ------------------------------------------------------------ */

  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle0", timeout: 60_000 }),
    clickByText("Create bill"),
  ]);

  const url = page.url();
  const billId = url.split("/bills/")[1] ?? "";
  check("Redirected to the new bill", /\/bills\/[a-z0-9]+$/.test(url), url.replace(BASE, ""));

  // Landing on the right address is not the same as the page working. Next's
  // error screen is a 200 with a URL that looks perfectly correct, and it will
  // even print to a valid-looking PDF — so say so plainly rather than letting
  // the later checks fail one by one and leave the cause to guesswork.
  const crash = await page.evaluate(() => {
    const t = document.body.innerText;
    return t.includes("This page couldn't load") || t.includes("Runtime TypeError") ? t.slice(0, 200) : "";
  });
  check("Bill page rendered without a server error", crash === "", crash.replace(/\s+/g, " "));

  /* -- 5. the sheet says BILL, and says the same figure -------------------- */

  await page.screenshot({ path: join(SHOTS, "bill-view.png"), fullPage: true });

  // textContent, not innerText: .sheet-fit is a `container-type: inline-size`
  // box with a zoomed child, and innerText is layout-dependent enough to come
  // back empty from it.
  const sheet = await page.evaluate(
    () => (document.querySelector(".sheet-fit")?.textContent ?? "").replace(/\s+/g, " "),
  );
  check("Sheet has text at all", sheet.length > 200, `${sheet.length} chars`);
  // The wording every design takes from docWords(): a bill says Due Date, a
  // quotation says Valid Until. Checked on the labels rather than on the whole
  // sheet, because the notes copied over may legitimately mention a quotation.
  check("Sheet is worded as a bill", sheet.includes("Due Date") && !sheet.includes("Valid Until"));
  check("Sheet carries the B- reference", /[A-Z]+-B-\d+/.test(sheet), sheet.match(/[A-Z]+-B-\d+/)?.[0] ?? "not found");
  check("Sheet shows the GST line", sheet.includes(`GST ${GST}%`));
  check("Sheet shows the total", sheet.includes(rupees(expectedTotal)));

  /* -- 6. and the database holds exactly that ----------------------------- */

  const { rows: stored } = await db.query(
    `SELECT status, subtotal::float8, "chargesTotal"::float8, total::float8, "quotationId"
     FROM "Bill" WHERE id = $1`,
    [billId],
  );
  const { rows: storedCharges } = await db.query(
    `SELECT label, percent::float8, amount::float8 FROM "BillCharge" WHERE "billId" = $1 ORDER BY "sortOrder"`,
    [billId],
  );

  const b = stored[0];
  check("Stored subtotal", b?.subtotal === subtotal, `${b?.subtotal}`);
  check("Stored charges total", b?.chargesTotal === paisa(expectedGst + CARTAGE), `${b?.chargesTotal}`);
  check("Stored total", b?.total === expectedTotal, `${b?.total}`);
  check("Bill records the quotation it came from", b?.quotationId === quotation.id);
  check(
    "GST stored as a rate, not baked into a label",
    storedCharges[0]?.label === "GST" && storedCharges[0]?.percent === GST && storedCharges[0]?.amount === expectedGst,
    JSON.stringify(storedCharges[0]),
  );
  check(
    "Cartage stored as a flat figure",
    storedCharges[1]?.label === "Cartage" && storedCharges[1]?.percent === null && storedCharges[1]?.amount === CARTAGE,
    JSON.stringify(storedCharges[1]),
  );

  /* -- 7. the quotation leaves the queue ---------------------------------- */

  await open("/bills");
  check("Billed quotation has left Ready to bill", (await page.$(`a[href="${readyHref}"]`)) === null);

  /* -- 8. the PDF is a PDF ------------------------------------------------ */

  const pdf = await page.evaluate(async (id) => {
    const res = await fetch(`/api/bills/${id}/pdf`);
    const buf = new Uint8Array(await res.arrayBuffer());
    return {
      status: res.status,
      type: res.headers.get("content-type"),
      disposition: res.headers.get("content-disposition"),
      head: String.fromCharCode(...buf.slice(0, 5)),
      bytes: buf.length,
    };
  }, billId);
  check(
    "PDF downloads",
    pdf.status === 200 && pdf.type === "application/pdf" && pdf.head === "%PDF-",
    `${pdf.bytes} bytes, ${pdf.disposition ?? pdf.status}`,
  );

  /* -- 9. editing reads the charges back into the right boxes ------------- */

  await open(`/bills/${billId}/edit`);
  const reopened = await page.evaluate(() => ({
    gstPercent: document.querySelector('input[aria-label="Charge 1 percentage"]')?.value ?? "",
    cartagePercent: document.querySelector('input[aria-label="Charge 2 percentage"]')?.value ?? "",
    cartageAmount: document.querySelector('input[aria-label="Charge 2 amount"]')?.value ?? "",
  }));
  check(
    "Charges reopen in the boxes they were typed in",
    Number(reopened.gstPercent) === GST && reopened.cartagePercent === "" && Number(reopened.cartageAmount) === CARTAGE,
    JSON.stringify(reopened),
  );

  console.log(`\nBill left in the dev database: ${BASE}/bills/${billId}`);
} finally {
  await browser.close();
  await db.end();
}

console.log(`Screenshot: ${join(SHOTS, "bill-view.png")}`);
console.log(failed ? `\n${failed} check(s) failed.` : "\nAll bill checks passed.");
process.exit(failed ? 1 : 0);
