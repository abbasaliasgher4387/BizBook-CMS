// MISTRY STEEL — everything flush left, royal blue Helvetica-style name over a
// black rule, and a stacked NTN/STRN/contact block at the foot of the page.
import { money, qty, shortDate } from "@/lib/format";
import { inter } from "./fonts";
import { join, totalLines } from "./shared";
import type { TemplateProps } from "./types";

const BLUE = "#1F3D8F";

export default function Mistry({ doc }: TemplateProps) {
  const { company, customer, items } = doc;
  const totals = totalLines(doc);

  return (
    <div className={`${inter.className} flex w-[210mm] min-h-[297mm] print:min-h-0 flex-col bg-white px-[16mm] py-[12mm] text-[#111]`}>
      {/* ---- left-aligned letterhead ---- */}
      <header className="flex items-start gap-3">
        {company.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={company.logoUrl} alt={company.name} className="h-[18mm] w-auto" />
        ) : (
          <svg viewBox="0 0 40 34" className="h-[16mm] shrink-0" aria-hidden>
            <path d="M3 30 L3 6 L11 6 L17 18 L23 6 L31 6 L31 18" stroke={BLUE} strokeWidth="5" fill="none" />
            <path d="M31 12 c-8 0 -8 8 0 8 c8 0 8 9 -2 9" stroke={BLUE} strokeWidth="5" fill="none" />
            <line x1="36" y1="2" x2="6" y2="33" stroke={BLUE} strokeWidth="2" />
          </svg>
        )}
        <div className="min-w-0">
          <h1 className="text-[24pt] font-bold uppercase leading-none tracking-tight" style={{ color: BLUE }}>
            {company.name}
          </h1>
          {company.tagline && (
            <p className="mt-1 max-w-[120mm] border-y border-black py-[2px] text-[9pt] font-bold leading-snug">
              {company.tagline}
            </p>
          )}
        </div>
      </header>

      {/* ---- title, left aligned like the rest of the sheet ---- */}
      <div className="mt-8 flex items-end justify-between border-b-[3px] pb-1" style={{ borderColor: BLUE }}>
        <h2 className="text-[20pt] font-bold uppercase leading-none tracking-[0.15em]" style={{ color: BLUE }}>
          Quotation
        </h2>
        <p className="text-[11pt] font-bold">
          No. {company.code}-{doc.number}
        </p>
      </div>

      {/* ---- meta as label/value pairs in two columns ---- */}
      <section className="mt-5 grid grid-cols-2 gap-x-10 gap-y-1 text-[10pt]">
        <Line label="Date" value={shortDate(doc.date)} />
        <Line label="Valid Until" value={shortDate(doc.validUntil)} />
        {doc.poNumber && <Line label="P.O #" value={doc.poNumber} />}
        {doc.dcNumber && <Line label="DC #" value={doc.dcNumber} />}
      </section>

      <section className="mt-5 border-l-[3px] pl-3" style={{ borderColor: BLUE }}>
        <p className="text-[8.5pt] font-bold uppercase tracking-widest text-[#6b7280]">Buyer Name</p>
        <p className="text-[12.5pt] font-bold">{customer.name}</p>
        <p className="text-[9.5pt] text-[#404040]">
          {join([customer.contactPerson, customer.address, customer.phone, customer.email])}
        </p>
        {customer.ntn && <p className="text-[9.5pt] text-[#404040]">NTN No. : {customer.ntn}</p>}
      </section>

      {/* ---- items: horizontal rules only ---- */}
      <table className="mt-6 w-full border-collapse text-[10pt]">
        <thead>
          <tr className="border-y-2 border-black" style={{ backgroundColor: "#eef1f8" }}>
            <th className="w-[11mm] px-2 py-1.5 text-left text-[9pt] font-bold" style={{ color: BLUE }}>S.No</th>
            <th className="px-2 py-1.5 text-left text-[9pt] font-bold" style={{ color: BLUE }}>Particulars</th>
            <th className="w-[20mm] px-2 py-1.5 text-right text-[9pt] font-bold" style={{ color: BLUE }}>Qty</th>
            <th className="w-[18mm] px-2 py-1.5 text-center text-[9pt] font-bold" style={{ color: BLUE }}>Unit</th>
            <th className="w-[26mm] px-2 py-1.5 text-right text-[9pt] font-bold" style={{ color: BLUE }}>Rate</th>
            <th className="w-[30mm] px-2 py-1.5 text-right text-[9pt] font-bold" style={{ color: BLUE }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={i} className="break-inside-avoid border-b border-[#d6d6d6]">
              <td className="px-2 py-1.5">{i + 1}</td>
              <td className="px-2 py-1.5">{it.description}</td>
              <td className="px-2 py-1.5 text-right">{qty(it.quantity)}</td>
              <td className="px-2 py-1.5 text-center">{it.unit}</td>
              <td className="px-2 py-1.5 text-right">{money(it.rate)}</td>
              <td className="px-2 py-1.5 text-right font-semibold">{money(it.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ---- totals stay on the LEFT here, matching the left-aligned sheet ---- */}
      <div className="mt-4 break-inside-avoid">
        <table className="w-[80mm] text-[10pt]">
          <tbody>
            {totals.map((t) => (
              <tr key={t.label} className={t.strong ? "border-t-2 border-black" : ""}>
                <td className={`py-1 pr-6 ${t.strong ? "font-bold uppercase" : "text-[#4b5563]"}`}>{t.label}</td>
                <td
                  className={`py-1 text-right ${t.strong ? "text-[13pt] font-bold" : ""}`}
                  style={t.strong ? { color: BLUE } : undefined}
                >
                  {money(t.value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(doc.notes || doc.terms) && (
        <section className="mt-6 space-y-2 break-inside-avoid text-[9pt] text-[#404040]">
          {doc.notes && (
            <div>
              <p className="font-bold uppercase tracking-wider" style={{ color: BLUE }}>Notes</p>
              <p className="whitespace-pre-line">{doc.notes}</p>
            </div>
          )}
          {doc.terms && (
            <div>
              <p className="font-bold uppercase tracking-wider" style={{ color: BLUE }}>Terms &amp; Conditions</p>
              <p className="whitespace-pre-line">{doc.terms}</p>
            </div>
          )}
        </section>
      )}

      <div className="mt-16 break-inside-avoid">
        <div className="w-[62mm] border-t border-black pt-1 text-[9.5pt] font-bold">For {company.name}</div>
      </div>

      <footer className="mt-auto pt-8">
        <div className="mb-1.5 h-[2px] w-full bg-black" />
        <div className="text-[8.5pt] font-semibold leading-snug">
          {company.address && <p>{company.address}</p>}
          {company.ntn && <p>NTN No. : {company.ntn}</p>}
          {company.strn && <p>STRN No. : {company.strn}</p>}
          {company.phone && <p>Mobile : {company.phone}</p>}
          {company.email && <p>E-mail : {company.email}</p>}
        </div>
      </footer>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <p className="flex gap-2 border-b border-dotted border-[#c9c9c9] pb-0.5">
      <span className="w-[28mm] shrink-0 font-semibold text-[#6b7280]">{label}</span>
      <span className="font-semibold">{value}</span>
    </p>
  );
}
