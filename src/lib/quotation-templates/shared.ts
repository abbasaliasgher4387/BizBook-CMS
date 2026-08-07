import type { QuotationDoc } from "./types";

export type TotalLine = { label: string; value: number; strong?: boolean };

/**
 * The totals block, in the order the client's own bills print it:
 * Sub Total -> GST -> Cartage -> Total.
 *
 * GST and Cartage rows disappear when they are zero, which is how one field set
 * serves the companies that charge GST and the ones that do not.
 *
 * Labels differ per company — Al Mufaddal's own bills say "G-Total Amount"
 * rather than "Total" — so each template passes its own.
 */
export function totalLines(
  doc: QuotationDoc,
  labels: { sub?: string; gst?: string; cartage?: string; total?: string } = {},
): TotalLine[] {
  const lines: TotalLine[] = [];
  const hasExtras = doc.gstPercent > 0 || doc.cartage > 0;

  if (hasExtras) lines.push({ label: labels.sub ?? "Sub Total", value: doc.subtotal });
  if (doc.gstPercent > 0) {
    lines.push({
      label: labels.gst ?? `GST ${trimPercent(doc.gstPercent)}%`,
      value: doc.gstAmount,
    });
  }
  if (doc.cartage > 0) lines.push({ label: labels.cartage ?? "Cartage", value: doc.cartage });

  lines.push({ label: labels.total ?? "Total", value: doc.total, strong: true });
  return lines;
}

/** 18 -> "18", 17.5 -> "17.5" — nobody prints "18.00%". */
export function trimPercent(p: number): string {
  return String(Number(p.toFixed(2)));
}

/** Joins the bits of a contact line, dropping whatever the company hasn't set. */
export function join(parts: (string | null | undefined)[], sep = " | "): string {
  return parts.filter((p) => p && String(p).trim()).join(sep);
}
