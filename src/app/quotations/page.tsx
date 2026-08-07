import Link from "next/link";
import { Badge, DocNumber, EmptyState, PageHeader, btn } from "@/components/ui";
import { money, shortDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { swatchFor } from "@/lib/quotation-templates";

export const dynamic = "force-dynamic";

/* One grid, shared by the heading and by every row. The company column is gone
   on purpose: the mark in the Number column already says whose document it is,
   and repeating the name down a filtered list is the noise this page had. */
const ROW = "grid min-w-[42rem] grid-cols-[9rem_1fr_7.5rem_5.5rem_9rem] items-center gap-3 px-3";

export default async function QuotationsPage(props: PageProps<"/quotations">) {
  const sp = await props.searchParams;
  const selected = typeof sp.company === "string" ? sp.company : "";

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
      where: selected ? { companyId: selected } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        company: { select: { code: true, templateKey: true, logoUrl: true } },
        customer: { select: { name: true } },
      },
    }),
    prisma.quotation.count(),
  ]);

  const withWork = companies.filter((c) => c._count.quotations > 0);
  const current = companies.find((c) => c.id === selected);

  return (
    <>
      <PageHeader
        title="Quotations"
        subtitle={current ? `${current.name} — ${current._count.quotations} of ${totalCount} in total.` : undefined}
      >
        {companies.length > 0 && (
          <Link href="/quotations/new" className={btn.primary}>
            New quotation
          </Link>
        )}
      </PageHeader>

      {withWork.length > 1 && (
        <nav aria-label="Filter by company" className="mb-4 flex flex-wrap items-center gap-1.5">
          <Tab href="/quotations" active={!selected} label="All companies" count={totalCount} />
          {withWork.map((c) => (
            <Tab
              key={c.id}
              href={`/quotations?company=${c.id}`}
              active={selected === c.id}
              label={c.code}
              count={c._count.quotations}
              swatch={swatchFor(c.templateKey)}
            />
          ))}
        </nav>
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
          {selected ? "No quotations for this company yet." : "No quotations yet."}
          <span className="mt-3 block">
            <Link href="/quotations/new" className={btn.primary}>
              New quotation
            </Link>
          </span>
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
                <DocNumber
                  code={q.company.code}
                  number={q.number}
                  templateKey={q.company.templateKey}
                  logoUrl={q.company.logoUrl}
                />
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

function Tab({
  href,
  active,
  label,
  count,
  swatch,
}: {
  href: string;
  active: boolean;
  label: string;
  count: number;
  swatch?: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[5px] border px-2.5 text-[12.5px] font-medium transition-colors ${
        active ? "border-ink bg-ink text-white" : "border-line bg-paper text-ink-2 hover:bg-canvas"
      }`}
    >
      {swatch && <span aria-hidden className="h-2 w-2 shrink-0 rounded-full" style={{ background: swatch }} />}
      {label}
      <span className={`tnum text-[11px] ${active ? "text-white/60" : "text-ink-3"}`}>{count}</span>
    </Link>
  );
}
