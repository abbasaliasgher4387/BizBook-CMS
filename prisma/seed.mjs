// Demo data for a local database: the seven companies, a handful of customers,
// products and quotations to look at. Run it with `npx prisma db seed`.
//
// Invented data, safe to wipe — real customers and rates belong in the app, not
// in a file that gets committed. Every row has a fixed `demo_` id and is written
// with ON CONFLICT DO UPDATE, so running it twice changes nothing and running it
// after editing this file brings the database back in line.
//
// Uses `pg` rather than the Prisma client on purpose: the client is generated as
// TypeScript into /generated, which a plain node script cannot import, and this
// is a hundred lines of INSERT either way.
import "dotenv/config";
import { Client } from "pg";

const COMPANIES = [
  {
    id: "demo_co_sams",
    code: "SAMS",
    name: "SAMS Traders",
    templateKey: "sams",
    tagline: "Importers, Stockist & General Order Suppliers",
    address: "Shop No. 12, Serai Road, M.A. Jinnah Road, Karachi",
    phone: "021-32620145 / 0300-2345671",
    email: "sales@samstraders.demo",
    ntn: "1234567-1",
    strn: "17-00-9999-001-11",
    gstNumber: null,
    headerNote: null,
  },
  {
    id: "demo_co_biz",
    code: "BIZ",
    name: "Bizway Enterprise",
    templateKey: "bizway",
    tagline: "Suppliers of Industrial Hardware & Safety Items",
    address: "Office 4, Plot 27, Korangi Industrial Area, Karachi",
    phone: "021-35112233 / 0321-2345672",
    email: "info@bizway.demo",
    ntn: "2345678-2",
    strn: null,
    gstNumber: "17-00-9999-002-22",
    headerNote: null,
  },
  {
    id: "demo_co_ms",
    code: "MS",
    name: "Mistry Steel",
    templateKey: "mistry",
    tagline: "MS / GI Sheets, Pipes & Structural Steel",
    address: "Godown 8, Sher Shah Kabari Bazar, Karachi",
    phone: "021-32853344 / 0333-2345673",
    email: "orders@mistrysteel.demo",
    ntn: "3456789-3",
    strn: "17-00-9999-003-33",
    gstNumber: null,
    headerNote: null,
  },
  {
    id: "demo_co_tsa",
    code: "TSA",
    name: "Taheri Supply Agency",
    templateKey: "taheri",
    tagline: "General Order Suppliers & Government Contractors",
    address: "Shop 3, Denso Hall, M.A. Jinnah Road, Karachi",
    phone: "021-32412266 / 0345-2345674",
    email: "taheri.supply@demo.pk",
    ntn: "4567890-4",
    strn: null,
    gstNumber: null,
    headerNote: "Insha Allah",
  },
  {
    id: "demo_co_ame",
    code: "AME",
    name: "Al Mufaddal Enterprises",
    templateKey: "almufaddal",
    tagline: "Importers & Indentors — Hardware, Tools & Fittings",
    address: "Office 2, Rex Centre, Preedy Street, Saddar, Karachi",
    phone: "021-32725588 / 0300-2345675",
    email: "almufaddal@demo.pk",
    ntn: "5678901-5",
    strn: null,
    gstNumber: null,
    headerNote: null,
  },
  {
    id: "demo_co_abt",
    code: "ABT",
    name: "Al Burhan Trading Co.",
    templateKey: "alburhan",
    tagline: "Trading, Import & Supply of Industrial Goods",
    address: "Suite 5, 3rd Floor, Business Avenue, Shahrah-e-Faisal, Karachi",
    phone: "021-34321177 / 0311-2345676",
    email: "sales@alburhan.demo",
    ntn: "6789012-6",
    strn: null,
    gstNumber: "17-00-9999-006-66",
    headerNote: null,
  },
  {
    id: "demo_co_mbis",
    code: "MBIS",
    name: "M.B. Industrial Solution",
    templateKey: "mbis",
    tagline: "Industrial Valves, Bearings & Power Transmission",
    address: "Plot 42, Sector 7-A, North Karachi Industrial Area",
    phone: "021-36994411 / 0301-2345677",
    email: "mbis@demo.pk",
    ntn: "7890123-7",
    strn: null,
    gstNumber: null,
    headerNote: null,
  },
];

const CUSTOMERS = [
  {
    id: "demo_cu_alnoor",
    name: "Al Noor Petroleum (Pvt) Ltd",
    contactPerson: "Purchase Manager",
    address: "Office 4, Korangi Industrial Area, Karachi",
    phone: "021-35123456",
    email: "purchase@alnoor.demo",
    ntn: "1122334-8",
    gstNumber: null,
  },
  {
    id: "demo_cu_indus",
    name: "Indus Fabrication Works",
    contactPerson: "Mr. Kamran Sheikh",
    address: "Plot 19, S.I.T.E. Area, Karachi",
    phone: "021-32571188",
    email: "info@indusfab.demo",
    ntn: "2233445-9",
    gstNumber: "17-00-8888-101-10",
  },
  {
    id: "demo_cu_pakarab",
    name: "Pak Arab Engineering Services",
    contactPerson: "Procurement Dept.",
    address: "Suite 12, Clifton Block 5, Karachi",
    phone: "021-35870022",
    email: "procurement@pakarabeng.demo",
    ntn: "3344556-0",
    gstNumber: null,
  },
  {
    id: "demo_cu_meezan",
    name: "Meezan Construction Co.",
    contactPerson: "Site Engineer",
    address: "Bahria Town, Superhighway, Karachi",
    phone: "0300-8877665",
    email: "site@meezanconst.demo",
    ntn: null,
    gstNumber: null,
  },
  {
    id: "demo_cu_sindh",
    name: "Sindh Poly Pipes (Pvt) Ltd",
    contactPerson: "Mr. Faisal Qureshi",
    address: "Plot 88, Hub River Road, Karachi",
    phone: "021-32345566",
    email: "orders@sindhpoly.demo",
    ntn: "4455667-1",
    gstNumber: "17-00-8888-102-20",
  },
];

const PRODUCTS = [
  { id: "demo_pr_sht12", code: "MS-SHT-12", name: "MS Sheet 4x8 ft, 1.2 mm", unit: "sheet", defaultRate: 4200 },
  { id: "demo_pr_sht20", code: "MS-SHT-20", name: "MS Sheet 4x8 ft, 2.0 mm", unit: "sheet", defaultRate: 6850 },
  { id: "demo_pr_pip2", code: "GI-PIP-2", name: "GI Pipe 2 inch, 6 m length", unit: "pcs", defaultRate: 3100 },
  { id: "demo_pr_pip1", code: "GI-PIP-1", name: "GI Pipe 1 inch, 6 m length", unit: "pcs", defaultRate: 1750 },
  { id: "demo_pr_ang2", code: "MS-ANG-2", name: "MS Angle 2x2 inch, 20 ft", unit: "pcs", defaultRate: 2450 },
  { id: "demo_pr_wld32", code: "WLD-ELE-32", name: "Welding Electrodes 3.2 mm", unit: "kg", defaultRate: 460 },
  { id: "demo_pr_vlv2", code: "VLV-BAL-2", name: "Ball Valve 2 inch, Brass", unit: "pcs", defaultRate: 5200 },
  { id: "demo_pr_brg", code: "BRG-6205", name: "Deep Groove Bearing 6205", unit: "pcs", defaultRate: 980 },
];

/** Rates are copied onto the line the way the app does it, not looked up later. */
const line = (productId, quantity, rate) => {
  const p = PRODUCTS.find((x) => x.id === productId);
  return { productId, description: p.name, unit: p.unit, quantity, rate };
};

const QUOTATIONS = [
  {
    id: "demo_qt_sams_1",
    companyId: "demo_co_sams",
    customerId: "demo_cu_alnoor",
    number: "0001",
    age: 21,
    status: "ACCEPTED",
    gstPercent: 18,
    cartage: 4500,
    poNumber: "10102682/2026",
    dcNumber: "DC-114",
    notes: "Delivery within 7 working days of confirmed order.",
    terms: "50% advance with order, balance before dispatch. Rates ex-warehouse Karachi.",
    items: [line("demo_pr_sht12", 40, 4200), line("demo_pr_pip2", 25, 3100), line("demo_pr_wld32", 50, 460)],
  },
  {
    id: "demo_qt_sams_2",
    companyId: "demo_co_sams",
    customerId: "demo_cu_meezan",
    number: "0002",
    age: 6,
    status: "SENT",
    gstPercent: 0,
    cartage: 0,
    poNumber: null,
    dcNumber: null,
    notes: null,
    terms: "Payment on delivery. Quotation valid for 30 days.",
    items: [line("demo_pr_ang2", 60, 2450), line("demo_pr_sht20", 12, 6850)],
  },
  {
    id: "demo_qt_ms_1",
    companyId: "demo_co_ms",
    customerId: "demo_cu_indus",
    number: "0001",
    age: 13,
    status: "SENT",
    gstPercent: 18,
    cartage: 6000,
    poNumber: "IFW/PO/2026/318",
    dcNumber: null,
    notes: "Sheets to be cut to size at no extra charge.",
    terms: "30 days credit against approved purchase order.",
    items: [line("demo_pr_sht20", 35, 6850), line("demo_pr_ang2", 80, 2450)],
  },
  {
    id: "demo_qt_biz_1",
    companyId: "demo_co_biz",
    customerId: "demo_cu_pakarab",
    number: "0001",
    age: 3,
    status: "DRAFT",
    gstPercent: 18,
    cartage: 0,
    poNumber: null,
    dcNumber: null,
    notes: null,
    terms: "Prices firm for 15 days.",
    items: [line("demo_pr_vlv2", 18, 5200), line("demo_pr_brg", 40, 980), line("demo_pr_pip1", 30, 1750)],
  },
  {
    id: "demo_qt_mbis_1",
    companyId: "demo_co_mbis",
    customerId: "demo_cu_sindh",
    number: "0001",
    age: 34,
    status: "REJECTED",
    gstPercent: 18,
    cartage: 2500,
    poNumber: null,
    dcNumber: null,
    notes: "Imported stock, subject to prior sale.",
    terms: "100% advance for imported items.",
    items: [line("demo_pr_brg", 120, 980), line("demo_pr_vlv2", 8, 5200)],
  },
  {
    id: "demo_qt_tsa_1",
    companyId: "demo_co_tsa",
    customerId: "demo_cu_meezan",
    number: "0001",
    age: 1,
    status: "SENT",
    gstPercent: 0,
    cartage: 1200,
    poNumber: null,
    dcNumber: null,
    notes: "Rates include delivery inside Karachi city limits.",
    terms: "Payment within 15 days of delivery.",
    items: [line("demo_pr_pip1", 45, 1750), line("demo_pr_wld32", 25, 460)],
  },
];

const round2 = (n) => Math.round(n * 100) / 100;
const daysFromNow = (n) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

const columns = (row) => Object.keys(row);
const values = (row) => columns(row).map((c) => row[c]);
const quoted = (row) => columns(row).map((c) => `"${c}"`).join(", ");
const holes = (row) => columns(row).map((_, i) => `$${i + 1}`).join(", ");

/** Rewrites the row every run, so editing this file is enough to correct it.
    Only for rows this file owns outright — the fixed `demo_` ids.
    `updatedAt` is filled by the Prisma client, not the database, so plain SQL
    has to supply it. */
async function upsert(db, table, row) {
  const set = columns(row).filter((c) => c !== "id").map((c) => `"${c}" = EXCLUDED."${c}"`);
  await db.query(
    `INSERT INTO "${table}" (${quoted(row)}, "updatedAt") VALUES (${holes(row)}, now())
     ON CONFLICT (id) DO UPDATE SET ${[...set, `"updatedAt" = now()`].join(", ")}`,
    values(row),
  );
}

/** For rows that may already have been typed into the app: an existing one is
    left exactly as it is and its own id comes back, so demo quotations attach to
    the real company rather than a duplicate of it. Nothing here overwrites work. */
async function insertIfNew(db, table, row, key) {
  const inserted = await db.query(
    `INSERT INTO "${table}" (${quoted(row)}, "updatedAt") VALUES (${holes(row)}, now())
     ON CONFLICT ("${key}") DO NOTHING RETURNING id`,
    values(row),
  );
  if (inserted.rows.length > 0) return inserted.rows[0].id;
  const existing = await db.query(`SELECT id FROM "${table}" WHERE "${key}" = $1`, [row[key]]);
  return existing.rows[0].id;
}

const db = new Client({ connectionString: process.env.DATABASE_URL });
await db.connect();

// Demo id -> the id actually in the database, which is the company's own if it
// was already there. Quotations below are attached through these.
const realCompanyId = {};
const realProductId = {};
for (const c of COMPANIES) realCompanyId[c.id] = await insertIfNew(db, "Company", c, "code");
for (const p of PRODUCTS) realProductId[p.id] = await insertIfNew(db, "Product", p, "code");
for (const c of CUSTOMERS) await upsert(db, "Customer", c);

for (const q of QUOTATIONS) {
  const items = q.items.map((it) => ({ ...it, amount: round2(it.quantity * it.rate) }));
  const subtotal = round2(items.reduce((s, it) => s + it.amount, 0));
  const gstAmount = round2((subtotal * q.gstPercent) / 100);

  await upsert(db, "Quotation", {
    id: q.id,
    number: q.number,
    companyId: realCompanyId[q.companyId],
    customerId: q.customerId,
    date: daysFromNow(-q.age),
    validUntil: daysFromNow(30 - q.age),
    status: q.status,
    poNumber: q.poNumber,
    dcNumber: q.dcNumber,
    notes: q.notes,
    terms: q.terms,
    subtotal,
    gstPercent: q.gstPercent,
    gstAmount,
    cartage: q.cartage,
    total: round2(subtotal + gstAmount + q.cartage),
  });

  // Rewritten rather than upserted: a line removed from this file must also
  // disappear from the database, and lines have no natural key to match on.
  await db.query(`DELETE FROM "QuotationItem" WHERE "quotationId" = $1`, [q.id]);
  for (const [i, it] of items.entries()) {
    await db.query(
      `INSERT INTO "QuotationItem" (id, "quotationId", "productId", description, unit, quantity, rate, amount, "sortOrder")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [`${q.id}_i${i}`, q.id, realProductId[it.productId], it.description, it.unit, it.quantity, it.rate, it.amount, i],
    );
  }
}

console.log(
  `Seeded ${COMPANIES.length} companies, ${CUSTOMERS.length} customers, ${PRODUCTS.length} products, ${QUOTATIONS.length} quotations.`,
);
await db.end();
