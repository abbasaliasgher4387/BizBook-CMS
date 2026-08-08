// The query string both list pages read:
//
//     ?company=<id>&q=<text>&status=<STATUS>&from=<yyyy-mm-dd>&to=<yyyy-mm-dd>
//
// Shared because this is where the silent mistakes are — see the two comments
// below.
import { parseInputDate } from "@/lib/format";

export type ListFilters = {
  company: string;
  q: string;
  status: string;
  /** The raw yyyy-mm-dd text, so the date boxes come back filled in. */
  fromText: string;
  toText: string;
  from: Date | null;
  to: Date | null;
  /** Something is narrowing the list beyond the company tab. */
  active: boolean;
};

type Params = Record<string, string | string[] | undefined>;

const str = (v: string | string[] | undefined) => (typeof v === "string" ? v.trim() : "");

/** `statuses` is the page's own list — QUOTATION_STATUSES or BILL_STATUSES. */
export function listFilters(sp: Params, statuses: readonly string[]): ListFilters {
  const q = str(sp.q);
  const wanted = str(sp.status).toUpperCase();
  // Anything not in the enum is treated as no filter at all. The alternative is
  // handing ?status=DROP straight to the database.
  const status = statuses.includes(wanted) ? wanted : "";
  const fromText = str(sp.from);
  const toText = str(sp.to);
  const to = parseInputDate(toText);

  return {
    company: str(sp.company),
    q,
    status,
    fromText,
    toText,
    from: parseInputDate(fromText),
    // Both dates parse to UTC midnight. Left that way, "to 8 August" would
    // exclude everything dated 8 August — the opposite of what was asked.
    to: to ? new Date(to.getTime() + 86_399_999) : null,
    active: Boolean(q || status || fromText || toText),
  };
}

/** The half of the `where` that is the same on both lists. `status` is left to
    the caller — its enum differs between Quotation and Bill. */
export function listWhere(f: ListFilters) {
  return {
    ...(f.company ? { companyId: f.company } : {}),
    ...(f.from || f.to ? { date: { ...(f.from ? { gte: f.from } : {}), ...(f.to ? { lte: f.to } : {}) } } : {}),
    // The sheet says SAMS-0007 but only "0007" is stored, so the prefix is
    // dropped before matching. A customer's name works in the same box.
    ...(f.q
      ? {
          OR: [
            { number: { contains: f.q.split("-").pop() || f.q } },
            { customer: { name: { contains: f.q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };
}
