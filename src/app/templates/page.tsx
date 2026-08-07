// The design gallery: every quotation format side by side, filled with the same
// sample line items so only the design differs. This is the page to show the
// client when asking "is this how your quotation should look?".
//
// Real company details are used wherever that company already exists, so after
// seeding this page shows the actual letterheads rather than placeholders.
import Link from "next/link";
import DownloadPdf from "@/components/download-pdf";
import { CompanyLogo, PageHeader, btn } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { TEMPLATES, TEMPLATE_KEYS } from "@/lib/quotation-templates";
import { SAMPLE_DOC } from "@/lib/quotation-templates/types";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const companies = await prisma.company.findMany();
  const byTemplate = new Map(companies.map((c) => [c.templateKey, c]));

  return (
    <>
      <PageHeader
        title="Quotation designs"
        subtitle="One design per company, copied from its letterhead. The fields are the same on every one."
      >
        <Link href="/companies" className={btn.ghost}>
          Companies
        </Link>
        <DownloadPdf href="/api/designs/pdf" fileName="quotation-designs.pdf" label="Download all as PDF" />
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-2">
        {TEMPLATE_KEYS.map((key) => {
          const { label, Component } = TEMPLATES[key];
          const real = byTemplate.get(key);
          const doc = {
            ...SAMPLE_DOC,
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
              : { ...SAMPLE_DOC.company, name: label },
          };

          return (
            <section key={key} id={key} className="overflow-hidden rounded-md border border-line bg-paper">
              <div className="flex items-center gap-2.5 border-b border-line-2 px-4 py-3">
                <CompanyLogo code={real?.code ?? key.slice(0, 4)} templateKey={key} logoUrl={real?.logoUrl} />
                <h2 className="truncate text-[13.5px] font-semibold">{real ? real.name : label}</h2>
                {!real && <span className="ml-auto shrink-0 text-[11px] text-ink-3">Sample data</span>}
              </div>
              {/* The sheet is a fixed 210mm wide, so it is scaled down and the
                  wrapper is sized to the scaled result. */}
              <div className="overflow-hidden bg-canvas p-4">
                <div className="mx-auto h-[208mm] w-[147mm] overflow-hidden border border-line bg-white shadow-sm">
                  <div className="origin-top-left scale-[0.7]">
                    <Component doc={doc} />
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
