// Every design full size, one per sheet. Printing only: /templates scales its
// previews down to fit a screen, which a PDF must never do. `?kind=bill` prints
// them as bills.
import { prisma } from "@/lib/prisma";
import { TEMPLATES, TEMPLATE_KEYS } from "@/lib/quotation-templates";
import { sampleDoc } from "@/lib/quotation-templates/types";

export const dynamic = "force-dynamic";

export default async function PrintDesignsPage(props: PageProps<"/print/designs">) {
  const sp = await props.searchParams;
  const sample = sampleDoc(sp.kind === "bill" ? "BILL" : "QUOTATION");
  const companies = await prisma.company.findMany();
  const byTemplate = new Map(companies.map((c) => [c.templateKey, c]));

  return (
    <div className="bg-white">
      {TEMPLATE_KEYS.map((key, i) => {
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
          <div key={key} className={i === TEMPLATE_KEYS.length - 1 ? undefined : "break-after-page"}>
            <Component doc={doc} />
          </div>
        );
      })}
    </div>
  );
}
