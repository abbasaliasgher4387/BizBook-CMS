// Do the list filters actually filter? Run it against a running `npm run dev`:
//
//     npm run check:filters
//
// Asks for a filtered list over HTTP, counts the rows, and compares against the
// same question put to the database. The three that matter are silent failures:
// a `to` date left at midnight drops that day, an unchecked `status` takes the
// page down, and SAMS-0007 never matches the stored "0007".
//
// Read-only, and signs its own cookie as src/lib/auth.ts does.
import { createHmac } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import pg from "pg";

const HERE = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
config({ path: join(HERE, "..", ".env"), quiet: true });

const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();

const one = async (sql, params = []) => (await db.query(sql, params)).rows;
const [user] = await one(`SELECT id, "passwordHash" FROM "User" WHERE "isActive" = true ORDER BY role LIMIT 1`);
if (!user) throw new Error("No active user in the dev database — nothing to sign in as.");

const expires = Date.now() + 60 * 60 * 1000;
const secret = process.env.AUTH_SECRET || "bizbook-development-secret-not-for-production";
const mac = createHmac("sha256", secret).update(`${user.id}.${expires}.${user.passwordHash}`).digest("hex");
const cookie = `bizbook_session=${user.id}.${expires}.${mac}`;

/** Rows on the page. Every row links to its document; the New button links
    to /quotations/new and is not one. */
async function rowsOn(path) {
  const res = await fetch(`${BASE}${path}`, { headers: { cookie } });
  if (res.status !== 200) throw new Error(`${path} answered ${res.status}`);
  const html = await res.text();
  const kind = path.startsWith("/bills") ? "bills" : "quotations";
  const found = html.matchAll(new RegExp(`href="/${kind}/([a-z0-9_]+)"`, "g"));
  return new Set([...found].map((m) => m[1]).filter((id) => id !== "new")).size;
}

let failed = 0;
async function check(name, path, expected) {
  const got = await rowsOn(path);
  const ok = got === expected;
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name.padEnd(44)} got ${got}, expected ${expected}`);
}

/* ------------------------------------------------------------ the questions */

const [{ count: allQuotations }] = await one(`SELECT count(*)::int FROM "Quotation"`);
const [{ count: sent }] = await one(`SELECT count(*)::int FROM "Quotation" WHERE status = 'SENT'`);
const [{ count: issued }] = await one(`SELECT count(*)::int FROM "Bill" WHERE status = 'ISSUED'`);

await check("no filters shows everything", "/quotations", allQuotations);
await check("status=SENT", "/quotations?status=SENT", sent);
await check("status is case-insensitive", "/quotations?status=sent", sent);
// Garbage in the address bar must be ignored, not handed to the database.
await check("status=DROP is ignored, not obeyed", "/quotations?status=DROP+TABLE", allQuotations);
await check("bills status=ISSUED", "/bills?status=ISSUED", issued);

// A name somebody would actually type, matched however they capitalise it.
const [{ count: named }] = await one(`SELECT count(*)::int FROM "Quotation" q
  JOIN "Customer" c ON c.id = q."customerId" WHERE c.name ILIKE '%indus%'`);
await check("q= part of a customer's name", "/quotations?q=INDUS", named);

// The number as it appears on the printed sheet, company prefix and all.
const [sheet] = await one(`SELECT co.code, q.number FROM "Quotation" q
  JOIN "Company" co ON co.id = q."companyId" ORDER BY q."createdAt" LIMIT 1`);
const [{ count: sameNumber }] = await one(`SELECT count(*)::int FROM "Quotation" WHERE number = $1`, [sheet.number]);
await check(`q=${sheet.code}-${sheet.number} (as printed)`, `/quotations?q=${sheet.code}-${sheet.number}`, sameNumber);

// One single day, from and to the same date. Rows carry a real time of day, so
// this comes back empty unless `to` is pushed to the end of it.
const [{ day }] = await one(`SELECT to_char(date, 'YYYY-MM-DD') AS day FROM "Quotation" ORDER BY date DESC LIMIT 1`);
const [{ count: onThatDay }] = await one(
  `SELECT count(*)::int FROM "Quotation" WHERE to_char(date, 'YYYY-MM-DD') = $1`,
  [day],
);
await check(`from=to=${day} (end-of-day)`, `/quotations?from=${day}&to=${day}`, onThatDay);

// Two filters at once narrow, rather than one replacing the other.
const firstOfMonth = `${day.slice(0, 8)}01`;
const [{ count: sentSince }] = await one(
  `SELECT count(*)::int FROM "Quotation" WHERE status = 'SENT' AND date >= $1::date`,
  [firstOfMonth],
);
await check("status and from together", `/quotations?status=SENT&from=${firstOfMonth}`, sentSince);

// A nonsense date is no filter at all, not an empty list.
await check("a broken date is ignored", "/quotations?from=not-a-date", allQuotations);

await db.end();
console.log(failed ? `\n${failed} check(s) failed.` : "\nAll checks passed.");
process.exit(failed ? 1 : 0);
