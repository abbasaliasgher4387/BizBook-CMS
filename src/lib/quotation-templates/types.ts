// One plain-JSON shape that every quotation design receives. Prisma's Decimal
// and Date objects are converted once, in toDoc(), so the template components
// never have to think about the database.

export type QuotationDoc = {
  number: string;
  date: Date;
  validUntil: Date | null;
  status: string;
  poNumber: string | null;
  dcNumber: string | null;
  notes: string | null;
  terms: string | null;
  subtotal: number;
  gstPercent: number;
  gstAmount: number;
  cartage: number;
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

export type TemplateProps = { doc: QuotationDoc };

/** Used by the design gallery and the company form's template preview. */
export const SAMPLE_DOC: QuotationDoc = {
  number: "0001",
  date: new Date("2026-08-06T00:00:00.000Z"),
  validUntil: new Date("2026-09-05T00:00:00.000Z"),
  status: "SENT",
  poNumber: "10102682/2026",
  dcNumber: "DC-114",
  notes: "Delivery within 7 working days of confirmed order.",
  terms: "50% advance with order, balance before dispatch. Rates ex-warehouse Karachi.",
  subtotal: 268500,
  gstPercent: 18,
  gstAmount: 48330,
  cartage: 4500,
  total: 321330,
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
