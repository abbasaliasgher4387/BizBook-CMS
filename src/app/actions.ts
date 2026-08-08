"use server";

// Every function here is a trust boundary. A "use server" export is a POST
// endpoint with a public address: the sign-in guard in (app)/layout.tsx decides
// what *renders*, and decides nothing about what a request may *call*. The proxy
// only checks that some cookie is present, which any stranger can arrange. So
// each one starts by asking who is calling.
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { num, parseInputDate, req, round2, text } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { DEFAULT_TEMPLATE, TEMPLATE_KEYS, type TemplateKey } from "@/lib/quotation-templates";
import type { QuotationStatus } from "../../generated/prisma/enums";

/** A design the app actually has. An unknown key prints as the default anyway,
    so storing one only ever leaves a row that lies about itself. */
function readTemplateKey(fd: FormData): TemplateKey {
  const key = String(fd.get("templateKey") ?? "");
  return (TEMPLATE_KEYS as string[]).includes(key) ? (key as TemplateKey) : DEFAULT_TEMPLATE;
}

/**
 * A logo is a file dropped into /public, so the only valid value is a path
 * beginning with one slash. Left as free text it is an off-site URL that every
 * letterhead goes and fetches — including the one a headless browser renders on
 * the server while holding somebody's session.
 */
function readLogoUrl(fd: FormData): string | null {
  const url = text(fd.get("logoUrl"));
  if (url === null) return null;
  if (!/^\/[^/\\]/.test(url)) {
    throw new Error('The logo must be a file in the app, written as a path — for example "/logos/sams.png".');
  }
  return url;
}

/* ---------------------------------------------------------------- companies */

export async function saveCompany(formData: FormData) {
  await requireUser();
  const id = text(formData.get("id"));
  const data = {
    name: req(formData, "name", "Company name"),
    code: req(formData, "code", "Company code").toUpperCase(),
    tagline: text(formData.get("tagline")),
    address: text(formData.get("address")),
    phone: text(formData.get("phone")),
    email: text(formData.get("email")),
    ntn: text(formData.get("ntn")),
    strn: text(formData.get("strn")),
    gstNumber: text(formData.get("gstNumber")),
    logoUrl: readLogoUrl(formData),
    templateKey: readTemplateKey(formData),
    // 0 means the company charges none and the bill form offers no GST row.
    defaultGstPercent: round2(num(formData.get("defaultGstPercent"))),
  };

  if (id) await prisma.company.update({ where: { id }, data });
  else await prisma.company.create({ data });

  revalidatePath("/companies");
  revalidatePath("/quotations");
  revalidatePath("/bills");
}

export async function deleteCompany(formData: FormData) {
  await requireUser();
  const id = req(formData, "id", "Company");
  // Both: a company can carry bills without quotations, and the foreign key
  // would refuse either.
  const [quotations, bills] = await Promise.all([
    prisma.quotation.count({ where: { companyId: id } }),
    prisma.bill.count({ where: { companyId: id } }),
  ]);
  if (quotations > 0 || bills > 0) {
    throw new Error(
      `This company cannot be deleted — ${quotations} quotation(s) and ${bills} bill(s) already use it.`,
    );
  }
  await prisma.company.delete({ where: { id } });
  revalidatePath("/companies");
}

/**
 * The client's companies, typed up from the letterheads they supplied. Only
 * companies with a real letterhead belong here: without the printed sheet there
 * is nothing to copy the design from. Safe to run twice.
 */
export async function seedCompanies() {
  await requireUser();
  await prisma.company.createMany({
    skipDuplicates: true,
    data: [
      {
        name: "SAMS Traders",
        code: "SAMS",
        templateKey: "sams",
        tagline:
          "Importers, Wholesalers & Stockist\nUPVC SCH 40/80, CPVC & PPRC Fittings, Valves\nIndustrial Materials & General Order Suppliers",
        address: "Office No.122, 1st Floor, Suleman Trade Centre, Serai Road, M.A. Jinnah Road, Karachi, Pakistan",
        phone: "0313-2483947",
        email: "sams.traders053@gmail.com",
        ntn: "7167359-2",
        gstNumber: "3277876120326",
      },
      {
        name: "Bizway Enterprise",
        code: "BIZ",
        templateKey: "bizway",
        tagline:
          "Deals in all kind of Hardware Items, UPVC/CPVC SCH 40/80, Pipes & Fitting, Safety Equipments, Industrial Hoses, Pneumatic Equipments, Machine and Cutting Tools, Electrical Items & General Order Suppliers",
        address: "Plot No.25, Gr-3, S-30, Shahrah-e-Liaquat, Karachi",
        phone: "0321-2483949",
        email: "bizwayenterprise@gmail.com",
        ntn: "3825874-9",
      },
      {
        name: "Mistry Steel",
        code: "MS",
        templateKey: "mistry",
        tagline: "Importers & Stockist of MS Sheets, Rods, Plates, Wire, Pipes, Pipe Fittings, and All type of Valves",
        address: "Shop No.1, Ilyas Manzil, Ireland Road, Off: Nishtar Road, Karachi",
        phone: "0345-5483947",
        email: "mistrysteel0786@gmail.com",
        ntn: "0671807-8",
        strn: "11-00-7326-286-46",
      },
      {
        name: "Taheri Supply Agency",
        code: "TSA",
        templateKey: "taheri",
        tagline: "Deals In All Types Of Electrical Items & General Order Suppliers",
        address: "Shop No.13, Block-B, Nishtar Road, Saddar, Karachi",
        phone: "021-32730519 / 0335-7335353",
        email: "taherisupplyagency53@gmail.com",
        ntn: "4098147-9",
      },
      {
        name: "Al Mufaddal Enterprises",
        code: "AME",
        templateKey: "almufaddal",
        tagline:
          "Dealers & Suppliers of : Brass, Copper & Stainless Steel Rods, Pipes, Tubes, Sheets & Strips, Aluminum Rods & Sheets, None Ferrous & Ferrous Metals, Gun Metal Rod, Phosphorous Bronze Rod & Sheets & other Metals",
        address: "Shop No.41, Moore Street, Badri Bldg, Light House, Karachi",
        phone: "0313-2483947",
        email: "almufaddalenterprise56@gmail.com",
        ntn: "4098150-9",
      },
      {
        name: "Al Burhan Trading Co.",
        code: "ABT",
        templateKey: "alburhan",
        tagline: "Deals in all kind of hardware items, Safety Equipments, Industrial Hoses, Pneumatic & Electrical Items",
        address: "Plot No. DR-9, Mohammedi, Suite No-17, Serai Quarters, Saddar Town, Karachi",
        phone: "0335-7335353",
        // The letterhead scan reads "alburhantradingcogmail.com" — the @ is
        // missing on the printed sheet. Confirm this with the client.
        email: "alburhantradingco@gmail.com",
        ntn: "4190698-5",
        gstNumber: "1700419069813",
      },
      {
        name: "M.B. Industrial Solution",
        code: "MBIS",
        templateKey: "mbis",
        tagline:
          "Deals in all kind of Hardware Items, UPVC/CPVC SCH 40/80, Pipes & Fittings, Safety Equipments, Industrial Hoses, Pneumatic Equipments, Machine and Cutting Tools, Electrical Items & General Order Suppliers",
        address: "Suite No.8, 5th Floor, Asgher Terrace, Kanji Tulsidas Street, Pakistan Chowk, Karachi",
        phone: "+92 325 9237253",
        email: "mbindustrialsolution52@gmail.com",
        ntn: "J493369-7",
      },
    ],
  });
  revalidatePath("/companies");
}

/* ---------------------------------------------------------------- customers */

export async function saveCustomer(formData: FormData) {
  await requireUser();
  const id = text(formData.get("id"));
  const data = {
    name: req(formData, "name", "Customer name"),
    contactPerson: text(formData.get("contactPerson")),
    phone: text(formData.get("phone")),
    email: text(formData.get("email")),
    address: text(formData.get("address")),
    ntn: text(formData.get("ntn")),
    gstNumber: text(formData.get("gstNumber")),
  };

  if (id) await prisma.customer.update({ where: { id }, data });
  else await prisma.customer.create({ data });

  revalidatePath("/customers");
}

export async function deleteCustomer(formData: FormData) {
  await requireUser();
  const id = req(formData, "id", "Customer");
  const [quotations, bills] = await Promise.all([
    prisma.quotation.count({ where: { customerId: id } }),
    prisma.bill.count({ where: { customerId: id } }),
  ]);
  if (quotations > 0 || bills > 0) {
    throw new Error(
      `This customer cannot be deleted — ${quotations} quotation(s) and ${bills} bill(s) already use them.`,
    );
  }
  await prisma.customer.delete({ where: { id } });
  revalidatePath("/customers");
}

/* ----------------------------------------------------------------- products */

export async function saveProduct(formData: FormData) {
  await requireUser();
  const id = text(formData.get("id"));
  const data = {
    name: req(formData, "name", "Product name"),
    code: text(formData.get("code")),
    unit: String(formData.get("unit") ?? "pcs").trim() || "pcs",
    defaultRate: round2(num(formData.get("defaultRate"))),
  };

  if (id) await prisma.product.update({ where: { id }, data });
  else await prisma.product.create({ data });

  revalidatePath("/products");
}

export async function deleteProduct(formData: FormData) {
  await requireUser();
  const id = req(formData, "id", "Product");
  // Lines keep their own snapshot, so detaching loses nothing on a document.
  await prisma.$transaction([
    prisma.quotationItem.updateMany({ where: { productId: id }, data: { productId: null } }),
    prisma.billItem.updateMany({ where: { productId: id }, data: { productId: null } }),
    prisma.product.delete({ where: { id } }),
  ]);
  revalidatePath("/products");
}

/* --------------------------------------------------------------- quotations */

type ItemRow = {
  productId: string | null;
  description: string;
  unit: string;
  quantity: number;
  rate: number;
  amount: number;
  sortOrder: number;
};

/** Reads the repeating line-item inputs. Blank descriptions are dropped. */
function readItems(fd: FormData): ItemRow[] {
  const descriptions = fd.getAll("itemDescription");
  const units = fd.getAll("itemUnit");
  const quantities = fd.getAll("itemQuantity");
  const rates = fd.getAll("itemRate");
  const productIds = fd.getAll("itemProductId");

  const rows: ItemRow[] = [];
  for (let i = 0; i < descriptions.length; i++) {
    const description = String(descriptions[i] ?? "").trim();
    if (!description) continue;
    const quantity = num(quantities[i]);
    const rate = num(rates[i]);
    rows.push({
      productId: text(productIds[i]),
      description,
      unit: String(units[i] ?? "").trim() || "pcs",
      quantity,
      rate,
      amount: round2(quantity * rate),
      sortOrder: rows.length,
    });
  }
  return rows;
}

/**
 * A quotation's total is its lines and nothing else. GST and cartage belong to
 * bills; the form no longer asks, so re-saving an old quotation clears them,
 * which is the intent.
 */
function readTotals(fd: FormData, items: ItemRow[]) {
  const subtotal = round2(items.reduce((sum, it) => sum + it.amount, 0));
  const gstPercent = round2(num(fd.get("gstPercent")));
  const gstAmount = round2((subtotal * gstPercent) / 100);
  const cartage = round2(num(fd.get("cartage")));
  return { subtotal, gstPercent, gstAmount, cartage, total: round2(subtotal + gstAmount + cartage) };
}

/**
 * Next sequence for this company: "0001", "0002", ...
 *
 * ponytail: string ordering only holds while every number is 4 digits. At 10000
 * per company this needs a real counter column.
 */
async function nextNumber(companyId: string): Promise<string> {
  const last = await prisma.quotation.findFirst({
    where: { companyId },
    orderBy: { number: "desc" },
    select: { number: true },
  });
  const n = last ? Number(last.number) + 1 : 1;
  return String(n).padStart(4, "0");
}

function readCommon(fd: FormData) {
  return {
    date: parseInputDate(fd.get("date")) ?? new Date(),
    // The shared form calls this `until`; on a bill it is the due date.
    validUntil: parseInputDate(fd.get("until")),
    status: String(fd.get("status") ?? "DRAFT") as QuotationStatus,
    poNumber: text(fd.get("poNumber")),
    dcNumber: text(fd.get("dcNumber")),
    notes: text(fd.get("notes")),
    terms: text(fd.get("terms")),
  };
}

export async function createQuotation(formData: FormData) {
  await requireUser();
  const companyId = req(formData, "companyId", "Company");
  const customerId = req(formData, "customerId", "Customer");
  const items = readItems(formData);
  if (items.length === 0) throw new Error("At least one item is required.");

  const common = readCommon(formData);
  const totals = readTotals(formData, items);

  // Two people saving in the same second would both read the same last number.
  // @@unique([companyId, number]) catches it; retrying picks up the next one.
  let id = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const created = await prisma.quotation.create({
        data: {
          number: await nextNumber(companyId),
          companyId,
          customerId,
          ...common,
          ...totals,
          items: { create: items },
        },
        select: { id: true },
      });
      id = created.id;
      break;
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code !== "P2002" || attempt === 2) throw e;
    }
  }

  revalidatePath("/quotations");
  redirect(`/quotations/${id}`);
}

export async function updateQuotation(formData: FormData) {
  await requireUser();
  const id = req(formData, "id", "Quotation");
  const customerId = req(formData, "customerId", "Customer");
  const items = readItems(formData);
  if (items.length === 0) throw new Error("At least one item is required.");

  const common = readCommon(formData);
  const totals = readTotals(formData, items);

  // The company, and so the number, is fixed once issued. Lines are replaced
  // wholesale: simpler and always correct.
  await prisma.$transaction([
    prisma.quotationItem.deleteMany({ where: { quotationId: id } }),
    prisma.quotation.update({
      where: { id },
      data: { customerId, ...common, ...totals, items: { create: items } },
    }),
  ]);

  revalidatePath("/quotations");
  redirect(`/quotations/${id}`);
}

export async function setQuotationStatus(formData: FormData) {
  await requireUser();
  const id = req(formData, "id", "Quotation");
  const status = String(formData.get("status") ?? "DRAFT") as QuotationStatus;
  await prisma.quotation.update({ where: { id }, data: { status } });
  revalidatePath(`/quotations/${id}`);
  revalidatePath("/quotations");
}

export async function deleteQuotation(formData: FormData) {
  await requireUser();
  const id = req(formData, "id", "Quotation");
  await prisma.quotation.delete({ where: { id } }); // items cascade
  revalidatePath("/quotations");
  redirect("/quotations");
}
