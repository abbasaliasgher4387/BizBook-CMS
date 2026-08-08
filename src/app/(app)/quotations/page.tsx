import Link from "next/link";
import { Badge, CompanyTabs, EmptyState, FilterRow, PageHeader, btn } from "@/components/ui";
import { QUOTATION_STATUSES } from "@/lib/app";
import { money, rupees, shortDate } from "@/lib/format";
import { listFilters, listWhere } from "@/lib/list-filters";
import { prisma } from "@/lib/prisma";
import type { QuotationStatus } from "../../../../generated/prisma/enums";

export const dynamic = "force-dynamic";

/* One grid, shared by the heading and by every row. No company column: the
   Number already reads SAMS-0001. */
const ROW = "grid min-w-[42rem] grid-cols-[9rem_1fr_7.5rem_5.5rem_9rem] items-center gap-3 px-3";

export default async function QuotationsPage(props: PageProps<"/quotations">) {
  const sp = await props.searchParams;
  const f = listFilters(sp, QUOTATION_STATUSES);
  // Already checked against QUOTATION_STATUSES; the cast only names the enum.
  const where = { ...listWhere(f), ...(f.status ? { status: f.status as QuotationStatus } : {}) };

  const [companies, quotations, totalCount] = await Promise.all([
    prisma.company.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        code: true,
        templateKey: true,
        _count: { select: { quotations: true } },
      },
    }),
    prisma.quotation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        company: { select: { code: true } },
        customer: { select: { name: true } },
      },
    }),
    prisma.quotation.count(),
  ]);

  const current = companies.find((c) => c.id === f.company);
  /* What the list holds with the filter row cleared — the tab's own figure. */
  const scope = current ? current._count.quotations : totalCount;
  const shownTotal = quotations.reduce((sum, q) => sum + Number(q.total), 0);

  return (
    <>
      <PageHeader title="Quotations" subtitle={current?.name}>
        {companies.length > 0 && (
          <Link href="/quotations/new" className={btn.primary}>
            New quotation
          </Link>
        )}
      </PageHeader>

      {companies.length > 0 && (
        <>
          <CompanyTabs
            base="/quotations"
            selected={f.company}
            total={totalCount}
            companies={companies
              .filter((c) => c._count.quotations > 0)
              .map((c) => ({ id: c.id, code: c.code, templateKey: c.templateKey, count: c._count.quotations }))}
          />
          <FilterRow action="/quotations" filters={f} statuses={QUOTATION_STATUSES} />

          <p className="mb-3 border-b border-line pb-3 text-[12px] text-ink-2">
            <span className="tnum font-medium text-ink">{quotations.length}</span> of{" "}
            <span className="tnum">{scope}</span> shown
            <span className="px-1.5 text-ink-3">·</span>
            Total <span className="tnum font-medium text-ink">{rupees(shownTotal)}</span>
          </p>
        </>
      )}

      {companies.length === 0 && (
        <EmptyState>
          A quotation belongs to a company, so add one first.
          <span className="mt-3 block">
            <Link href="/companies" className={btn.primary}>
              Open Companies
            </Link>
          </span>
        </EmptyState>
      )}

      {companies.length > 0 && quotations.length === 0 && (
        <EmptyState>
          {f.active ? (
            <>
              Nothing matches these filters.
              <span className="mt-3 block">
                <Link href={f.company ? `/quotations?company=${f.company}` : "/quotations"} className={btn.ghost}>
                  Clear filters
                </Link>
              </span>
            </>
          ) : (
            <>
              {f.company ? "No quotations for this company yet." : "No quotations yet."}
              <span className="mt-3 block">
                <Link href="/quotations/new" className={btn.primary}>
                  New quotation
                </Link>
              </span>
            </>
          )}
        </EmptyState>
      )}

      {quotations.length > 0 && (
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
            {quotations.map((q) => (
              <Link
                key={q.id}
                href={`/quotations/${q.id}`}
                className={`${ROW} py-2.5 transition-colors hover:bg-canvas/60`}
              >
                <span className="tnum text-[13px] font-medium">
                  {q.company.code}-{q.number}
                </span>
                <span className="truncate text-[13px]">{q.customer.name}</span>
                <span className="tnum text-[12.5px] text-ink-2">{shortDate(q.date)}</span>
                <span>
                  <Badge status={q.status} />
                </span>
                <span className="tnum text-right text-[13px] font-medium">{money(Number(q.total))}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
