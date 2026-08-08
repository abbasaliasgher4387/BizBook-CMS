"use server";

// Everything that writes a bill. Separate from actions.ts because a bill has
// one concern nothing else has: charges.
//
// As in actions.ts, every export here is a public POST endpoint, so every one of
// them names who may call it on its first line.
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { chargeValue, num, parseInputDate, req, round2, text } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import type { BillStatus } from "../../generated/prisma/enums";

/* ------------------------------------------------------------------ reading */

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

type ChargeRow = { label: string; percent: number | null; amount: number; sortOrder: number };

/**
 * A charge is a percentage of the subtotal *or* a flat figure. With a percent
 * typed, the amount box is ignored and recomputed here: the percentage is the
 * instruction. An unnamed charge is a row somebody abandoned, so it is dropped.
 */
function readCharges(fd: FormData, subtotal: number): ChargeRow[] {
  const labels = fd.getAll("chargeLabel");
  const percents = fd.getAll("chargePercent");
  const amounts = fd.getAll("chargeAmount");

  const rows: ChargeRow[] = [];
  for (let i = 0; i < labels.length; i++) {
    const label = String(labels[i] ?? "").trim();
    if (!label) continue;

    const typedPercent = String(percents[i] ?? "").trim();
    const percent = typedPercent === "" ? null : round2(num(percents[i]));

    rows.push({
      label,
      percent,
      amount: chargeValue(percent, num(amounts[i]), subtotal),
      sortOrder: rows.length,
    });
  }
  return rows;
}

/** Lines, then charges on top. Both are read before this is called, because a
    percentage charge cannot be worked out until the subtotal is known. */
function readTotals(items: ItemRow[], charges: ChargeRow[]) {
  const subtotal = round2(items.reduce((sum, it) => sum + it.amount, 0));
  const chargesTotal = round2(charges.reduce((sum, c) => sum + c.amount, 0));
  return { subtotal, chargesTotal, total: round2(subtotal + chargesTotal) };
}

function readCommon(fd: FormData) {
  return {
    date: parseInputDate(fd.get("date")) ?? new Date(),
    dueDate: parseInputDate(fd.get("until")),
    status: String(fd.get("status") ?? "DRAFT") as BillStatus,
    poNumber: text(fd.get("poNumber")),
    dcNumber: text(fd.get("dcNumber")),
    notes: text(fd.get("notes")),
    terms: text(fd.get("terms")),
  };
}

/** The lines' own sum, needed before charges can be read. */
function linesTotal(items: ItemRow[]): number {
  return round2(items.reduce((sum, it) => sum + it.amount, 0));
}

/**
 * Next bill number for this company: "0001", "0002", ...
 *
 * Its own sequence, unrelated to the company's quotation numbers — the sheet
 * prints SAMS-B-0001 so the two can never be read as the same document.
 *
 * ponytail: string ordering only holds while every number is 4 digits. At 10000
 * bills for one company this needs a real counter column.
 */
async function nextNumber(companyId: string): Promise<string> {
  const last = await prisma.bill.findFirst({
    where: { companyId },
    orderBy: { number: "desc" },
    select: { number: true },
  });
  const n = last ? Number(last.number) + 1 : 1;
  return String(n).padStart(4, "0");
}

/* ------------------------------------------------------------------ writing */

export async function createBill(formData: FormData) {
  await requireUser();
  const companyId = req(formData, "companyId", "Company");
  const customerId = req(formData, "customerId", "Customer");
  const items = readItems(formData);
  if (items.length === 0) throw new Error("At least one item is required.");

  const common = readCommon(formData);
  const charges = readCharges(formData, linesTotal(items));
  const totals = readTotals(items, charges);
  // A cross-reference and nothing more: the bill holds its own copy of every
  // line.
  const quotationId = text(formData.get("quotationId"));

  // Two people saving in the same second would both read the same last number.
  // @@unique([companyId, number]) catches it; retrying picks up the next one.
  let id = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const created = await prisma.bill.create({
        data: {
          number: await nextNumber(companyId),
          companyId,
          customerId,
          quotationId,
          ...common,
          ...totals,
          items: { create: items },
          charges: { create: charges },
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

  revalidatePath("/bills");
  revalidatePath("/quotations");
  redirect(`/bills/${id}`);
}

export async function updateBill(formData: FormData) {
  await requireUser();
  const id = req(formData, "id", "Bill");
  const customerId = req(formData, "customerId", "Customer");
  const items = readItems(formData);
  if (items.length === 0) throw new Error("At least one item is required.");

  const common = readCommon(formData);
  const charges = readCharges(formData, linesTotal(items));
  const totals = readTotals(items, charges);

  // The company, and so the number, is fixed once issued. Lines and charges are
  // replaced wholesale: simpler than matching rows up, and always correct.
  await prisma.$transaction([
    prisma.billItem.deleteMany({ where: { billId: id } }),
    prisma.billCharge.deleteMany({ where: { billId: id } }),
    prisma.bill.update({
      where: { id },
      data: { customerId, ...common, ...totals, items: { create: items }, charges: { create: charges } },
    }),
  ]);

  revalidatePath("/bills");
  redirect(`/bills/${id}`);
}

export async function setBillStatus(formData: FormData) {
  await requireUser();
  const id = req(formData, "id", "Bill");
  const status = String(formData.get("status") ?? "DRAFT") as BillStatus;
  await prisma.bill.update({ where: { id }, data: { status } });
  revalidatePath(`/bills/${id}`);
  revalidatePath("/bills");
}

export async function deleteBill(formData: FormData) {
  await requireUser();
  const id = req(formData, "id", "Bill");
  await prisma.bill.delete({ where: { id } }); // items and charges cascade
  revalidatePath("/bills");
  revalidatePath("/quotations");
  redirect("/bills");
}
