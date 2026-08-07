// M.B. INDUSTRIAL SOLUTION — the letterhead is built from two angled bands: a
// teal wedge into grey at the top, the mirror of it at the foot carrying every
// contact detail. Logo and name sit together on one centred line, trade lines
// beneath a rule. Body is left-aligned with a teal table head and no vertical
// rules, which keeps it clearly apart from Bizway's centred green sheet.
import { money, qty, shortDate } from "@/lib/format";
import { plexSans } from "./fonts";
import { join, totalLines } from "./shared";
import type { TemplateProps } from "./types";

const TEAL = "#1B7C8C";
const BAND = "#D5DBDD";

export default function Mbis({ doc }: TemplateProps) {
  const { company, customer, items } = doc;
  const totals = totalLines(doc);

  return (
    <div
      className={`${plexSans.className} flex w-[210mm] min-h-[297mm] print:min-h-0 flex-col bg-white text-[#141414]`}
    >
      {/* ---- top band: teal wedge running into grey ---- */}
      <div className="flex h-[6mm] items-stretch">
        <div className="w-[26%]" style={{ backgroundColor: TEAL, clipPath: "polygon(0 0, 100% 0, 82% 100%, 0 100%)" }} />
        <div className="flex-1" style={{ backgroundColor: BAND }} />
      </div>

      <div className="flex flex-1 flex-col px-[16mm] pb-[6mm] pt-[8mm]">
        <header className="text-center">
          <div className="flex items-center justify-center gap-3">
            {company.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={company.logoUrl} alt={company.name} className="h-[15mm] w-auto" />
            ) : (
              <svg viewBox="0 0 84 46" className="h-[13mm]" aria-hidden>
                <g transform="skewX(-8) translate(6 0)">
                  <path d="M0 44V2h9.5L21 21 32.5 2H42v42H32.5V19L21 36 9.5 19v25z" fill={TEAL} />
                  <rect x="46" y="2" width="5" height="42" fill={TEAL} />
                  <path d="M51 4.5h7.5a9 9 0 0 1 0 18H51" fill="none" stroke={TEAL} strokeWidth="5" />
                  <path d="M51 23.5h8.5a10 10 0 0 1 0 20H51" fill="none" stroke={TEAL} strokeWidth="5" />
                </g>
              </svg>
            )}
            <h1 className="text-[24pt] font-bold leading-none tracking-tight">{company.name}</h1>
          </div>

          <div className="mx-auto mt-2 h-px w-[135mm]" style={{ backgroundColor: "#3d3d3d" }} />

          {company.tagline && (
            <p className="mx-auto mt-2 max-w-[150mm] text-[8.5pt] font-semibold leading-snug">{company.tagline}</p>
          )}
        </header>

        {/* ---- title, left aligned over a long teal rule ---- */}
        <div className="mt-8">
          <h2 className="text-[15pt] font-bold uppercase tracking-[0.3em]" style={{ color: TEAL }}>
            Quotation
          </h2>
          <div className="mt-1 h-[3px] w-full" style={{ backgroundColor: TEAL }} />
        </div>

        {/* ---- buyer left, document details right ---- */}
        <section className="mt-5 flex items-start justify-between gap-8 text-[10pt]">
          <div className="max-w-[95mm]">
            <p className="mb-1 text-[8pt] font-semibold uppercase tracking-[0.2em]" style={{ color: TEAL }}>
              Quotation To
            </p>
            <p className="text-[12pt] font-bold">{customer.name}</p>
            {customer.contactPerson && <p className="text-[#4c4c4c]">Attn: {customer.contactPerson}</p>}
            {customer.address && <p className="text-[#4c4c4c]">{customer.address}</p>}
            <p className="text-[#4c4c4c]">{join([customer.phone, customer.email])}</p>
            {customer.ntn && <p className="text-[#4c4c4c]">NTN: {customer.ntn}</p>}
          </div>

          <table className="text-[9.5pt]">
            <tbody>
              <Row label="Quotation #" value={`${company.code}-${doc.number}`} strong />
              <Row label="Date" value={shortDate(doc.date)} />
              <Row label="Valid Until" value={shortDate(doc.validUntil)} />
              {doc.poNumber && <Row label="PO #" value={doc.poNumber} />}
              {doc.dcNumber && <Row label="DC #" value={doc.dcNumber} />}
            </tbody>
          </table>
        </section>

        {/* ---- items: teal head, horizontal rules only ---- */}
        <table className="mt-6 w-full border-collapse text-[10pt]">
          <thead>
            <tr style={{ backgroundColor: TEAL, color: "#fff" }}>
              <th className="w-[11mm] px-2 py-2 text-center text-[8.5pt] font-semibold uppercase tracking-wider">
                S.No
              </th>
              <th className="px-2 py-2 text-left text-[8.5pt] font-semibold uppercase tracking-wider">Description</th>
              <th className="w-[20mm] px-2 py-2 text-right text-[8.5pt] font-semibold uppercase tracking-wider">Qty</th>
              <th className="w-[18mm] px-2 py-2 text-center text-[8.5pt] font-semibold uppercase tracking-wider">
                Unit
              </th>
              <th className="w-[26mm] px-2 py-2 text-right text-[8.5pt] font-semibold uppercase tracking-wider">Rate</th>
              <th className="w-[30mm] px-2 py-2 text-right text-[8.5pt] font-semibold uppercase tracking-wider">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i} className="break-inside-avoid border-b border-[#dfe4e5]">
                <td className="px-2 py-1.5 text-center text-[#6e7577]">{i + 1}</td>
                <td className="px-2 py-1.5">{it.description}</td>
                <td className="px-2 py-1.5 text-right">{qty(it.quantity)}</td>
                <td className="px-2 py-1.5 text-center text-[#6e7577]">{it.unit}</td>
                <td className="px-2 py-1.5 text-right">{money(it.rate)}</td>
                <td className="px-2 py-1.5 text-right font-semibold">{money(it.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 flex justify-end break-inside-avoid">
          <div className="w-[80mm] text-[10pt]">
            {totals.map((t) => (
              <div
                key={t.label}
                className={`flex justify-between px-3 py-1.5 ${
                  t.strong ? "mt-1 text-white" : "border-b border-[#dfe4e5]"
                }`}
                style={t.strong ? { backgroundColor: TEAL } : undefined}
              >
                <span className={t.strong ? "font-bold uppercase tracking-wider" : "text-[#5c6365]"}>{t.label}</span>
                <span className={t.strong ? "text-[12pt] font-bold" : ""}>{money(t.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {(doc.notes || doc.terms) && (
          <section className="mt-6 grid grid-cols-2 gap-6 break-inside-avoid text-[9pt] text-[#4c4c4c]">
            {doc.notes && (
              <div>
                <p className="font-semibold uppercase tracking-wider" style={{ color: TEAL }}>
                  Notes
                </p>
                <p className="whitespace-pre-line">{doc.notes}</p>
              </div>
            )}
            {doc.terms && (
              <div>
                <p className="font-semibold uppercase tracking-wider" style={{ color: TEAL }}>
                  Terms
                </p>
                <p className="whitespace-pre-line">{doc.terms}</p>
              </div>
            )}
          </section>
        )}

        <div className="mt-14 flex justify-end break-inside-avoid">
          <div className="w-[62mm] border-t pt-1 text-center text-[9.5pt] font-semibold" style={{ borderColor: TEAL }}>
            For {company.name}
          </div>
        </div>
      </div>

      {/* ---- foot band mirrors the head, and carries the contact block ---- */}
      <footer className="mt-auto flex items-stretch">
        <div className="w-[16mm]" style={{ backgroundColor: TEAL, clipPath: "polygon(0 0, 100% 0, 58% 100%, 0 100%)" }} />
        <div className="flex-1 px-4 py-2 text-center text-[8.5pt] font-semibold" style={{ backgroundColor: BAND }}>
          {company.address && <p>{company.address}</p>}
          <p>
            {join(
              [
                company.email,
                company.ntn && `NTN No. ${company.ntn}`,
                company.gstNumber && `GST No. ${company.gstNumber}`,
                company.phone,
              ],
              "   ",
            )}
          </p>
        </div>
        <div
          className="w-[16mm]"
          style={{ backgroundColor: TEAL, clipPath: "polygon(42% 0, 100% 0, 100% 100%, 0 100%)" }}
        />
      </footer>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <tr>
      <td className="pr-4 text-[#6e7577]">{label}</td>
      <td className={`text-right ${strong ? "font-bold" : "font-medium"}`}>{value}</td>
    </tr>
  );
}
