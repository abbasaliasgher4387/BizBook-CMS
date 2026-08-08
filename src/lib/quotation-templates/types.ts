// One plain-JSON shape that every design receives.
//
// A quotation and a bill are the same sheet: same letterhead, same columns, same
// signature block. Only three things differ — the title, the labels beside the
// reference and the date, and whether anything is added under the line total. So
// there is one doc type with a `kind`, not two parallel sets of designs to keep
// in step with each other.
//
// Prisma's Decimal and Date objects are converted once, by the page that loads
// the record, so template components never have to think about the database.

export type DocKind = "QUOTATION" | "BILL";

/** Cartage, GST, labour — or a negative amount for a discount. Bills only. */
export type Charge = { label: string; amount: number };

export type SheetDoc = {
  kind: DocKind;
  number: string;
  date: Date;
  /** Valid-until on a quotation, due date on a bill. Null prints an em dash. */
  until: Date | null;
  status: string;
  poNumber: string | null;
  dcNumber: string | null;
  notes: string | null;
  terms: string | null;
  subtotal: number;
  /** Always empty on a quotation — a quotation is its lines and nothing else. */
  charges: Charge[];
  total: number;
  company: {
    name: string;
    code: string;
    tagline: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
    ntn: string | null;
    strn: string | null;
    gstNumber: string | null;
    logoUrl: string | null;
  };
  customer: {
    name: string;
    contactPerson: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
    ntn: string | null;
    gstNumber: string | null;
  };
  items: {
    description: string;
    unit: string;
    quantity: number;
    rate: number;
    amount: number;
  }[];
};

export type TemplateProps = { doc: SheetDoc };

const SUBTOTAL = 268500;
const GST = 48330; // 18% of the above
const CARTAGE = 4500;

/** Used by the design gallery and the company form's template preview. A bill
    carries the charges block; a quotation shows the same lines without it. */
export function sampleDoc(kind: DocKind = "QUOTATION"): SheetDoc {
  const bill = kind === "BILL";

  return {
    kind,
    number: "0001",
    date: new Date("2026-08-06T00:00:00.000Z"),
    until: new Date("2026-09-05T00:00:00.000Z"),
    status: bill ? "ISSUED" : "SENT",
    poNumber: "10102682/2026",
    dcNumber: "DC-114",
    notes: "Delivery within 7 working days of confirmed order.",
    terms: "50% advance with order, balance before dispatch. Rates ex-warehouse Karachi.",
    subtotal: SUBTOTAL,
    charges: bill
      ? [
          { label: "GST 18%", amount: GST },
          { label: "Cartage", amount: CARTAGE },
        ]
      : [],
    total: bill ? SUBTOTAL + GST + CARTAGE : SUBTOTAL,
    company: {
      name: "Sample Company",
      code: "SC",
      tagline: "Importers, Stockist & General Order Suppliers",
      address: "Shop No.1, Serai Road, M.A. Jinnah Road, Karachi, Pakistan",
      phone: "0300-1234567",
      email: "sales@example.com",
      ntn: "0000000-0",
      strn: null,
      gstNumber: null,
      logoUrl: null,
    },
    customer: {
      name: "Al Noor Petroleum (Pvt) Ltd",
      contactPerson: "Purchase Manager",
      address: "Office 4, Korangi Industrial Area, Karachi",
      phone: "021-35123456",
      email: "purchase@example.com",
      ntn: "1234567-8",
      gstNumber: null,
    },
    items: [
      { description: "MS Sheet 4x8 ft, 1.2 mm", unit: "sheet", quantity: 40, rate: 4200, amount: 168000 },
      { description: "GI Pipe 2 inch, 6 m length", unit: "pcs", quantity: 25, rate: 3100, amount: 77500 },
      { description: "Welding Electrodes 3.2 mm", unit: "kg", quantity: 50, rate: 460, amount: 23000 },
    ],
  };
}
