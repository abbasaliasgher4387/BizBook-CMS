import Link from "next/link";
import { Badge, DocNumber, EmptyState, PageHeader, btn, sectionLabel } from "@/components/ui";
import { money, shortDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/* Same columns as the Quotations list, so the two read as one thing. */
const ROW = "grid min-w-[42rem] grid-cols-[9rem_1fr_7.5rem_5.5rem_9rem] items-center gap-3 px-3";

export default async function Home() {
  const [companies, customers, products, quotations, recent] = await Promise.all([
    prisma.company.count(),
    prisma.customer.count(),
    prisma.product.count(),
    prisma.quotation.count(),
    prisma.quotation.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        company: { select: { code: true, templateKey: true, logoUrl: true } },
        customer: { select: { name: true } },
      },
    }),
  ]);

  return (
    <>
      <PageHeader title="Dashboard">
        <Link href="/quotations/new" className={btn.primary}>
          New quotation
        </Link>
      </PageHeader>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat href="/quotations" label="Quotations" value={quotations} />
        <Stat href="/companies" label="Companies" value={companies} />
        <Stat href="/customers" label="Customers" value={customers} />
        <Stat href="/products" label="Products" value={products} />
      </div>

      {companies === 0 ? (
        <div className="mt-5 rounded-md border border-line bg-paper p-5">
          <h2 className="text-[13.5px] font-semibold">Set up the companies first</h2>
          <p className="mt-1 max-w-xl text-[12.5px] leading-relaxed text-ink-2">
            Every company from the supplied letterheads can be added in one click, and any detail corrected
            afterwards. A quotation cannot be created until at least one company exists.
          </p>
          <div className="mt-3.5 flex flex-wrap items-center gap-2">
            <Link href="/templates" className={btn.ghost}>
              See the designs
            </Link>
            <Link href="/companies" className={btn.primary}>
              Open Companies
            </Link>
          </div>
        </div>
      ) : (
        <section className="mt-7">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className={sectionLabel}>Recent quotations</h2>
            <Link href="/quotations" className="text-[12px] font-medium text-accent hover:underline">
              View all
            </Link>
          </div>

          {recent.length === 0 ? (
            <EmptyState>
              No quotations yet.{" "}
              <Link href="/quotations/new" className="font-medium text-accent hover:underline">
                Create the first one
              </Link>
              .
            </EmptyState>
          ) : (
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
                {recent.map((q) => (
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
        </section>
      )}
    </>
  );
}

function Stat({ href, label, value }: { href: string; label: string; value: number }) {
  return (
    <Link href={href} className="rounded-md border border-line bg-paper px-4 py-3 transition-colors hover:border-ink-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-3">{label}</p>
      <p className="tnum mt-1.5 text-[22px] font-semibold leading-none">{value}</p>
    </Link>
  );
}
