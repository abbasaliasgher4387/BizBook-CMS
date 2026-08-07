// SAMS TRADERS — rebuilt from their letterhead: maroon + gold wordmark on the
// left, italic serif trade lines right-aligned, address rule across the foot.
import { money, qty, shortDate } from "@/lib/format";
import { lora, playfair } from "./fonts";
import { join, totalLines } from "./shared";
import type { TemplateProps } from "./types";

const MAROON = "#7B1E2B";
const GOLD = "#B8912F";

export default function Sams({ doc }: TemplateProps) {
  const { company, customer, items } = doc;
  const totals = totalLines(doc);

  return (
    <div className={`${lora.className} flex w-[210mm] min-h-[297mm] print:min-h-0 flex-col bg-white px-[15mm] py-[12mm] text-[#1a1a1a]`}>
      {/* ---- letterhead: mark left, trade lines right ---- */}
      <header className="flex items-end justify-between gap-6">
        <div>
          {company.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={company.logoUrl} alt={company.name} className="h-[22mm] w-auto" />
          ) : (
            <div>
              <div
                className="flex items-center text-[30pt] font-black leading-none tracking-tight"
                style={{ color: MAROON, fontFamily: playfair.style.fontFamily }}
              >
                S
                <svg viewBox="0 0 24 20" className="mx-[1px] h-[26pt] w-[22pt]" aria-hidden>
                  <path d="M12 1 L23 19 L1 19 Z" fill={GOLD} />
                  <path d="M12 7 L17.5 19 L6.5 19 Z" fill={MAROON} />
                </svg>
                MS
              </div>
              <div
                className="mt-[2px] text-center text-[8pt] font-semibold tracking-[0.55em] text-white"
                style={{ backgroundColor: GOLD }}
              >
                TRADERS
              </div>
            </div>
          )}
          {company.email && (
            <p className="mt-1 text-[8.5pt] font-semibold italic" style={{ color: MAROON }}>
              {company.email}
            </p>
          )}
        </div>

        <div className="text-right leading-snug">
          {company.tagline &&
            company.tagline.split("\n").map((line, i) => (
              <p
                key={i}
                className={`italic ${i === 0 ? "text-[9pt] text-[#6b5a5a]" : "text-[10pt] font-bold text-[#2b2b2b]"}`}
              >
                {line}
              </p>
            ))}
          <p className="mt-0.5 text-[9.5pt] font-bold" style={{ color: MAROON }}>
            {join(
              [company.ntn && `NTN No. : ${company.ntn}`, company.gstNumber && `GST No. ${company.gstNumber}`],
              "   ",
            )}
          </p>
        </div>
      </header>

      <div className="mt-2 border-t-2" style={{ borderColor: GOLD }} />
      <div className="mt-[2px] border-t" style={{ borderColor: MAROON }} />

      {/* ---- title ---- */}
      <h1
        className="mt-6 text-center text-[17pt] font-bold italic tracking-[0.3em]"
        style={{ color: MAROON, fontFamily: playfair.style.fontFamily }}
      >
        QUOTATION
      </h1>

      {/* ---- buyer (left) vs. document meta (right) ---- */}
      <section className="mt-5 flex justify-between gap-8 text-[10pt]">
        <div className="max-w-[100mm]">
          <p className="text-[8.5pt] font-bold uppercase tracking-widest" style={{ color: GOLD }}>
            Messers
          </p>
          <p className="text-[12pt] font-bold">{customer.name}</p>
          {customer.contactPerson && <p>Attn: {customer.contactPerson}</p>}
          {customer.address && <p className="text-[#4b4b4b]">{customer.address}</p>}
          <p className="text-[#4b4b4b]">{join([customer.phone, customer.email])}</p>
          {customer.ntn && <p className="text-[#4b4b4b]">NTN: {customer.ntn}</p>}
        </div>
        <table className="h-fit text-[10pt]">
          <tbody>
            <MetaRow label="Quotation #" value={`${company.code}-${doc.number}`} strong />
            <MetaRow label="Date" value={shortDate(doc.date)} />
            <MetaRow label="Valid Until" value={shortDate(doc.validUntil)} />
            {doc.poNumber && <MetaRow label="PO No." value={doc.poNumber} />}
            {doc.dcNumber && <MetaRow label="DC #" value={doc.dcNumber} />}
          </tbody>
        </table>
      </section>

      {/* ---- items ---- */}
      <table className="mt-5 w-full border-collapse text-[10pt]">
        <thead>
          <tr style={{ backgroundColor: MAROON, color: "#fff" }}>
            <Th className="w-[11mm] text-center">S.No</Th>
            <Th className="text-left">Particulars</Th>
            <Th className="w-[20mm] text-right">Qty</Th>
            <Th className="w-[18mm] text-center">Unit</Th>
            <Th className="w-[26mm] text-right">Rate</Th>
            <Th className="w-[30mm] text-right">Amount</Th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={i} className="break-inside-avoid">
              <Td className="text-center">{i + 1}</Td>
              <Td>{it.description}</Td>
              <Td className="text-right">{qty(it.quantity)}</Td>
              <Td className="text-center">{it.unit}</Td>
              <Td className="text-right">{money(it.rate)}</Td>
              <Td className="text-right">{money(it.amount)}</Td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-3 flex justify-end break-inside-avoid">
        <table className="w-[78mm] border-collapse text-[10pt]">
          <tbody>
            {totals.map((t) => (
              <tr key={t.label} style={t.strong ? { backgroundColor: "#f7f1e3" } : undefined}>
                <td
                  className={`border px-2 py-1 text-right ${t.strong ? "font-bold" : ""}`}
                  style={{ borderColor: GOLD, color: t.strong ? MAROON : undefined }}
                >
                  {t.label}
                </td>
                <td
                  className={`border px-2 py-1 text-right ${t.strong ? "text-[12pt] font-bold" : ""}`}
                  style={{ borderColor: GOLD, color: t.strong ? MAROON : undefined }}
                >
                  {money(t.value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(doc.notes || doc.terms) && (
        <section className="mt-5 space-y-2 break-inside-avoid text-[9pt]">
          {doc.notes && (
            <div>
              <p className="font-bold" style={{ color: MAROON }}>Notes</p>
              <p className="whitespace-pre-line text-[#3f3f3f]">{doc.notes}</p>
            </div>
          )}
          {doc.terms && (
            <div>
              <p className="font-bold" style={{ color: MAROON }}>Terms &amp; Conditions</p>
              <p className="whitespace-pre-line text-[#3f3f3f]">{doc.terms}</p>
            </div>
          )}
        </section>
      )}

      <div className="mt-14 flex justify-end break-inside-avoid">
        <div
          className="w-[62mm] border-t pt-1 text-center text-[10pt] font-bold italic"
          style={{ borderColor: MAROON, color: MAROON }}
        >
          For {company.name}
        </div>
      </div>

      {/* ---- footer rule + address, as on the printed letterhead ---- */}
      <footer className="mt-auto pt-8">
        <div className="border-t" style={{ borderColor: GOLD }} />
        <p className="pt-1 text-center text-[8.5pt] font-bold italic" style={{ color: MAROON }}>
          {join([company.address, company.phone && `Tel : ${company.phone}`], " ")}
        </p>
      </footer>
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`border border-[#7B1E2B] px-2 py-1.5 text-[9pt] font-bold uppercase ${className}`}>{children}</th>
  );
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`border border-[#d8c9a8] px-2 py-1 ${className}`}>{children}</td>;
}

function MetaRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <tr>
      <td className="whitespace-nowrap py-0.5 pr-4 text-[#6b5a5a]">{label}</td>
      <td className={`whitespace-nowrap py-0.5 ${strong ? "font-bold" : ""}`}>{value}</td>
    </tr>
  );
}
