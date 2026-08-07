// AL MUFADDAL ENTERPRISES — bright blue diamond "AME" mark on the left, name
// underlined, dense trade lines beside it. Their bill's totals read
// Total -> Cartage -> G-Total Amount, so the labels are overridden below.
import { money, qty, shortDate } from "@/lib/format";
import { inter, poppins } from "./fonts";
import { join, totalLines } from "./shared";
import type { TemplateProps } from "./types";

const BLUE = "#1B7FD0";
const DEEP = "#0F4C81";

export default function AlMufaddal({ doc }: TemplateProps) {
  const { company, customer, items } = doc;
  // No Sub Total row on their sheet: "Total" is the items sum, then Cartage,
  // then "G-Total Amount". totalLines() drops the first row when GST is 0.
  const totals = totalLines(doc, { sub: "Total", total: "G-Total Amount" });

  return (
    <div className={`${inter.className} flex w-[210mm] min-h-[297mm] print:min-h-0 flex-col bg-white px-[16mm] py-[12mm] text-[#141414]`}>
      <header className="flex items-start gap-3">
        {company.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={company.logoUrl} alt={company.name} className="h-[18mm] w-auto" />
        ) : (
          <svg viewBox="0 0 54 40" className="h-[16mm] shrink-0" aria-hidden>
            <path d="M27 2 L52 20 L27 38 L2 20 Z" fill={BLUE} />
            <path d="M27 7 L46 20 L27 33 L8 20 Z" fill="#fff" opacity="0.15" />
            <text x="27" y="26" textAnchor="middle" fontSize="14" fontWeight="700" fill="#fff" fontFamily="Arial, sans-serif">
              AME
            </text>
          </svg>
        )}
        <div className="min-w-0">
          <h1
            className="border-b-2 pb-[2px] text-[22pt] font-medium leading-none"
            style={{ color: BLUE, borderColor: BLUE, fontFamily: poppins.style.fontFamily }}
          >
            {company.name}
          </h1>
          {company.tagline && (
            <p className="mt-1 max-w-[125mm] text-[8.5pt] font-bold leading-snug">{company.tagline}</p>
          )}
          <p className="text-[8.5pt] font-bold leading-snug">
            {join(
              [
                company.email && `Email : ${company.email}`,
                company.phone && `Mobile : ${company.phone}`,
                company.ntn && `NTN No.${company.ntn}`,
              ],
              ", ",
            )}
          </p>
        </div>
      </header>

      {/* ---- title bar ---- */}
      <div className="mt-7 flex items-center justify-between px-4 py-2 text-white" style={{ backgroundColor: DEEP }}>
        <h2 className="text-[15pt] font-semibold uppercase tracking-[0.25em]" style={{ fontFamily: poppins.style.fontFamily }}>
          Quotation
        </h2>
        <p className="text-[12pt] font-semibold">
          {company.code}-{doc.number}
        </p>
      </div>

      {/* ---- Name / Address / Date / PO / DC stacked, like their sheet ---- */}
      <section className="mt-4 text-[10pt]">
        <Row label="Name" value={customer.name} strong />
        <Row label="Address" value={join([customer.address, customer.phone, customer.email]) || "—"} />
        <Row label="Date" value={shortDate(doc.date)} />
        <Row label="Valid Until" value={shortDate(doc.validUntil)} />
        {doc.poNumber && <Row label="PO No." value={doc.poNumber} />}
        {doc.dcNumber && <Row label="DC #" value={doc.dcNumber} />}
      </section>

      <table className="mt-5 w-full border-collapse text-[10pt]">
        <thead>
          <tr style={{ backgroundColor: "#e8f2fb", color: DEEP }}>
            <th className="w-[11mm] border px-2 py-1.5 text-center text-[9pt] font-bold" style={{ borderColor: BLUE }}>S.No</th>
            <th className="border px-2 py-1.5 text-left text-[9pt] font-bold" style={{ borderColor: BLUE }}>Particulars</th>
            <th className="w-[20mm] border px-2 py-1.5 text-right text-[9pt] font-bold" style={{ borderColor: BLUE }}>Qty</th>
            <th className="w-[18mm] border px-2 py-1.5 text-center text-[9pt] font-bold" style={{ borderColor: BLUE }}>Unit</th>
            <th className="w-[26mm] border px-2 py-1.5 text-right text-[9pt] font-bold" style={{ borderColor: BLUE }}>Rate</th>
            <th className="w-[30mm] border px-2 py-1.5 text-right text-[9pt] font-bold" style={{ borderColor: BLUE }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={i} className="break-inside-avoid">
              <td className="border border-[#bcd9f0] px-2 py-1 text-center">{i + 1}</td>
              <td className="border border-[#bcd9f0] px-2 py-1">{it.description}</td>
              <td className="border border-[#bcd9f0] px-2 py-1 text-right">{qty(it.quantity)}</td>
              <td className="border border-[#bcd9f0] px-2 py-1 text-center">{it.unit}</td>
              <td className="border border-[#bcd9f0] px-2 py-1 text-right">{money(it.rate)}</td>
              <td className="border border-[#bcd9f0] px-2 py-1 text-right">{money(it.amount)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          {totals.map((t) => (
            <tr key={t.label}>
              <td
                colSpan={5}
                className={`border px-2 py-1 text-right ${t.strong ? "font-bold uppercase" : ""}`}
                style={{ borderColor: "#bcd9f0", backgroundColor: t.strong ? "#e8f2fb" : undefined }}
              >
                {t.label}
              </td>
              <td
                className={`border px-2 py-1 text-right ${t.strong ? "text-[12pt] font-bold" : ""}`}
                style={{
                  borderColor: "#bcd9f0",
                  backgroundColor: t.strong ? "#e8f2fb" : undefined,
                  color: t.strong ? DEEP : undefined,
                }}
              >
                {money(t.value)}
              </td>
            </tr>
          ))}
        </tfoot>
      </table>

      {(doc.notes || doc.terms) && (
        <section className="mt-6 space-y-2 break-inside-avoid text-[9pt] text-[#3f3f3f]">
          {doc.notes && (
            <div>
              <p className="font-bold" style={{ color: DEEP }}>Notes</p>
              <p className="whitespace-pre-line">{doc.notes}</p>
            </div>
          )}
          {doc.terms && (
            <div>
              <p className="font-bold" style={{ color: DEEP }}>Terms &amp; Conditions</p>
              <p className="whitespace-pre-line">{doc.terms}</p>
            </div>
          )}
        </section>
      )}

      {/* ---- their sheet signs off centred ---- */}
      <div className="mt-16 flex justify-center break-inside-avoid">
        <div className="w-[70mm] border-t-2 pt-1 text-center text-[10pt] font-semibold" style={{ borderColor: BLUE }}>
          {company.name}
        </div>
      </div>

      <footer className="mt-auto pt-8 text-center">
        <div className="mx-auto mb-1 h-[2px] w-[110mm] bg-black" />
        <p className="text-[9pt] font-semibold">{company.address}</p>
      </footer>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <p className="flex gap-2 border-b border-[#e5e7eb] py-[3px]">
      <span className="w-[26mm] shrink-0 font-semibold text-[#6b7280]">{label} :</span>
      <span className={strong ? "text-[11.5pt] font-bold" : ""}>{value}</span>
    </p>
  );
}
