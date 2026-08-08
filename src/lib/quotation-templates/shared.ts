import type { DocKind, SheetDoc } from "./types";

export type TotalLine = { label: string; value: number; strong?: boolean };

/**
 * Sub Total -> each charge -> Total, the order the client's own bills use. A
 * quotation has no charges, so it prints the total alone. The final label
 * differs per company (Al Mufaddal says "G-Total Amount"), so designs pass it.
 */
export function totalLines(doc: SheetDoc, labels: { sub?: string; total?: string } = {}): TotalLine[] {
  const lines: TotalLine[] = [];

  if (doc.charges.length > 0) {
    lines.push({ label: labels.sub ?? "Sub Total", value: doc.subtotal });
    for (const c of doc.charges) lines.push({ label: c.label, value: c.amount });
  }

  lines.push({ label: labels.total ?? "Total", value: doc.total, strong: true });
  return lines;
}

/**
 * The handful of words that make the same sheet read as a quotation or as a
 * bill. Kept here rather than in each design so the wording is one edit, and so
 * a new design cannot accidentally call a bill a quotation.
 *
 * Designs apply their own casing — SAMS prints the title in caps with wide
 * tracking, the rest print it as written.
 */
export function docWords(kind: DocKind) {
  const bill = kind === "BILL";
  return {
    /** The heading across the sheet. */
    title: bill ? "Bill" : "Quotation",
    /** Label beside the document number. */
    ref: bill ? "Bill #" : "Quotation #",
    /** Label beside `doc.until`. */
    until: bill ? "Due Date" : "Valid Until",
    /** Heading over the customer block, where a design uses one. */
    to: bill ? "Bill To" : "Quotation To",
  };
}

/**
 * The reference as it is printed, filed and named: SAMS-0001 for a quotation,
 * SAMS-B-0001 for a bill.
 *
 * Bills carry their own sequence, so without the B both documents would reach
 * 0001 and a customer holding one of each would be looking at the same number on
 * two different sheets. One function, so no design can disagree — and the PDF
 * filename uses it too.
 */
export function docRef(doc: SheetDoc): string {
  return `${doc.company.code}-${doc.kind === "BILL" ? "B-" : ""}${doc.number}`;
}

/** Joins the bits of a contact line, dropping whatever the company hasn't set. */
export function join(parts: (string | null | undefined)[], sep = " | "): string {
  return parts.filter((p) => p && String(p).trim()).join(sep);
}
