// TAHERI SUPPLY AGENCY — centred brown-and-gold serif letterhead with the "SA"
// shield and an underlined trade line. Their bill puts Qty in the first column
// and signs off bottom-left, so this one does too.
import { money, qty, shortDate } from "@/lib/format";
import { inter, merriweather } from "./fonts";
import { join, totalLines } from "./shared";
import type { TemplateProps } from "./types";

const BROWN = "#5B2318";
const GOLD = "#C08A2A";

export default function Taheri({ doc }: TemplateProps) {
  const { company, customer, items } = doc;
  const totals = totalLines(doc);

  return (
    <div className={`${inter.className} flex w-[210mm] min-h-[297mm] print:min-h-0 flex-col bg-white px-[16mm] py-[12mm] text-[#1a1a1a]`}>
      {/* ---- centred letterhead ---- */}
      <header className="text-center">
        {company.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={company.logoUrl} alt={company.name} className="mx-auto h-[18mm] w-auto" />
        ) : (
          <svg viewBox="0 0 44 34" className="mx-auto h-[14mm]" aria-hidden>
            <path d="M22 1 L41 1 L41 22 Q41 31 22 33 Q3 31 3 22 L3 1 Z" fill={BROWN} />
            <text x="14" y="24" fontSize="18" fontWeight="700" fill={GOLD} fontFamily="Georgia, serif">S</text>
            <text x="25" y="24" fontSize="18" fontWeight="700" fill="#fff" fontFamily="Georgia, serif">A</text>
          </svg>
        )}
        <h1
          className="mt-1 text-[26pt] font-bold leading-none"
          style={{ color: BROWN, fontFamily: merriweather.style.fontFamily }}
        >
          {company.name}
        </h1>
        {company.tagline && (
          <p className="mt-1 inline-block border-y-2 px-3 py-[2px] text-[9pt] font-bold" style={{ borderColor: BROWN }}>
            {company.tagline}
          </p>
        )}
        <p className="mt-1 text-[8.5pt] font-medium text-[#3b3b3b]">
          {join([company.address, company.phone && `Tel : ${company.phone}`], ". ")}
        </p>
        <p className="text-[8.5pt] font-medium text-[#3b3b3b]">
          {join([company.email && `Email : ${company.email}`, company.ntn && `NTN No. ${company.ntn}`], ", ")}
        </p>
      </header>

      <div className="mt-3 h-[3px] w-full" style={{ backgroundColor: GOLD }} />

      <h2
        className="mt-7 text-center text-[16pt] font-bold uppercase tracking-[0.45em]"
        style={{ color: BROWN, fontFamily: merriweather.style.fontFamily }}
      >
        Quotation
      </h2>

      {/* ---- meta strip, buyer underneath: their bill's order ---- */}
      <div className="mt-5 grid grid-cols-2 border-y-2 text-[10pt]" style={{ borderColor: BROWN }}>
        <div className="space-y-0.5 border-r px-3 py-2" style={{ borderColor: "#e0cfae" }}>
          <Pair label="Quotation #" value={`${company.code}-${doc.number}`} strong />
          <Pair label="Date" value={shortDate(doc.date)} />
          <Pair label="Valid Until" value={shortDate(doc.validUntil)} />
        </div>
        <div className="space-y-0.5 px-3 py-2">
          {doc.poNumber && <Pair label="PO #" value={doc.poNumber} />}
          {doc.dcNumber && <Pair label="DC #" value={doc.dcNumber} />}
          <Pair label="Tel #" value={customer.phone ?? "—"} />
        </div>
      </div>

      <section className="mt-4 text-[10pt]">
        <p className="text-[8.5pt] font-bold uppercase tracking-widest" style={{ color: GOLD }}>Buyer</p>
        <p className="text-[12.5pt] font-bold">{customer.name}</p>
        <p className="text-[#454545]">{join([customer.contactPerson, customer.address, customer.email])}</p>
        {customer.ntn && <p className="text-[#454545]">NTN: {customer.ntn}</p>}
      </section>

      {/* ---- items: Qty first, exactly like their sheet ---- */}
      <table className="mt-5 w-full border-collapse text-[10pt]">
        <thead>
          <tr style={{ backgroundColor: BROWN, color: "#fff" }}>
            <th className="w-[20mm] border px-2 py-1.5 text-right text-[9pt] font-bold" style={{ borderColor: BROWN }}>Qty</th>
            <th className="w-[18mm] border px-2 py-1.5 text-center text-[9pt] font-bold" style={{ borderColor: BROWN }}>Unit</th>
            <th className="border px-2 py-1.5 text-left text-[9pt] font-bold" style={{ borderColor: BROWN }}>Description</th>
            <th className="w-[26mm] border px-2 py-1.5 text-right text-[9pt] font-bold" style={{ borderColor: BROWN }}>Rate</th>
            <th className="w-[30mm] border px-2 py-1.5 text-right text-[9pt] font-bold" style={{ borderColor: BROWN }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={i} className="break-inside-avoid">
              <td className="border border-[#e0cfae] px-2 py-1 text-right">{qty(it.quantity)}</td>
              <td className="border border-[#e0cfae] px-2 py-1 text-center">{it.unit}</td>
              <td className="border border-[#e0cfae] px-2 py-1">{it.description}</td>
              <td className="border border-[#e0cfae] px-2 py-1 text-right">{money(it.rate)}</td>
              <td className="border border-[#e0cfae] px-2 py-1 text-right">{money(it.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-3 flex justify-end break-inside-avoid">
        <table className="w-[76mm] text-[10pt]">
          <tbody>
            {totals.map((t) => (
              <tr key={t.label}>
                <td
                  className={`border-b px-2 py-1 text-right ${t.strong ? "font-bold uppercase tracking-wider" : "text-[#5a5a5a]"}`}
                  style={{ borderColor: t.strong ? BROWN : "#e0cfae" }}
                >
                  {t.label}
                </td>
                <td
                  className={`border-b px-2 py-1 text-right ${t.strong ? "text-[12.5pt] font-bold" : ""}`}
                  style={{ borderColor: t.strong ? BROWN : "#e0cfae", color: t.strong ? BROWN : undefined }}
                >
                  {money(t.value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(doc.notes || doc.terms) && (
        <section className="mt-6 space-y-2 break-inside-avoid text-[9pt] text-[#454545]">
          {doc.notes && (
            <div>
              <p className="font-bold" style={{ color: BROWN }}>Notes</p>
              <p className="whitespace-pre-line">{doc.notes}</p>
            </div>
          )}
          {doc.terms && (
            <div>
              <p className="font-bold" style={{ color: BROWN }}>Terms &amp; Conditions</p>
              <p className="whitespace-pre-line">{doc.terms}</p>
            </div>
          )}
        </section>
      )}

      {/* ---- their sheet signs off bottom-LEFT ---- */}
      <div className="mt-16 break-inside-avoid">
        <div className="w-[70mm] border-t-2 pt-1 text-[10pt] font-bold" style={{ borderColor: BROWN, color: BROWN }}>
          For {company.name}
        </div>
      </div>

      <footer className="mt-auto pt-6">
        <div className="h-[3px] w-full" style={{ backgroundColor: GOLD }} />
      </footer>
    </div>
  );
}

function Pair({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <p className="flex gap-2">
      <span className="w-[26mm] shrink-0 text-[#6b6b6b]">{label}</span>
      <span className={strong ? "font-bold" : "font-medium"}>{value}</span>
    </p>
  );
}
