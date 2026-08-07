import Link from "next/link";
import { deleteCompany, saveCompany, seedCompanies } from "@/app/actions";
import { CompanyLogo, EmptyState, Field, PageHeader, btn, fieldLabel, inputClass, textareaClass } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { TEMPLATES, TEMPLATE_KEYS, templateFor } from "@/lib/quotation-templates";

export const dynamic = "force-dynamic";

/* One grid, shared by the heading and by every row, so the columns stay in line
   while an opened row is still free to run the full width of the card. */
const ROW = "grid min-w-[38rem] grid-cols-[6rem_1fr_1fr_3rem] items-center gap-3 px-3";

export default async function CompaniesPage() {
  const companies = await prisma.company.findMany({ orderBy: { name: "asc" } });

  return (
    <>
      <PageHeader title="Companies" subtitle="Open a company to change its details or the design it prints on.">
        <Link href="/templates" className={btn.ghost}>
          View all designs
        </Link>
      </PageHeader>

      {companies.length === 0 && (
        <div className="mb-4 rounded-md border border-line bg-paper p-5">
          <h2 className="text-[13.5px] font-semibold">Add the companies from the letterheads</h2>
          <p className="mt-1 max-w-xl text-[12.5px] leading-relaxed text-ink-2">
            Every company taken from the supplied letterheads is added in one click. Any detail can be corrected
            afterwards, and more companies can be added by hand below.
          </p>
          <form action={seedCompanies} className="mt-3.5">
            <button className={btn.primary}>Add companies from letterheads</button>
          </form>
        </div>
      )}

      {companies.length > 0 && (
        <div className="overflow-x-auto rounded-md border border-line bg-paper">
          <div
            className={`${ROW} border-b border-line bg-canvas/60 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.07em] text-ink-3`}
          >
            <span>Code</span>
            <span>Company</span>
            <span>Prints on</span>
            <span />
          </div>

          <div className="divide-y divide-line-2">
            {companies.map((c) => (
              <details key={c.id} className="group">
                <summary
                  className={`${ROW} cursor-pointer list-none py-2.5 transition-colors hover:bg-canvas/60 [&::-webkit-details-marker]:hidden`}
                >
                  <CompanyLogo code={c.code} templateKey={c.templateKey} logoUrl={c.logoUrl} />
                  <span className="truncate text-[13px] font-medium">{c.name}</span>
                  <span className="truncate text-[12.5px] text-ink-2">{templateFor(c.templateKey).label}</span>
                  <span className="text-right text-[12px] text-ink-3">
                    <span className="group-open:hidden">Edit</span>
                    <span className="hidden group-open:inline">Close</span>
                  </span>
                </summary>
                <div className="border-t border-line-2 bg-canvas/40 p-4">
                  <CompanyForm company={c} />
                </div>
              </details>
            ))}
          </div>
        </div>
      )}

      <details className="group mt-4 overflow-hidden rounded-md border border-dashed border-line bg-paper">
        <summary className="cursor-pointer list-none px-3 py-2.5 text-[13px] font-medium text-ink-2 transition-colors hover:bg-canvas/60 [&::-webkit-details-marker]:hidden">
          <span className="group-open:hidden">Add a company</span>
          <span className="hidden group-open:inline">New company</span>
        </summary>
        <div className="border-t border-line-2 bg-canvas/40 p-4">
          <CompanyForm company={null} />
        </div>
      </details>

      {companies.length === 0 && (
        <div className="mt-4">
          <EmptyState>At least one company is required before a quotation can be created.</EmptyState>
        </div>
      )}
    </>
  );
}

type Company = Awaited<ReturnType<typeof prisma.company.findMany>>[number];

function CompanyForm({ company }: { company: Company | null }) {
  // Delete is its own form, so the two actions never share a submit. The save
  // button reaches back into the edit form by id — plain HTML, no nesting.
  const formId = company ? `company-${company.id}` : "company-new";

  // Capped: a field wider than the value it holds is harder to read, not easier.
  return (
    <div className="max-w-4xl space-y-3.5">
      <form id={formId} action={saveCompany} className="space-y-3.5">
        {company && <input type="hidden" name="id" value={company.id} />}

        <div className="grid gap-x-4 gap-y-3 sm:grid-cols-3">
          <Field label="Company name" name="name" required defaultValue={company?.name} className="sm:col-span-2" />
          <Field label="Code (quotation prefix)" name="code" required defaultValue={company?.code} placeholder="SAMS" />
        </div>

        <label className="block">
          <span className={fieldLabel}>Trade lines, as printed on the letterhead</span>
          <textarea
            name="tagline"
            rows={2}
            className={textareaClass}
            defaultValue={company?.tagline ?? ""}
            placeholder="Importers, Stockist & General Order Suppliers"
          />
          <span className="mt-1 block text-[11px] text-ink-3">One per line.</span>
        </label>

        <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
          <Field label="Address" name="address" defaultValue={company?.address} />
          <Field label="Phone" name="phone" defaultValue={company?.phone} />
          <Field label="Email" name="email" type="email" defaultValue={company?.email} />
          <Field label="NTN" name="ntn" defaultValue={company?.ntn} />
          <Field label="STRN" name="strn" defaultValue={company?.strn} />
          <Field label="GST number" name="gstNumber" defaultValue={company?.gstNumber} />
        </div>

        <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
          <label className="block">
            <span className={fieldLabel}>Logo file</span>
            <input
              name="logoUrl"
              className={inputClass}
              defaultValue={company?.logoUrl ?? undefined}
              placeholder="/logos/sams.png"
            />
            <span className="mt-1 block text-[11px] text-ink-3">The file must sit in the public folder.</span>
          </label>

          <label className="block">
            <span className={fieldLabel}>Quotation design</span>
            <select name="templateKey" className={inputClass} defaultValue={company?.templateKey ?? "sams"}>
              {TEMPLATE_KEYS.map((key) => (
                <option key={key} value={key}>
                  {TEMPLATES[key].label}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-[11px] leading-snug text-ink-3">
              {company ? templateFor(company.templateKey).note : "Every design can be previewed on the Designs page."}
            </span>
          </label>
        </div>
      </form>

      <div className="flex items-center justify-between gap-3 border-t border-line pt-3.5">
        {company ? (
          <form action={deleteCompany}>
            <input type="hidden" name="id" value={company.id} />
            <button className={btn.danger}>Delete company</button>
          </form>
        ) : (
          <span />
        )}
        <button form={formId} className={btn.primary}>
          {company ? "Save changes" : "Create company"}
        </button>
      </div>
    </div>
  );
}
