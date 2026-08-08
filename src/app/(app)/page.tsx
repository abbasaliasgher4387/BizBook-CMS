// Tiles stay greyscale: in this app colour means a company or a status, and a
// number is neither.
import Link from "next/link";
import { Badge, EmptyState, PageHeader, btn, sectionLabel } from "@/components/ui";
import { money, rupees, shortDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const ROW = "grid grid-cols-[7.5rem_1fr_5.5rem_7rem] items-center gap-2 px-3";

export default async function Home() {
  const [companies, quoted, billed, outstanding, ready, recentQuotations, recentBills] = await Promise.all([
    prisma.company.count(),
    prisma.quotation.aggregate({ _count: true, _sum: { total: true } }),
    prisma.bill.aggregate({ _count: true, _sum: { total: true } }),
    // DRAFT was never sent and CANCELLED is not owed, so only ISSUED counts.
    prisma.bill.aggregate({ where: { status: "ISSUED" }, _count: true, _sum: { total: true } }),
    prisma.quotation.count({ where: { status: "ACCEPTED", bills: { none: {} } } }),
    prisma.quotation.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: { company: { select: { code: true } }, customer: { select: { name: true } } },
    }),
    prisma.bill.findMany({
      take: 6,
      orderBy: [{ createdAt: "desc" }, { number: "desc" }],
      include: { company: { select: { code: true } }, customer: { select: { name: true } } },
    }),
  ]);

  if (companies === 0) {
    return (
      <>
        <PageHeader title="Dashboard" />
        <div className="rounded-md border border-line bg-paper p-5">
          <h2 className="text-[13.5px] font-semibold">Set up the companies first</h2>
          <p className="mt-1 max-w-xl text-[12.5px] leading-relaxed text-ink-2">
            Every company from the supplied letterheads can be added in one click, and any detail corrected afterwards.
            A quotation cannot be created until at least one company exists.
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
      </>
    );
  }

  return (
    <>
      <PageHeader title="Dashboard">
        <Link href="/quotations/new" className={btn.primary}>
          New quotation
        </Link>
      </PageHeader>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          href="/quotations"
          label="Quotations"
          value={String(quoted._count)}
          note={`${rupees(Number(quoted._sum.total ?? 0))} quoted`}
        />
        <Stat
          href="/bills"
          label="Bills"
          value={String(billed._count)}
          note={`${rupees(Number(billed._sum.total ?? 0))} billed`}
        />
        <Stat
          href="/bills?status=ISSUED"
          label="Outstanding"
          value={rupees(Number(outstanding._sum.total ?? 0))}
          note={`${outstanding._count} issued, not yet paid`}
        />
        <Stat
          href="/bills"
          label="Ready to bill"
          value={String(ready)}
          note={`accepted quotation${ready === 1 ? "" : "s"} with no bill`}
        />
      </div>

      <div className="mt-7 grid gap-5 lg:grid-cols-2">
        <Recent
          title="Recent quotations"
          href="/quotations"
          empty={
            <>
              No quotations yet.{" "}
              <Link href="/quotations/new" className="font-medium text-accent hover:underline">
                Create the first one
              </Link>
              .
            </>
          }
          rows={recentQuotations.map((q) => ({
            id: q.id,
            href: `/quotations/${q.id}`,
            ref: `${q.company.code}-${q.number}`,
            name: q.customer.name,
            date: q.date,
            status: q.status,
            total: Number(q.total),
          }))}
        />

        <Recent
          title="Recent bills"
          href="/bills"
          empty={
            <>
              No bills yet.{" "}
              <Link href="/bills/new" className="font-medium text-accent hover:underline">
                Create the first one
              </Link>
              .
            </>
          }
          rows={recentBills.map((b) => ({
            id: b.id,
            href: `/bills/${b.id}`,
            ref: `${b.company.code}-B-${b.number}`,
            name: b.customer.name,
            date: b.date,
            status: b.status,
            total: Number(b.total),
          }))}
        />
      </div>
    </>
  );
}

/** `value` is text because half of these are money and half are counts. */
function Stat({ href, label, value, note }: { href: string; label: string; value: string; note: string }) {
  return (
    <Link href={href} className="rounded-md border border-line bg-paper px-4 py-3 transition-colors hover:border-ink-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-3">{label}</p>
      <p className="tnum mt-1.5 text-[21px] font-semibold leading-tight">{value}</p>
      <p className="mt-1 text-[11.5px] leading-snug text-ink-2">{note}</p>
    </Link>
  );
}

type RecentRow = {
  id: string;
  href: string;
  ref: string;
  name: string;
  date: Date;
  status: string;
  total: number;
};

function Recent({
  title,
  href,
  rows,
  empty,
}: {
  title: string;
  href: string;
  rows: RecentRow[];
  empty: React.ReactNode;
}) {
  return (
    <section className="min-w-0">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className={sectionLabel}>{title}</h2>
        <Link href={href} className="text-[12px] font-medium text-accent hover:underline">
          View all
        </Link>
      </div>

      {rows.length === 0 ? (
        <EmptyState>{empty}</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-md border border-line bg-paper">
          <div className="min-w-[26rem]">
            <div
              className={`${ROW} border-b border-line bg-canvas/60 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.07em] text-ink-3`}
            >
              <span>Number</span>
              <span>Customer</span>
              <span>Status</span>
              <span className="text-right">Total</span>
            </div>

            <div className="divide-y divide-line-2">
              {rows.map((r) => (
                <Link key={r.id} href={r.href} className={`${ROW} py-2.5 transition-colors hover:bg-canvas/60`}>
                  <span className="tnum text-[13px] font-medium">{r.ref}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13px]">{r.name}</span>
                    <span className="tnum block text-[11.5px] text-ink-3">{shortDate(r.date)}</span>
                  </span>
                  <span>
                    <Badge status={r.status} />
                  </span>
                  <span className="tnum text-right text-[13px] font-medium">{money(r.total)}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
