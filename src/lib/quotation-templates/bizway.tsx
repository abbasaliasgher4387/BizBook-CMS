// BIZWAY ENTERPRISE — their letterhead is fully centred: green "BE" mark, heavy
// condensed name, a wrapped trade line, and a centred address block at the foot.
import { money, qty, shortDate } from "@/lib/format";
import { inter, montserrat } from "./fonts";
import { join, totalLines } from "./shared";
import type { TemplateProps } from "./types";

const GREEN = "#4E9A2F";
const CHARCOAL = "#2F3437";

export default function Bizway({ doc }: TemplateProps) {
  const { company, customer, items } = doc;
  const totals = totalLines(doc);

  return (
    <div className={`${inter.className} flex w-[210mm] min-h-[297mm] print:min-h-0 flex-col bg-white px-[16mm] py-[12mm] text-[#1f2326]`}>
      {/* ---- centred letterhead ---- */}
      <header className="text-center">
        {company.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={company.logoUrl} alt={company.name} className="mx-auto h-[20mm] w-auto" />
        ) : (
          <svg viewBox="0 0 60 34" className="mx-auto h-[16mm]" aria-hidden>
            <rect x="4" y="2" width="9" height="30" fill={GREEN} />
            <rect x="15" y="2" width="24" height="7" fill={CHARCOAL} />
            <rect x="15" y="13" width="18" height="7" fill={GREEN} />
            <rect x="15" y="24" width="24" height="7" fill={CHARCOAL} />
            <rect x="43" y="2" width="13" height="7" fill={GREEN} />
            <rect x="43" y="24" width="13" height="7" fill={GREEN} />
          </svg>
        )}
        <h1
          className="mt-1 text-[27pt] font-extrabold uppercase leading-none"
          style={{ color: CHARCOAL, fontFamily: montserrat.style.fontFamily }}
        >
          {company.name}
        </h1>
        {company.tagline && (
          <p className="mx-auto mt-1.5 max-w-[150mm] text-[8.5pt] font-semibold leading-snug" style={{ color: CHARCOAL }}>
            {company.tagline}
          </p>
        )}
      </header>

      <div className="mt-4 h-[3px] w-full" style={{ backgroundColor: GREEN }} />

      {/* ---- title band ---- */}
      <div className="mt-6 text-center">
        <span
          className="inline-block px-8 py-1.5 text-[14pt] font-extrabold uppercase tracking-[0.35em] text-white"
          style={{ backgroundColor: GREEN, fontFamily: montserrat.style.fontFamily }}
        >
          Quotation
        </span>
      </div>

      {/* ---- buyer on the left, the document's own details boxed on the right.
             Two panels side by side rather than a stack: this is what keeps the
             sheet from reading like the other designs at a glance. ---- */}
      <section className="mt-5 grid grid-cols-[1fr_74mm] items-start gap-5 break-inside-avoid">
        <div className="border border-[#dbe3d5]">
          <p
            className="px-3 py-1 text-[8pt] font-bold uppercase tracking-[0.2em] text-white"
            style={{ backgroundColor: CHARCOAL, fontFamily: montserrat.style.fontFamily }}
          >
            Buyer
          </p>
          <div className="bg-[#f4faf0] px-3 py-2">
            <p className="text-[12.5pt] font-bold leading-tight">{customer.name}</p>
            <p className="mt-0.5 text-[9.5pt] leading-snug text-[#4a5155]">
              {join([customer.contactPerson, customer.address, customer.phone, customer.email])}
            </p>
            {customer.ntn && <p className="text-[9.5pt] text-[#4a5155]">NTN: {customer.ntn}</p>}
          </div>
        </div>

        <table className="w-full border-collapse text-[9.5pt]">
          <tbody>
            <Meta label="Quotation #" value={`${company.code}-${doc.number}`} accent />
            <Meta label="Date" value={shortDate(doc.date)} />
            <Meta label="Valid Until" value={shortDate(doc.validUntil)} />
            {doc.poNumber && <Meta label="PO #" value={doc.poNumber} />}
            {doc.dcNumber && <Meta label="DC #" value={doc.dcNumber} />}
          </tbody>
        </table>
      </section>

      {/* ---- items: dark header, zebra rows, no vertical rules ---- */}
      <table className="mt-6 w-full border-collapse text-[10pt]">
        <thead>
          <tr style={{ backgroundColor: CHARCOAL, color: "#fff", fontFamily: montserrat.style.fontFamily }}>
            <th className="w-[11mm] px-2 py-2 text-center text-[8.5pt] font-bold uppercase tracking-wider">S.No</th>
            <th className="px-2 py-2 text-left text-[8.5pt] font-bold uppercase tracking-wider">Description</th>
            <th className="w-[20mm] px-2 py-2 text-right text-[8.5pt] font-bold uppercase tracking-wider">Qty</th>
            <th className="w-[18mm] px-2 py-2 text-center text-[8.5pt] font-bold uppercase tracking-wider">Unit</th>
            <th className="w-[26mm] px-2 py-2 text-right text-[8.5pt] font-bold uppercase tracking-wider">Rate</th>
            <th className="w-[30mm] px-2 py-2 text-right text-[8.5pt] font-bold uppercase tracking-wider">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={i} className={`break-inside-avoid ${i % 2 ? "bg-[#f6f8f5]" : ""}`}>
              <td className="px-2 py-1.5 text-center text-[#6b7276]">{i + 1}</td>
              <td className="px-2 py-1.5">{it.description}</td>
              <td className="px-2 py-1.5 text-right">{qty(it.quantity)}</td>
              <td className="px-2 py-1.5 text-center text-[#6b7276]">{it.unit}</td>
              <td className="px-2 py-1.5 text-right">{money(it.rate)}</td>
              <td className="px-2 py-1.5 text-right font-semibold">{money(it.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="h-[2px] w-full" style={{ backgroundColor: GREEN }} />

      {/* ---- the lower half reads across, not down: what the buyer should know
             on the left, what they owe on the right, both starting at the same
             line. The signature then closes the right column. ---- */}
      <div className="mt-4 grid grid-cols-[1fr_80mm] items-start gap-6 break-inside-avoid">
        <div className="space-y-2 text-[9pt] text-[#4a5155]">
          {doc.notes && (
            <div>
              <p className="font-bold uppercase tracking-wider" style={{ color: GREEN }}>Notes</p>
              <p className="whitespace-pre-line">{doc.notes}</p>
            </div>
          )}
          {doc.terms && (
            <div>
              <p className="font-bold uppercase tracking-wider" style={{ color: GREEN }}>Terms</p>
              <p className="whitespace-pre-line">{doc.terms}</p>
            </div>
          )}
        </div>

        <div>
          <div className="border border-[#dbe3d5] text-[10pt]">
            {totals.map((t) => (
              <div
                key={t.label}
                className={`flex justify-between px-3 py-1.5 ${t.strong ? "text-white" : "border-b border-[#e3e8e0]"}`}
                style={t.strong ? { backgroundColor: GREEN } : undefined}
              >
                <span
                  className={t.strong ? "font-bold uppercase tracking-wider" : "text-[#5a6165]"}
                  style={t.strong ? { fontFamily: montserrat.style.fontFamily } : undefined}
                >
                  {t.label}
                </span>
                <span className={t.strong ? "text-[12pt] font-extrabold" : ""}>{money(t.value)}</span>
              </div>
            ))}
          </div>

          <div
            className="mt-16 border-t-2 pt-1 text-center text-[9.5pt] font-bold"
            style={{ borderColor: CHARCOAL }}
          >
            For {company.name}
          </div>
        </div>
      </div>

      <footer className="mt-auto pt-8 text-center">
        <div className="mb-1 h-[2px] w-full" style={{ backgroundColor: CHARCOAL }} />
        <p className="text-[8.5pt] font-semibold" style={{ color: CHARCOAL }}>
          {join([company.address && `Address : ${company.address}`, company.ntn && `NTN # : ${company.ntn}`], "  ")}
        </p>
        <p className="text-[8.5pt] font-semibold" style={{ color: CHARCOAL }}>
          {join([company.phone && `Mobile : ${company.phone}`, company.email && `Email : ${company.email}`], ", ")}
        </p>
      </footer>
    </div>
  );
}

/** One row of the boxed detail table: tinted label cell, plain value cell. */
function Meta({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <tr>
      <td className="w-[26mm] border border-[#dbe3d5] bg-[#f4faf0] px-2 py-1 font-semibold text-[#5a6165]">
        {label}
      </td>
      <td
        className={`border border-[#dbe3d5] px-2 py-1 font-bold ${accent ? "text-[10.5pt]" : ""}`}
        style={accent ? { color: GREEN } : undefined}
      >
        {value}
      </td>
    </tr>
  );
}
