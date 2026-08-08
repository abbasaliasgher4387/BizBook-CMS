// Every design side by side on the same sample lines, so only the design
// differs. One design serves both documents; the tab switches the title and the
// totals block. Real company details are used wherever the company exists.
import Link from "next/link";
import DownloadPdf from "@/components/download-pdf";
import { CompanyLogo, PageHeader, btn } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { TEMPLATES, TEMPLATE_KEYS } from "@/lib/quotation-templates";
import { sampleDoc } from "@/lib/quotation-templates/types";

export const dynamic = "force-dynamic";

export default async function TemplatesPage(props: PageProps<"/templates">) {
  const sp = await props.searchParams;
  const bill = sp.kind === "bill";
  const kind = bill ? "bill" : "quotation";
  const sample = sampleDoc(bill ? "BILL" : "QUOTATION");

  const companies = await prisma.company.findMany();
  const byTemplate = new Map(companies.map((c) => [c.templateKey, c]));

  return (
    <>
      <PageHeader
        title="Document designs"
        subtitle="One design per company, copied from its letterhead. A quotation and a bill print on the same sheet — only the title and the totals block differ."
      >
        <Link href="/companies" className={btn.ghost}>
          Companies
        </Link>
        <DownloadPdf href={`/api/designs/pdf?kind=${kind}`} fileName={`${kind}-designs.pdf`} />
      </PageHeader>

      <nav aria-label="Document type" className="mb-4 flex flex-wrap items-center gap-1.5">
        <Tab href="/templates" active={!bill} label="As a quotation" />
        <Tab href="/templates?kind=bill" active={bill} label="As a bill" />
      </nav>

      <div className="grid gap-6 lg:grid-cols-2">
        {TEMPLATE_KEYS.map((key) => {
          const { label, Component } = TEMPLATES[key];
          const real = byTemplate.get(key);
          const doc = {
            ...sample,
            company: real
              ? {
                  name: real.name,
                  code: real.code,
                  tagline: real.tagline,
                  address: real.address,
                  phone: real.phone,
                  email: real.email,
                  ntn: real.ntn,
                  strn: real.strn,
                  gstNumber: real.gstNumber,
                  logoUrl: real.logoUrl,
                }
              : { ...sample.company, name: label },
          };

          return (
            <section key={key} id={key} className="overflow-hidden rounded-md border border-line bg-paper">
              <div className="flex items-center gap-2.5 border-b border-line-2 px-4 py-3">
                <CompanyLogo code={real?.code ?? key.slice(0, 4)} templateKey={key} logoUrl={real?.logoUrl} />
                <h2 className="truncate text-[13.5px] font-semibold">{real ? real.name : label}</h2>
                {!real && <span className="ml-auto shrink-0 text-[11px] text-ink-3">Sample data</span>}
              </div>
              <div className="bg-canvas p-3 sm:p-4">
                <div className="sheet-fit mx-auto max-w-[210mm] border border-line bg-white shadow-sm">
                  <Component doc={doc} />
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}

function Tab({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`inline-flex h-8 shrink-0 items-center rounded-[5px] border px-2.5 text-[12.5px] font-medium transition-colors ${
        active ? "border-ink bg-ink text-white" : "border-line bg-paper text-ink-2 hover:bg-canvas"
      }`}
    >
      {label}
    </Link>
  );
}
