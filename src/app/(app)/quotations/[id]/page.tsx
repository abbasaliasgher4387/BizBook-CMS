// View + print in one page. There is no separate /print route: the app chrome
// is marked .no-print, so Ctrl+P (or the Print button) yields just the sheet.
import Link from "next/link";
import { notFound } from "next/navigation";
import { setQuotationStatus } from "@/app/actions";
import { Badge, CompanyLogo, btn, inputClass } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { templateFor } from "@/lib/quotation-templates";
import type { QuotationDoc } from "@/lib/quotation-templates/types";
import Toolbar from "./toolbar";

export const dynamic = "force-dynamic";

const STATUSES = ["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED"];

export default async function QuotationPage(props: PageProps<"/quotations/[id]">) {
  const { id } = await props.params;

  const q = await prisma.quotation.findUnique({
    where: { id },
    include: {
      company: true,
      customer: true,
      items: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!q) notFound();

  const { Component, label } = templateFor(q.company.templateKey);

  // Prisma hands back Decimal objects and full model rows; the templates want
  // plain numbers and only the fields they print.
  const doc: QuotationDoc = {
    number: q.number,
    date: q.date,
    validUntil: q.validUntil,
    status: q.status,
    poNumber: q.poNumber,
    dcNumber: q.dcNumber,
    notes: q.notes,
    terms: q.terms,
    subtotal: Number(q.subtotal),
    gstPercent: Number(q.gstPercent),
    gstAmount: Number(q.gstAmount),
    cartage: Number(q.cartage),
    total: Number(q.total),
    company: {
      name: q.company.name,
      code: q.company.code,
      tagline: q.company.tagline,
      address: q.company.address,
      phone: q.company.phone,
      email: q.company.email,
      ntn: q.company.ntn,
      strn: q.company.strn,
      gstNumber: q.company.gstNumber,
      logoUrl: q.company.logoUrl,
    },
    customer: {
      name: q.customer.name,
      contactPerson: q.customer.contactPerson,
      address: q.customer.address,
      phone: q.customer.phone,
      email: q.customer.email,
      ntn: q.customer.ntn,
      gstNumber: q.customer.gstNumber,
    },
    items: q.items.map((it) => ({
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
              code={q.company.code}
              templateKey={q.company.templateKey}
              logoUrl={q.company.logoUrl}
              className="h-6"
            />
            <span className="tnum tracking-[0.02em]">{q.number}</span>
            <Badge status={q.status} />
          </h1>
          <p className="mt-1 text-[12.5px] text-ink-2">
            {q.company.name} · {q.customer.name} · <span className="text-ink-3">{label} design</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <form action={setQuotationStatus} className="flex items-center gap-1.5">
            <input type="hidden" name="id" value={q.id} />
            <select name="status" aria-label="Status" defaultValue={q.status} className={`${inputClass} w-auto`}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button className={btn.ghost}>Save status</button>
          </form>

          <Link href={`/quotations/${q.id}/edit`} className={btn.ghost}>
            Edit
          </Link>
          <Toolbar id={q.id} fileName={`${q.company.code}-${q.number}`} />
        </div>
      </div>

      {/* The sheet sits on the canvas like paper on a desk — the one place in
          the app where a shadow describes something real.

          .sheet-fit scales it to the width available, so a phone shows the
          whole document instead of a column of it you have to drag sideways.
          On paper it goes back to 210mm — see the print rules in globals.css. */}
      <div className="sheet-fit flex justify-center print:block">
        <div className="border border-line shadow-sm print:border-0 print:shadow-none">
          <Component doc={doc} />
        </div>
      </div>
    </>
  );
}
