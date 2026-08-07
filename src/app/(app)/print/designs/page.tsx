// Every quotation design, full size, one per sheet. This page exists only to be
// printed — the gallery at /templates scales its previews down to fit on screen,
// which is exactly what a PDF must not do.
import { prisma } from "@/lib/prisma";
import { TEMPLATES, TEMPLATE_KEYS } from "@/lib/quotation-templates";
import { SAMPLE_DOC } from "@/lib/quotation-templates/types";

export const dynamic = "force-dynamic";

export default async function PrintDesignsPage() {
  const companies = await prisma.company.findMany();
  const byTemplate = new Map(companies.map((c) => [c.templateKey, c]));

  return (
    <div className="bg-white">
      {TEMPLATE_KEYS.map((key, i) => {
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
          <div key={key} className={i === TEMPLATE_KEYS.length - 1 ? undefined : "break-after-page"}>
            <Component doc={doc} />
          </div>
        );
      })}
    </div>
  );
}
