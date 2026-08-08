// View + print in one page, exactly as a quotation does. There is no separate
// /print route: the app chrome is marked .no-print, so Ctrl+P (or the Print
// button) yields just the sheet.
import Link from "next/link";
import { notFound } from "next/navigation";
import { setBillStatus } from "@/app/bill-actions";
import { Badge, CompanyLogo, btn, inputClass } from "@/components/ui";
import { BILL_STATUSES } from "@/lib/app";
import { chargeLine } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { templateFor } from "@/lib/quotation-templates";
import type { SheetDoc } from "@/lib/quotation-templates/types";
import Toolbar from "./toolbar";

export const dynamic = "force-dynamic";

export default async function BillPage(props: PageProps<"/bills/[id]">) {
  const { id } = await props.params;

  const b = await prisma.bill.findUnique({
    where: { id },
    include: {
      company: true,
      customer: true,
      items: { orderBy: { sortOrder: "asc" } },
      charges: { orderBy: { sortOrder: "asc" } },
      quotation: { select: { id: true, number: true } },
    },
  });
  if (!b) notFound();

  const { Component } = templateFor(b.company.templateKey);

  // Prisma hands back Decimal objects and full model rows; the designs want
  // plain numbers and only the fields they print.
  const doc: SheetDoc = {
    kind: "BILL",
    number: b.number,
    date: b.date,
    until: b.dueDate,
    status: b.status,
    poNumber: b.poNumber,
    dcNumber: b.dcNumber,
    notes: b.notes,
    terms: b.terms,
    subtotal: Number(b.subtotal),
    charges: b.charges.map((c) => ({
      label: chargeLine(c.label, c.percent === null ? null : Number(c.percent)),
      amount: Number(c.amount),
    })),
    total: Number(b.total),
    company: {
      name: b.company.name,
      code: b.company.code,
      tagline: b.company.tagline,
      address: b.company.address,
      phone: b.company.phone,
      email: b.company.email,
      ntn: b.company.ntn,
      strn: b.company.strn,
      gstNumber: b.company.gstNumber,
      logoUrl: b.company.logoUrl,
    },
    customer: {
      name: b.customer.name,
      contactPerson: b.customer.contactPerson,
      address: b.customer.address,
      phone: b.customer.phone,
      email: b.customer.email,
      ntn: b.customer.ntn,
      gstNumber: b.customer.gstNumber,
    },
    items: b.items.map((it) => ({
      description: it.description,
      unit: it.unit,
      quantity: Number(it.quantity),
      rate: Number(it.rate),
      amount: Number(it.amount),
    })),
  };

  return (
    <>
      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-line pb-4">
        <div className="min-w-0">
          <h1 className="flex flex-wrap items-center gap-2 text-[17px] font-semibold leading-tight">
            <CompanyLogo
              code={b.company.code}
              templateKey={b.company.templateKey}
              logoUrl={b.company.logoUrl}
              className="h-6"
            />
            <span className="tnum tracking-[0.02em]">B-{b.number}</span>
            <Badge status={b.status} />
          </h1>
          <p className="mt-1 text-[12.5px] text-ink-2">
            {b.company.name} · {b.customer.name}
            {b.quotation && (
              <>
                {" · "}
                <Link href={`/quotations/${b.quotation.id}`} className="underline underline-offset-2">
                  from quotation {b.company.code}-{b.quotation.number}
                </Link>
              </>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <form action={setBillStatus} className="flex items-center gap-1.5">
            <input type="hidden" name="id" value={b.id} />
            <select name="status" aria-label="Status" defaultValue={b.status} className={`${inputClass} w-auto`}>
              {BILL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button className={btn.ghost}>Save status</button>
          </form>

          <Link href={`/bills/${b.id}/edit`} className={btn.ghost}>
            Edit
          </Link>
          <Toolbar id={b.id} fileName={`${b.company.code}-B-${b.number}`} />
        </div>
      </div>

      {/* The sheet sits on the canvas like paper on a desk. .sheet-fit scales it
          to the width available, so a phone shows the whole document instead of
          a column of it. On paper it goes back to 210mm. */}
      <div className="sheet-fit flex justify-center print:block">
        <div className="border border-line shadow-sm print:border-0 print:shadow-none">
          <Component doc={doc} />
        </div>
      </div>
    </>
  );
}
