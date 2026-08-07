// Everything here is deterministic on purpose: the server and the browser must
// produce the exact same string, otherwise React reports a hydration mismatch.
// So no toLocaleDateString(), no timezone-dependent formatting.

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const grouped = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 12345.5 -> "12,345.50" */
export function money(n: number): string {
  return grouped.format(n);
}

/** 12345.5 -> "Rs 12,345.50" */
export function rupees(n: number): string {
  return `Rs ${grouped.format(n)}`;
}

/** 2.5 -> "2.5", 3 -> "3" — trailing zeros on a quantity look wrong on paper. */
export function qty(n: number): string {
  return String(Number(n.toFixed(3)));
}

/** Date -> "06-Aug-2026" (read in UTC, so it never shifts a day) */
export function shortDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${day}-${MONTHS[date.getUTCMonth()]}-${date.getUTCFullYear()}`;
}

/** Date -> "2026-08-06", the value an <input type="date"> expects. */
export function inputDate(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
}

/** "2026-08-06" -> Date at UTC midnight. Avoids the local-timezone off-by-one. */
export function parseInputDate(v: FormDataEntryValue | null): Date | null {
  const s = typeof v === "string" ? v.trim() : "";
  if (!s) return null;
  const d = new Date(`${s}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Money maths in one place, rounded to paisa. */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Reads a form field as a number, treating blank/garbage as 0. */
export function num(v: FormDataEntryValue | null): number {
  const n = Number(typeof v === "string" ? v.trim() : "");
  return Number.isFinite(n) ? n : 0;
}

/** Trims a form field to a string, or null when empty. */
export function text(v: FormDataEntryValue | null): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  return s === "" ? null : s;
}

/** "Ahmed Traders" -> "AT" — stands in for a logo until the client sends real ones. */
export function monogram(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}
