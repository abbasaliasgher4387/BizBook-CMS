// Shared class strings and a handful of components.
//
// The rule that keeps rows straight: every control — button, input, select — is
// 32px tall with the same radius, so any two line up without a wrapper.
import Link from "next/link";
import type { ListFilters } from "@/lib/list-filters";
import { swatchFor } from "@/lib/quotation-templates";

const CONTROL =
  "inline-flex h-8 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-[5px] px-3 text-[13px] font-medium transition-colors disabled:opacity-50";

export const btn = {
  primary: `${CONTROL} bg-accent text-white hover:bg-accent-hover`,
  ghost: `${CONTROL} border border-line bg-paper text-ink hover:bg-canvas`,
  danger: `${CONTROL} border border-line bg-paper text-danger hover:border-danger/40 hover:bg-red-50`,
  /** Table-row scale — one notch down, so a row never out-shouts the page. */
  row: "inline-flex h-7 shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-[4px] border border-line bg-paper px-2 text-[12px] font-medium text-ink-2 transition-colors hover:bg-canvas hover:text-ink",
};

export const inputClass =
  "h-8 w-full rounded-[5px] border border-line bg-paper px-2.5 text-[13px] text-ink outline-none transition-colors placeholder:text-ink-3 focus:border-accent";

/** Same skin as inputClass, minus the fixed height a textarea cannot keep. */
export const textareaClass =
  "w-full rounded-[5px] border border-line bg-paper px-2.5 py-1.5 text-[13px] leading-relaxed text-ink outline-none transition-colors placeholder:text-ink-3 focus:border-accent";

export const fieldLabel = "mb-1 block text-[11.5px] font-medium text-ink-2";
export const sectionLabel = "text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3";

export const tableWrap = "overflow-x-auto rounded-md border border-line bg-paper";
export const table = "tnum w-full text-[13px]";
export const thead = "border-b border-line bg-canvas/60";
export const th = "px-3 py-2 text-left text-[10.5px] font-semibold uppercase tracking-[0.07em] text-ink-3";
export const td = "px-3 py-2 align-middle";
export const tr = "border-b border-line-2 last:border-0 hover:bg-canvas/50";

/** Sized by the caller: the rail wears it small, the login screen large. */
export function BrandMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`flex shrink-0 flex-col justify-center gap-[3px] rounded-[5px] border border-rail-line px-[5px] ${className}`}
    >
      <i className="h-[2px] rounded-full bg-accent-bright" />
      <i className="h-[2px] w-3/4 rounded-full bg-rail-fg" />
      <i className="h-[2px] w-1/2 rounded-full bg-rail-fg/50" />
    </span>
  );
}

export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-line pb-4">
      <div className="min-w-0">
        <h1 className="text-[17px] font-semibold leading-tight tracking-[-0.01em]">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-[12.5px] leading-snug text-ink-2">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function Card({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-md border border-line bg-paper ${className}`}>
      {title && (
        <header className="border-b border-line-2 px-4 py-2.5">
          <h2 className={sectionLabel}>{title}</h2>
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Field({
  label,
  name,
  type = "text",
  defaultValue,
  placeholder,
  required,
  step,
  className = "",
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number | null;
  placeholder?: string;
  required?: boolean;
  step?: string;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className={fieldLabel}>
        {label}
        {required && <span className="text-danger"> *</span>}
      </span>
      <input
        className={inputClass}
        name={name}
        type={type}
        step={step}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue ?? undefined}
      />
    </label>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-dashed border-line bg-paper px-4 py-10 text-center text-[13px] text-ink-2">
      {children}
    </div>
  );
}

/* Both documents' statuses in one map. Blue is out with the customer, green is
   settled, red is dead, amber is running out of time. */
const BADGE: Record<string, string> = {
  DRAFT: "border-line bg-canvas text-ink-2",
  // Quotation
  SENT: "border-blue-200 bg-blue-50 text-blue-800",
  ACCEPTED: "border-emerald-200 bg-emerald-50 text-emerald-800",
  REJECTED: "border-red-200 bg-red-50 text-red-800",
  EXPIRED: "border-amber-200 bg-amber-50 text-amber-800",
  // Bill
  ISSUED: "border-blue-200 bg-blue-50 text-blue-800",
  PAID: "border-emerald-200 bg-emerald-50 text-emerald-800",
  CANCELLED: "border-red-200 bg-red-50 text-red-800",
};

export function Badge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block rounded-[3px] border px-1.5 py-px text-[10px] font-semibold uppercase tracking-[0.05em] ${
        BADGE[status] ?? BADGE.DRAFT
      }`}
    >
      {status}
    </span>
  );
}

/* --------------------------------------- the two list pages' shared chrome */

function Tab({
  href,
  active,
  label,
  count,
  swatch,
}: {
  href: string;
  active: boolean;
  label: string;
  count: number;
  swatch?: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[5px] border px-2.5 text-[12.5px] font-medium transition-colors ${
        active ? "border-ink bg-ink text-white" : "border-line bg-paper text-ink-2 hover:bg-canvas"
      }`}
    >
      {swatch && <span aria-hidden className="h-2 w-2 shrink-0 rounded-full" style={{ background: swatch }} />}
      {label}
      <span className={`tnum text-[11px] ${active ? "text-white/60" : "text-ink-3"}`}>{count}</span>
    </Link>
  );
}

/** The counts are each company's whole total, and a tab's address drops the
    filter row, so the number on a tab is exactly what clicking it will show.
    The filtered figure lives in the "N of M shown" line instead. */
export function CompanyTabs({
  base,
  companies,
  selected,
  total,
}: {
  base: string;
  companies: { id: string; code: string; templateKey: string; count: number }[];
  selected: string;
  total: number;
}) {
  if (companies.length < 2) return null;

  return (
    <nav aria-label="Filter by company" className="mb-3 flex flex-wrap items-center gap-1.5">
      <Tab href={base} active={!selected} label="All companies" count={total} />
      {companies.map((c) => (
        <Tab
          key={c.id}
          href={`${base}?company=${c.id}`}
          active={selected === c.id}
          label={c.code}
          count={c.count}
          swatch={swatchFor(c.templateKey)}
        />
      ))}
    </nav>
  );
}

/** A plain GET form: the address bar holds the whole state, so Back works and
    a filtered list can be bookmarked or sent to somebody. */
export function FilterRow({
  action,
  filters,
  statuses,
}: {
  action: string;
  filters: ListFilters;
  statuses: readonly string[];
}) {
  return (
    <form method="get" action={action} className="mb-3 flex flex-wrap items-end gap-2">
      {/* Without this, applying a filter jumps back to All companies. */}
      {filters.company && <input type="hidden" name="company" value={filters.company} />}

      <label className="min-w-[10.5rem] flex-1">
        <span className={fieldLabel}>Search</span>
        <input
          name="q"
          type="search"
          defaultValue={filters.q}
          placeholder="Customer or number"
          className={inputClass}
        />
      </label>

      <label className="w-[8.5rem]">
        <span className={fieldLabel}>Status</span>
        <select name="status" defaultValue={filters.status} className={inputClass}>
          <option value="">Any status</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <label className="w-[9rem]">
        <span className={fieldLabel}>From</span>
        <input name="from" type="date" defaultValue={filters.fromText} className={inputClass} />
      </label>

      <label className="w-[9rem]">
        <span className={fieldLabel}>To</span>
        <input name="to" type="date" defaultValue={filters.toText} className={inputClass} />
      </label>

      <div className="flex items-center gap-2">
        {filters.active && (
          <Link href={filters.company ? `${action}?company=${filters.company}` : action} className={btn.ghost}>
            Clear
          </Link>
        )}
        <button className={btn.primary}>Apply</button>
      </div>
    </form>
  );
}

/** The company's real logo once one is set, otherwise its code in the same
    letterhead colour that comes off the printer. */
export function CompanyLogo({
  code,
  templateKey,
  logoUrl,
  className = "h-5",
}: {
  code: string;
  templateKey: string;
  logoUrl?: string | null;
  className?: string;
}) {
  if (logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- arbitrary file dropped in /public, not a build-time asset
    return <img src={logoUrl} alt="" className={`w-auto shrink-0 object-contain ${className}`} />;
  }
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-[3px] px-1.5 text-[10px] font-semibold uppercase leading-none tracking-[0.06em] text-white ${className}`}
      style={{ background: swatchFor(templateKey) }}
    >
      {code}
    </span>
  );
}
