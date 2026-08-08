// Demo data for a local database. Run it with `npx prisma db seed`.
//
// Invented and safe to wipe. Every row has a fixed `demo_` id written with ON
// CONFLICT DO UPDATE, so running it twice changes nothing and editing this file
// brings the database back in line.
//
// Uses `pg` rather than the Prisma client because the client is generated as
// TypeScript into /generated, which a plain node script cannot import.
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
  {
    id: "demo_cu_zam",
    name: "Zamzam Textile Mills (Pvt) Ltd",
    contactPerson: "Mr. Adnan Yusuf",
    address: "Plot 5-B, Landhi Industrial Area, Karachi",
    phone: "021-35082211",
    email: "purchase@zamzamtextile.demo",
    ntn: "5566778-2",
    gstNumber: "17-00-8888-103-30",
  },
  {
    id: "demo_cu_hilal",
    name: "Hilal Engineering Works",
    contactPerson: "Mr. Bilal Ahmed",
    address: "Workshop 22, Shershah, Karachi",
    phone: "0321-2299001",
    email: "hilal.works@demo.pk",
    ntn: "6677889-3",
    gstNumber: null,
  },
  {
    id: "demo_cu_rehman",
    name: "Rehman Brothers Hardware",
    contactPerson: "Haji Abdul Rehman",
    address: "Shop 41, Jodia Bazar, Karachi",
    phone: "021-32412299",
    email: "rehmanbros@demo.pk",
    ntn: null,
    gstNumber: null,
  },
  {
    id: "demo_cu_kpsc",
    name: "Karachi Port Services Co.",
    contactPerson: "Assistant Manager (Stores)",
    address: "Berth 14, West Wharf, Karachi",
    phone: "021-32001144",
    email: "stores@kpsc.demo",
    ntn: "7788990-4",
    gstNumber: "17-00-8888-104-40",
  },
  {
    id: "demo_cu_shah",
    name: "Shah Latif Builders",
    contactPerson: "Mr. Imran Shah",
    address: "Office 7, Gulshan-e-Iqbal Block 13, Karachi",
    phone: "0333-4455112",
    email: "projects@shahlatif.demo",
    ntn: null,
    gstNumber: null,
  },
  {
    id: "demo_cu_united",
    name: "United Chemicals (Pvt) Ltd",
    contactPerson: "Mr. Salman Vohra",
    address: "Plot 66, Eastern Industrial Zone, Port Qasim, Karachi",
    phone: "021-34720033",
    email: "supply@unitedchem.demo",
    ntn: "8899001-5",
    gstNumber: "17-00-8888-105-50",
  },
  {
    id: "demo_cu_noorani",
    name: "Noorani Cold Storage",
    contactPerson: "Mr. Tahir Noorani",
    address: "Near Nazimabad No. 4, Karachi",
    phone: "021-36610077",
    email: "noorani.cold@demo.pk",
    ntn: null,
    gstNumber: null,
  },
  {
    id: "demo_cu_gulf",
    name: "Gulf Marine Services",
    contactPerson: "Captain R. Hussain",
    address: "Office 3, Fish Harbour Road, Karachi",
    phone: "021-32319988",
    email: "ops@gulfmarine.demo",
    ntn: "9900112-6",
    gstNumber: null,
  },
  {
    id: "demo_cu_falcon",
    name: "Falcon Packaging Industries",
    contactPerson: "Ms. Sana Iqbal",
    address: "Plot 120, F.B. Industrial Area, Karachi",
    phone: "021-36340055",
    email: "sana@falconpack.demo",
    ntn: "1011223-7",
    gstNumber: "17-00-8888-106-60",
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
  { id: "demo_pr_flg4", code: "FLG-MS-4", name: "MS Flange 4 inch, 150 lb", unit: "pcs", defaultRate: 3400 },
  { id: "demo_pr_blt16", code: "BLT-HT-16", name: "HT Bolt M16 x 75 mm with nut", unit: "pcs", defaultRate: 145 },
  { id: "demo_pr_gsk4", code: "GSK-CAF-4", name: "CAF Gasket 4 inch", unit: "pcs", defaultRate: 320 },
  { id: "demo_pr_pnt", code: "PNT-ENM-4", name: "Enamel Paint, 4 litre tin", unit: "tin", defaultRate: 2850 },
  { id: "demo_pr_glv", code: "SFT-GLV-L", name: "Leather Safety Gloves", unit: "pair", defaultRate: 380 },
  { id: "demo_pr_mtr5", code: "MTR-5HP", name: "Electric Motor 5 HP, 1440 RPM", unit: "pcs", defaultRate: 48500 },
];

/** Rates are copied onto the line the way the app does it, not looked up later. */
const line = (productId, quantity, rate) => {
  const p = PRODUCTS.find((x) => x.id === productId);
  return { productId, description: p.name, unit: p.unit, quantity, rate };
};

/* Numbers run per company and in order, exactly as the app allocates them. */
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
    id: "demo_qt_sams_3",
    companyId: "demo_co_sams",
    customerId: "demo_cu_zam",
    number: "0003",
    age: 30,
    status: "ACCEPTED",
    gstPercent: 18,
    cartage: 3000,
    poNumber: "ZTM/PO/26/0771",
    dcNumber: null,
    notes: "Mill store delivery, gate pass to be arranged by buyer.",
    terms: "30 days credit against approved purchase order.",
    items: [line("demo_pr_mtr5", 2, 48500), line("demo_pr_brg", 30, 980), line("demo_pr_blt16", 200, 145)],
  },
  {
    id: "demo_qt_sams_4",
    companyId: "demo_co_sams",
    customerId: "demo_cu_rehman",
    number: "0004",
    age: 14,
    status: "ACCEPTED",
    gstPercent: 0,
    cartage: 1500,
    poNumber: null,
    dcNumber: null,
    notes: "Counter sale, goods to be collected from Serai Road godown.",
    terms: "Cash on collection.",
    items: [line("demo_pr_pip1", 60, 1750), line("demo_pr_glv", 40, 380)],
  },
  {
    id: "demo_qt_sams_5",
    companyId: "demo_co_sams",
    customerId: "demo_cu_gulf",
    number: "0005",
    age: 4,
    status: "DRAFT",
    gstPercent: 18,
    cartage: 0,
    poNumber: null,
    dcNumber: null,
    notes: null,
    terms: "Rates firm for 15 days from date of quotation.",
    items: [line("demo_pr_vlv2", 12, 5200), line("demo_pr_gsk4", 60, 320)],
  },
  {
    id: "demo_qt_sams_6",
    companyId: "demo_co_sams",
    customerId: "demo_cu_falcon",
    number: "0006",
    age: 52,
    status: "EXPIRED",
    gstPercent: 18,
    cartage: 2000,
    poNumber: null,
    dcNumber: null,
    notes: "Quoted against enquiry received last month.",
    terms: "Quotation valid for 30 days.",
    items: [line("demo_pr_sht12", 25, 4200), line("demo_pr_pnt", 18, 2850)],
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
    id: "demo_qt_biz_2",
    companyId: "demo_co_biz",
    customerId: "demo_cu_hilal",
    number: "0002",
    age: 27,
    status: "ACCEPTED",
    gstPercent: 18,
    cartage: 2500,
    poNumber: "HEW-2026-88",
    dcNumber: "DC-201",
    notes: "Safety items required before shutdown work begins.",
    terms: "Payment within 15 days of delivery.",
    items: [line("demo_pr_glv", 120, 380), line("demo_pr_wld32", 80, 460)],
  },
  {
    id: "demo_qt_biz_3",
    companyId: "demo_co_biz",
    customerId: "demo_cu_united",
    number: "0003",
    age: 11,
    status: "SENT",
    gstPercent: 18,
    cartage: 0,
    poNumber: null,
    dcNumber: null,
    notes: "Sample of gasket material can be provided on request.",
    terms: "Rates ex-warehouse. GST extra as applicable.",
    items: [line("demo_pr_gsk4", 150, 320), line("demo_pr_flg4", 40, 3400)],
  },
  {
    id: "demo_qt_biz_4",
    companyId: "demo_co_biz",
    customerId: "demo_cu_kpsc",
    number: "0004",
    age: 19,
    status: "ACCEPTED",
    gstPercent: 18,
    cartage: 5000,
    poNumber: "KPSC/STR/2026/451",
    dcNumber: null,
    notes: "Delivery at West Wharf stores, entry permit required.",
    terms: "30 days credit against approved purchase order.",
    items: [line("demo_pr_pip2", 60, 3100), line("demo_pr_blt16", 500, 145), line("demo_pr_pnt", 24, 2850)],
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
    id: "demo_qt_ms_2",
    companyId: "demo_co_ms",
    customerId: "demo_cu_shah",
    number: "0002",
    age: 24,
    status: "ACCEPTED",
    gstPercent: 18,
    cartage: 7500,
    poNumber: "SLB/26/A-19",
    dcNumber: "DC-330",
    notes: "Site delivery at Gulshan Block 13, unloading by buyer.",
    terms: "50% advance with order, balance before dispatch.",
    items: [line("demo_pr_sht12", 90, 4200), line("demo_pr_ang2", 120, 2450), line("demo_pr_wld32", 60, 460)],
  },
  {
    id: "demo_qt_ms_3",
    companyId: "demo_co_ms",
    customerId: "demo_cu_sindh",
    number: "0003",
    age: 8,
    status: "SENT",
    gstPercent: 0,
    cartage: 0,
    poNumber: null,
    dcNumber: null,
    notes: null,
    terms: "Ex-godown Shershah. Quotation valid for 30 days.",
    items: [line("demo_pr_pip2", 45, 3100)],
  },
  {
    id: "demo_qt_ms_4",
    companyId: "demo_co_ms",
    customerId: "demo_cu_indus",
    number: "0004",
    age: 32,
    status: "ACCEPTED",
    gstPercent: 18,
    cartage: 4000,
    poNumber: "IFW/PO/2026/276",
    dcNumber: "DC-318",
    notes: "Repeat order at previously agreed rates.",
    terms: "30 days credit against approved purchase order.",
    items: [line("demo_pr_sht20", 20, 6850), line("demo_pr_flg4", 55, 3400)],
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
  {
    id: "demo_qt_tsa_2",
    companyId: "demo_co_tsa",
    customerId: "demo_cu_noorani",
    number: "0002",
    age: 22,
    status: "ACCEPTED",
    gstPercent: 0,
    cartage: 800,
    poNumber: null,
    dcNumber: "DC-77",
    notes: "Delivery to Nazimabad godown before noon.",
    terms: "Cash on delivery.",
    items: [line("demo_pr_glv", 60, 380), line("demo_pr_pnt", 10, 2850)],
  },
  {
    id: "demo_qt_tsa_3",
    companyId: "demo_co_tsa",
    customerId: "demo_cu_shah",
    number: "0003",
    age: 9,
    status: "ACCEPTED",
    gstPercent: 0,
    cartage: 0,
    poNumber: null,
    dcNumber: null,
    notes: "Awaiting site instruction before dispatch.",
    terms: "Payment on delivery.",
    items: [line("demo_pr_blt16", 400, 145), line("demo_pr_gsk4", 80, 320)],
  },

  {
    id: "demo_qt_ame_1",
    companyId: "demo_co_ame",
    customerId: "demo_cu_gulf",
    number: "0001",
    age: 17,
    status: "ACCEPTED",
    gstPercent: 18,
    cartage: 1800,
    poNumber: "GMS/PO/26/112",
    dcNumber: null,
    notes: "Imported stock, ex-Karachi.",
    terms: "100% advance for imported items.",
    items: [line("demo_pr_vlv2", 24, 5200), line("demo_pr_brg", 60, 980)],
  },
  {
    id: "demo_qt_ame_2",
    companyId: "demo_co_ame",
    customerId: "demo_cu_falcon",
    number: "0002",
    age: 5,
    status: "SENT",
    gstPercent: 18,
    cartage: 0,
    poNumber: null,
    dcNumber: null,
    notes: null,
    terms: "Rates subject to prior sale. Valid 15 days.",
    items: [line("demo_pr_mtr5", 1, 48500), line("demo_pr_blt16", 150, 145)],
  },
  {
    id: "demo_qt_ame_3",
    companyId: "demo_co_ame",
    customerId: "demo_cu_rehman",
    number: "0003",
    age: 29,
    status: "ACCEPTED",
    gstPercent: 18,
    cartage: 2200,
    poNumber: null,
    dcNumber: "DC-95",
    notes: "Bulk order for bazaar stock.",
    terms: "Payment within 15 days of delivery.",
    items: [line("demo_pr_gsk4", 200, 320), line("demo_pr_glv", 150, 380), line("demo_pr_blt16", 600, 145)],
  },

  {
    id: "demo_qt_abt_1",
    companyId: "demo_co_abt",
    customerId: "demo_cu_united",
    number: "0001",
    age: 12,
    status: "ACCEPTED",
    gstPercent: 18,
    cartage: 3500,
    poNumber: "UC/PQ/2026/604",
    dcNumber: null,
    notes: "Delivery at Port Qasim plant, safety induction required.",
    terms: "30 days credit against approved purchase order.",
    items: [line("demo_pr_flg4", 70, 3400), line("demo_pr_gsk4", 140, 320), line("demo_pr_blt16", 700, 145)],
  },
  {
    id: "demo_qt_abt_2",
    companyId: "demo_co_abt",
    customerId: "demo_cu_zam",
    number: "0002",
    age: 2,
    status: "SENT",
    gstPercent: 18,
    cartage: 0,
    poNumber: null,
    dcNumber: null,
    notes: null,
    terms: "Prices firm for 15 days.",
    items: [line("demo_pr_pnt", 40, 2850), line("demo_pr_glv", 80, 380)],
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
    id: "demo_qt_mbis_2",
    companyId: "demo_co_mbis",
    customerId: "demo_cu_hilal",
    number: "0002",
    age: 7,
    status: "ACCEPTED",
    gstPercent: 18,
    cartage: 0,
    poNumber: "HEW-2026-91",
    dcNumber: null,
    notes: "Motor to be tested at workshop before dispatch.",
    terms: "50% advance with order, balance before dispatch.",
    items: [line("demo_pr_mtr5", 3, 48500), line("demo_pr_brg", 24, 980)],
  },
];

/*
 * `from` names the accepted quotation whose lines this bill copies; `from: null`
 * is a bill typed from scratch. A charge is a percentage (`percent`) or a flat
 * figure (`amount`).
 *
 * Not every accepted quotation is billed — the ones left over are what the
 * "Ready to bill" queue shows, so a few are deliberately absent.
 */
const BILLS = [
  {
    id: "demo_bl_sams_1",
    companyId: "demo_co_sams",
    customerId: "demo_cu_alnoor",
    from: "demo_qt_sams_1",
    number: "0001",
    age: 16,
    status: "PAID",
    poNumber: "10102682/2026",
    dcNumber: "DC-114",
    notes: null,
    terms: "50% advance with order, balance before dispatch.",
    charges: [
      { label: "GST", percent: 18 },
      { label: "Cartage", amount: 4500 },
    ],
  },
  {
    id: "demo_bl_sams_2",
    companyId: "demo_co_sams",
    customerId: "demo_cu_zam",
    from: "demo_qt_sams_3",
    number: "0002",
    age: 25,
    status: "ISSUED",
    poNumber: "ZTM/PO/26/0771",
    dcNumber: "DC-121",
    notes: "Delivered to mill store against gate pass 4471.",
    terms: "30 days credit against approved purchase order.",
    charges: [
      { label: "GST", percent: 18 },
      { label: "Cartage", amount: 3000 },
    ],
  },
  {
    id: "demo_bl_sams_3",
    companyId: "demo_co_sams",
    customerId: "demo_cu_meezan",
    from: null,
    number: "0003",
    age: 2,
    status: "DRAFT",
    poNumber: null,
    dcNumber: null,
    notes: "Counter sale, no quotation raised.",
    terms: "Cash on collection.",
    items: [line("demo_pr_wld32", 30, 460), line("demo_pr_glv", 20, 380)],
    charges: [{ label: "Cartage", amount: 900 }],
  },

  {
    id: "demo_bl_biz_1",
    companyId: "demo_co_biz",
    customerId: "demo_cu_hilal",
    from: "demo_qt_biz_2",
    number: "0001",
    age: 23,
    status: "PAID",
    poNumber: "HEW-2026-88",
    dcNumber: "DC-201",
    notes: null,
    terms: "Payment within 15 days of delivery.",
    charges: [
      { label: "GST", percent: 18 },
      { label: "Cartage", amount: 2500 },
    ],
  },
  {
    id: "demo_bl_biz_2",
    companyId: "demo_co_biz",
    customerId: "demo_cu_kpsc",
    from: "demo_qt_biz_4",
    number: "0002",
    age: 15,
    status: "ISSUED",
    poNumber: "KPSC/STR/2026/451",
    dcNumber: "DC-207",
    notes: "Delivered at West Wharf stores.",
    terms: "30 days credit against approved purchase order.",
    charges: [
      { label: "GST", percent: 18 },
      { label: "Cartage", amount: 5000 },
      { label: "Labour", amount: 1500 },
    ],
  },

  {
    id: "demo_bl_ms_1",
    companyId: "demo_co_ms",
    customerId: "demo_cu_shah",
    from: "demo_qt_ms_2",
    number: "0001",
    age: 20,
    status: "ISSUED",
    poNumber: "SLB/26/A-19",
    dcNumber: "DC-330",
    notes: "Unloading at site by buyer.",
    terms: "50% advance with order, balance before dispatch.",
    charges: [
      { label: "GST", percent: 18 },
      { label: "Cartage", amount: 7500 },
    ],
  },
  {
    id: "demo_bl_ms_2",
    companyId: "demo_co_ms",
    customerId: "demo_cu_indus",
    from: "demo_qt_ms_4",
    number: "0002",
    age: 28,
    status: "PAID",
    poNumber: "IFW/PO/2026/276",
    dcNumber: "DC-318",
    notes: null,
    terms: "30 days credit against approved purchase order.",
    charges: [
      { label: "GST", percent: 18 },
      { label: "Cartage", amount: 4000 },
      // A discount is a charge with a minus in front of it — which is the whole
      // reason charges are their own table and not two fixed columns.
      { label: "Discount", amount: -2500 },
    ],
  },

  {
    id: "demo_bl_tsa_1",
    companyId: "demo_co_tsa",
    customerId: "demo_cu_noorani",
    from: "demo_qt_tsa_2",
    number: "0001",
    age: 19,
    status: "PAID",
    poNumber: null,
    dcNumber: "DC-77",
    notes: "Delivered before noon as requested.",
    terms: "Cash on delivery.",
    charges: [{ label: "Cartage", amount: 800 }],
  },

  {
    id: "demo_bl_ame_1",
    companyId: "demo_co_ame",
    customerId: "demo_cu_gulf",
    from: "demo_qt_ame_1",
    number: "0001",
    age: 13,
    status: "ISSUED",
    poNumber: "GMS/PO/26/112",
    dcNumber: null,
    notes: null,
    terms: "100% advance for imported items.",
    charges: [
      { label: "GST", percent: 18 },
      { label: "Cartage", amount: 1800 },
    ],
  },
  {
    id: "demo_bl_ame_2",
    companyId: "demo_co_ame",
    customerId: "demo_cu_rehman",
    from: "demo_qt_ame_3",
    number: "0002",
    age: 26,
    status: "CANCELLED",
    poNumber: null,
    dcNumber: "DC-95",
    notes: "Cancelled at customer's request; goods returned to stock.",
    terms: "Payment within 15 days of delivery.",
    charges: [
      { label: "GST", percent: 18 },
      { label: "Cartage", amount: 2200 },
    ],
  },

  {
    id: "demo_bl_abt_1",
    companyId: "demo_co_abt",
    customerId: "demo_cu_united",
    from: "demo_qt_abt_1",
    number: "0001",
    age: 8,
    status: "ISSUED",
    poNumber: "UC/PQ/2026/604",
    dcNumber: "DC-412",
    notes: "Delivered at Port Qasim plant.",
    terms: "30 days credit against approved purchase order.",
    charges: [
      { label: "GST", percent: 18 },
      { label: "Cartage", amount: 3500 },
    ],
  },
  {
    id: "demo_bl_abt_2",
    companyId: "demo_co_abt",
    customerId: "demo_cu_falcon",
    from: null,
    number: "0002",
    age: 1,
    status: "DRAFT",
    poNumber: null,
    dcNumber: null,
    notes: "Typed from a telephone order; no quotation was raised.",
    terms: "Payment within 15 days of delivery.",
    items: [line("demo_pr_pnt", 12, 2850), line("demo_pr_gsk4", 40, 320)],
    charges: [{ label: "GST", percent: 18 }],
  },
];

const round2 = (n) => Math.round(n * 100) / 100;
const daysFromNow = (n) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

/** Lines priced the way the app prices them. */
const priced = (items) => items.map((it) => ({ ...it, amount: round2(it.quantity * it.rate) }));
const sum = (rows) => round2(rows.reduce((total, r) => total + r.amount, 0));

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
// was already there. Quotations and bills below attach through these.
const realCompanyId = {};
const realProductId = {};
for (const c of COMPANIES) realCompanyId[c.id] = await insertIfNew(db, "Company", c, "code");
for (const p of PRODUCTS) realProductId[p.id] = await insertIfNew(db, "Product", p, "code");
for (const c of CUSTOMERS) await upsert(db, "Customer", c);

/**
 * The number this demo row can actually have. Anything typed into the app has
 * already claimed a number and keeps it: this keeps the row's own number if it
 * has one, takes the preferred one if free, and otherwise slides past.
 *
 * ponytail: linear scan from `preferred`. Fine for a few dozen demo rows.
 */
async function freeNumber(table, companyId, rowId, preferred) {
  const mine = await db.query(`SELECT number FROM "${table}" WHERE id = $1`, [rowId]);
  if (mine.rows.length > 0) return mine.rows[0].number;

  const { rows } = await db.query(`SELECT number FROM "${table}" WHERE "companyId" = $1`, [companyId]);
  const taken = new Set(rows.map((r) => r.number));
  for (let n = Number(preferred); n < 10000; n++) {
    const candidate = String(n).padStart(4, "0");
    if (!taken.has(candidate)) return candidate;
  }
  throw new Error(`No free number left for ${table} of company ${companyId}.`);
}

/** Rewritten rather than upserted: a line removed from this file must also
    disappear, and a line has no natural key to match on. */
async function rewriteLines(table, foreignKey, ownerId, items) {
  await db.query(`DELETE FROM "${table}" WHERE "${foreignKey}" = $1`, [ownerId]);
  for (const [i, it] of items.entries()) {
    await db.query(
      `INSERT INTO "${table}" (id, "${foreignKey}", "productId", description, unit, quantity, rate, amount, "sortOrder")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        `${ownerId}_i${i}`,
        ownerId,
        realProductId[it.productId],
        it.description,
        it.unit,
        it.quantity,
        it.rate,
        it.amount,
        i,
      ],
    );
  }
}

for (const q of QUOTATIONS) {
  const items = priced(q.items);
  const subtotal = sum(items);
  const gstAmount = round2((subtotal * q.gstPercent) / 100);
  const companyId = realCompanyId[q.companyId];

  await upsert(db, "Quotation", {
    id: q.id,
    number: await freeNumber("Quotation", companyId, q.id, q.number),
    companyId,
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

  await rewriteLines("QuotationItem", "quotationId", q.id, items);
}

for (const b of BILLS) {
  // Copied in full, as the app does it — never a live link.
  const source = b.from ? QUOTATIONS.find((q) => q.id === b.from) : null;
  const items = priced(b.items ?? source.items);
  const subtotal = sum(items);

  // Resolved exactly as bill-actions.ts resolves it.
  const charges = b.charges.map((c, i) => ({
    label: c.label,
    percent: c.percent ?? null,
    amount: c.percent == null ? round2(c.amount) : round2((subtotal * c.percent) / 100),
    sortOrder: i,
  }));
  const chargesTotal = sum(charges);

  const companyId = realCompanyId[b.companyId];

  await upsert(db, "Bill", {
    id: b.id,
    number: await freeNumber("Bill", companyId, b.id, b.number),
    companyId,
    customerId: b.customerId,
    quotationId: b.from,
    date: daysFromNow(-b.age),
    dueDate: daysFromNow(30 - b.age),
    status: b.status,
    poNumber: b.poNumber,
    dcNumber: b.dcNumber,
    notes: b.notes,
    terms: b.terms,
    subtotal,
    chargesTotal,
    total: round2(subtotal + chargesTotal),
  });

  await rewriteLines("BillItem", "billId", b.id, items);

  await db.query(`DELETE FROM "BillCharge" WHERE "billId" = $1`, [b.id]);
  for (const c of charges) {
    await db.query(
      `INSERT INTO "BillCharge" (id, "billId", label, percent, amount, "sortOrder") VALUES ($1, $2, $3, $4, $5, $6)`,
      [`${b.id}_c${c.sortOrder}`, b.id, c.label, c.percent, c.amount, c.sortOrder],
    );
  }
}

console.log(
  `Seeded ${COMPANIES.length} companies, ${CUSTOMERS.length} customers, ${PRODUCTS.length} products, ` +
    `${QUOTATIONS.length} quotations, ${BILLS.length} bills.`,
);
await db.end();
