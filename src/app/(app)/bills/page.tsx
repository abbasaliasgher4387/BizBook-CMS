// Bills, and the queue that feeds them: an accepted quotation sits in the panel
// at the top until it has been billed, then leaves on its own.
import Link from "next/link";
import { Badge, CompanyTabs, EmptyState, FilterRow, PageHeader, btn } from "@/components/ui";
import { BILL_STATUSES } from "@/lib/app";
import { money, rupees, shortDate } from "@/lib/format";
import { listFilters, listWhere } from "@/lib/list-filters";
import { prisma } from "@/lib/prisma";
import { swatchFor } from "@/lib/quotation-templates";
import type { BillStatus } from "../../../../generated/prisma/enums";

export const dynamic = "force-dynamic";

/* The same grid the quotations list uses, so the two read as one table. */
const ROW = "grid min-w-[42rem] grid-cols-[9rem_1fr_7.5rem_5.5rem_9rem] items-center gap-3 px-3";

export default async function BillsPage(props: PageProps<"/bills">) {
  const sp = await props.searchParams;
  const f = listFilters(sp, BILL_STATUSES);
  // Already checked against BILL_STATUSES; the cast only names the enum.
  const where = { ...listWhere(f), ...(f.status ? { status: f.status as BillStatus } : {}) };

  const [companies, bills, totalCount, ready] = await Promise.all([
    prisma.company.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true, templateKey: true, _count: { select: { bills: true } } },
    }),
    prisma.bill.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { number: "desc" }],
      include: { company: { select: { code: true } }, customer: { select: { name: true } } },
    }),
    prisma.bill.count(),
    // `bills: { none: {} }` is what makes a row leave the moment it is billed.
    // Only the company tab narrows this — hiding a waiting job behind a date
    // range is how one gets forgotten.
    prisma.quotation.findMany({
      where: { status: "ACCEPTED", bills: { none: {} }, ...(f.company ? { companyId: f.company } : {}) },
      orderBy: { date: "desc" },
      include: {
        company: { select: { code: true, templateKey: true } },
        customer: { select: { name: true } },
      },
    }),
  ]);

  const current = companies.find((c) => c.id === f.company);
  const scope = current ? current._count.bills : totalCount;
  const shownTotal = bills.reduce((sum, b) => sum + Number(b.total), 0);

  return (
    <>
      <PageHeader title="Bills" subtitle={current?.name}>
        {companies.length > 0 && (
          <Link href="/bills/new" className={btn.ghost}>
            New bill
          </Link>
        )}
      </PageHeader>

      {companies.length > 0 && (
        <CompanyTabs
          base="/bills"
          selected={f.company}
          total={totalCount}
          companies={companies
            .filter((c) => c._count.bills > 0)
            .map((c) => ({ id: c.id, code: c.code, templateKey: c.templateKey, count: c._count.bills }))}
        />
      )}

      {ready.length > 0 && (
        <section className="mb-4 overflow-hidden rounded-md border border-emerald-200 bg-emerald-50/40">
          <header className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-emerald-200 px-3 py-2.5">
            <h2 className="text-[13px] font-semibold text-emerald-900">Ready to bill</h2>
            <p className="max-w-xl text-[11.5px] leading-snug text-emerald-800/80">
              {ready.length} accepted quotation{ready.length === 1 ? "" : "s"} with no bill yet. Opening one copies its
              lines onto a new bill, where the charges are added.
            </p>
          </header>

          <ul className="divide-y divide-emerald-200/70">
            {ready.map((q) => (
              <li key={q.id}>
                <Link
                  href={`/bills/new?from=${q.id}`}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5 transition-colors hover:bg-emerald-100/40"
                >
                  <span
                    aria-hidden
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: swatchFor(q.company.templateKey) }}
                  />
                  <span className="tnum w-[7rem] shrink-0 text-[13px] font-medium">
                    {q.company.code}-{q.number}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13px]">{q.customer.name}</span>
                  <span className="tnum shrink-0 text-[12.5px] text-ink-2">{shortDate(q.date)}</span>
                  <span className="tnum w-[7rem] shrink-0 text-right text-[13px] font-medium">
                    {money(Number(q.total))}
                  </span>
                  <span className="shrink-0 text-[12px] font-medium text-emerald-800">Create bill →</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {companies.length > 0 && (
        <>
          <FilterRow action="/bills" filters={f} statuses={BILL_STATUSES} />

          <p className="mb-3 border-b border-line pb-3 text-[12px] text-ink-2">
            <span className="tnum font-medium text-ink">{bills.length}</span> of <span className="tnum">{scope}</span>{" "}
            shown
            <span className="px-1.5 text-ink-3">·</span>
            Total <span className="tnum font-medium text-ink">{rupees(shownTotal)}</span>
          </p>
        </>
      )}

      {companies.length === 0 && (
        <EmptyState>
          A bill belongs to a company, so add one first.
          <span className="mt-3 block">
            <Link href="/companies" className={btn.primary}>
              Open Companies
            </Link>
          </span>
        </EmptyState>
      )}

      {companies.length > 0 && bills.length === 0 && (
        <EmptyState>
          {f.active ? (
            <>
              Nothing matches these filters.
              <span className="mt-3 block">
                <Link href={f.company ? `/bills?company=${f.company}` : "/bills"} className={btn.ghost}>
                  Clear filters
                </Link>
              </span>
            </>
          ) : (
            <>
              {f.company ? "No bills for this company yet." : "No bills yet."}
              <span className="mt-1.5 block text-[12px] text-ink-3">
                Mark a quotation ACCEPTED and it appears above, ready to bill — or start one from scratch.
              </span>
              <span className="mt-3 block">
                <Link href="/bills/new" className={btn.primary}>
                  New bill
                </Link>
              </span>
            </>
          )}
        </EmptyState>
      )}

      {bills.length > 0 && (
        <div className="overflow-x-auto rounded-md border border-line bg-paper">
          <div
            className={`${ROW} border-b border-line bg-canvas/60 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.07em] text-ink-3`}
          >
            <span>Number</span>
            <span>Customer</span>
            <span>Date</span>
            <span>Status</span>
            <span className="text-right">Total</span>
          </div>

          <div className="divide-y divide-line-2">
            {bills.map((b) => (
              <Link key={b.id} href={`/bills/${b.id}`} className={`${ROW} py-2.5 transition-colors hover:bg-canvas/60`}>
                <span className="tnum text-[13px] font-medium">
                  {b.company.code}-B-{b.number}
                </span>
                <span className="truncate text-[13px]">{b.customer.name}</span>
                <span className="tnum text-[12.5px] text-ink-2">{shortDate(b.date)}</span>
                <span>
                  <Badge status={b.status} />
                </span>
                <span className="tnum text-right text-[13px] font-medium">{money(Number(b.total))}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
