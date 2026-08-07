// AL BURHAN TRADING CO. — teal arch mark over a centred small-caps serif name
// with a rule beneath, trade line in bold sans, and a three-line centred footer
// carrying NTN and GST. Ruled ledger-style table to match the formal feel.
import { money, qty, shortDate } from "@/lib/format";
import { inter, sourceSerif } from "./fonts";
import { join, totalLines } from "./shared";
import type { TemplateProps } from "./types";

const TEAL = "#1B6B63";
const NAVY = "#17325C";

export default function AlBurhan({ doc }: TemplateProps) {
  const { company, customer, items } = doc;
  const totals = totalLines(doc);

  return (
    <div className={`${inter.className} flex w-[210mm] min-h-[297mm] print:min-h-0 flex-col bg-white px-[16mm] py-[12mm] text-[#151515]`}>
      <header className="text-center">
        {company.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={company.logoUrl} alt={company.name} className="mx-auto h-[19mm] w-auto" />
        ) : (
          <svg viewBox="0 0 46 38" className="mx-auto h-[15mm]" aria-hidden>
            <path d="M23 1 L31 12 L15 12 Z" fill={TEAL} />
            <rect x="15" y="14" width="6" height="22" fill={TEAL} />
            <rect x="25" y="14" width="6" height="22" fill={NAVY} />
            <rect x="15" y="22" width="16" height="4" fill={TEAL} />
            <rect x="33" y="18" width="5" height="18" fill={TEAL} />
            <rect x="8" y="18" width="5" height="18" fill={NAVY} />
          </svg>
        )}
        <h1
          className="mt-1 inline-block border-b-2 pb-[2px] text-[23pt] leading-none tracking-[0.04em]"
          style={{ color: NAVY, borderColor: NAVY, fontFamily: sourceSerif.style.fontFamily, fontVariant: "small-caps" }}
        >
          {company.name}
        </h1>
        {company.tagline && (
          <p className="mx-auto mt-1.5 max-w-[130mm] text-[9pt] font-bold leading-snug" style={{ color: NAVY }}>
            {company.tagline}
          </p>
        )}
      </header>

      <div className="mt-4 flex items-center gap-2">
        <div className="h-px flex-1" style={{ backgroundColor: TEAL }} />
        <h2
          className="text-[14pt] uppercase tracking-[0.5em]"
          style={{ color: TEAL, fontFamily: sourceSerif.style.fontFamily }}
        >
          Quotation
        </h2>
        <div className="h-px flex-1" style={{ backgroundColor: TEAL }} />
      </div>

      {/* ---- buyer and document details as two ruled panels ---- */}
      <section className="mt-6 grid grid-cols-2 border text-[10pt]" style={{ borderColor: TEAL }}>
        <div className="border-r px-3 py-2" style={{ borderColor: TEAL }}>
          <p className="mb-1 text-[8pt] font-bold uppercase tracking-[0.2em]" style={{ color: TEAL }}>Buyer</p>
          <p className="text-[11.5pt] font-bold">{customer.name}</p>
          {customer.contactPerson && <p className="text-[#474747]">Attn: {customer.contactPerson}</p>}
          {customer.address && <p className="text-[#474747]">{customer.address}</p>}
          <p className="text-[#474747]">{join([customer.phone, customer.email])}</p>
          {customer.ntn && <p className="text-[#474747]">NTN No. : {customer.ntn}</p>}
          {customer.gstNumber && <p className="text-[#474747]">GST No. : {customer.gstNumber}</p>}
        </div>
        <div className="px-3 py-2">
          <p className="mb-1 text-[8pt] font-bold uppercase tracking-[0.2em]" style={{ color: TEAL }}>Details</p>
          <Pair label="Quotation #" value={`${company.code}-${doc.number}`} strong />
          <Pair label="Date" value={shortDate(doc.date)} />
          <Pair label="Valid Until" value={shortDate(doc.validUntil)} />
          {doc.poNumber && <Pair label="PO #" value={doc.poNumber} />}
          {doc.dcNumber && <Pair label="DC #" value={doc.dcNumber} />}
        </div>
      </section>

      {/* ---- full ledger grid ---- */}
      <table className="mt-6 w-full border-collapse text-[10pt]">
        <thead>
          <tr style={{ backgroundColor: NAVY, color: "#fff" }}>
            <th className="w-[11mm] border px-2 py-1.5 text-center text-[9pt]" style={{ borderColor: NAVY }}>S.No</th>
            <th className="border px-2 py-1.5 text-left text-[9pt]" style={{ borderColor: NAVY }}>Description of Goods</th>
            <th className="w-[20mm] border px-2 py-1.5 text-right text-[9pt]" style={{ borderColor: NAVY }}>Qty</th>
            <th className="w-[18mm] border px-2 py-1.5 text-center text-[9pt]" style={{ borderColor: NAVY }}>Unit</th>
            <th className="w-[26mm] border px-2 py-1.5 text-right text-[9pt]" style={{ borderColor: NAVY }}>Rate</th>
            <th className="w-[30mm] border px-2 py-1.5 text-right text-[9pt]" style={{ borderColor: NAVY }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={i} className="break-inside-avoid">
              <td className="border border-[#b9d3d0] px-2 py-1 text-center">{i + 1}</td>
              <td className="border border-[#b9d3d0] px-2 py-1">{it.description}</td>
              <td className="border border-[#b9d3d0] px-2 py-1 text-right">{qty(it.quantity)}</td>
              <td className="border border-[#b9d3d0] px-2 py-1 text-center">{it.unit}</td>
              <td className="border border-[#b9d3d0] px-2 py-1 text-right">{money(it.rate)}</td>
              <td className="border border-[#b9d3d0] px-2 py-1 text-right">{money(it.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-3 flex justify-end break-inside-avoid">
        <table className="w-[78mm] border-collapse text-[10pt]">
          <tbody>
            {totals.map((t) => (
              <tr key={t.label} style={t.strong ? { backgroundColor: "#eef6f5" } : undefined}>
                <td
                  className={`border px-2 py-1 text-right ${t.strong ? "font-bold uppercase tracking-wide" : "text-[#555]"}`}
                  style={{ borderColor: "#b9d3d0" }}
                >
                  {t.label}
                </td>
                <td
                  className={`border px-2 py-1 text-right ${t.strong ? "text-[12pt] font-bold" : ""}`}
                  style={{ borderColor: "#b9d3d0", color: t.strong ? NAVY : undefined }}
                >
                  {money(t.value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(doc.notes || doc.terms) && (
        <section className="mt-6 space-y-2 break-inside-avoid text-[9pt] text-[#474747]">
          {doc.notes && (
            <div>
              <p className="font-bold" style={{ color: TEAL }}>Notes</p>
              <p className="whitespace-pre-line">{doc.notes}</p>
            </div>
          )}
          {doc.terms && (
            <div>
              <p className="font-bold" style={{ color: TEAL }}>Terms &amp; Conditions</p>
              <p className="whitespace-pre-line">{doc.terms}</p>
            </div>
          )}
        </section>
      )}

      <div className="mt-16 flex justify-end break-inside-avoid">
        <div
          className="w-[64mm] border-t pt-1 text-center text-[10pt]"
          style={{ borderColor: NAVY, color: NAVY, fontFamily: sourceSerif.style.fontFamily }}
        >
          For {company.name}
        </div>
      </div>

      <footer className="mt-auto pt-8 text-center">
        <div className="mx-auto mb-1 h-[2px] w-[120mm]" style={{ backgroundColor: NAVY }} />
        <p className="text-[8.5pt] font-semibold">{company.address}</p>
        <p className="text-[8.5pt] font-semibold">
          {join([company.phone && `Mobile : ${company.phone}`, company.email && `Email : ${company.email}`], ", ")}
        </p>
        <p className="text-[8.5pt] font-semibold">
          {join([company.ntn && `NTN No. : ${company.ntn}`, company.gstNumber && `GST No. ${company.gstNumber}`], ", ")}
        </p>
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
