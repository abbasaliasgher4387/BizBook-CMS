// Presentational helpers so the CRUD pages stay short. Deliberately not a
// component library: exported class strings plus a handful of components.
//
// The rule that keeps rows straight: every control in the app — button, link
// styled as a button, input, select — is exactly 32px tall and shares the same
// radius. Put any of them next to any other and they line up without a wrapper.
import { swatchFor } from "@/lib/quotation-templates";

const CONTROL =
  "inline-flex h-8 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-[5px] px-3 text-[13px] font-medium transition-colors disabled:opacity-50";

export const btn = {
  primary: `${CONTROL} bg-accent text-white hover:bg-accent-hover`,
  ghost: `${CONTROL} border border-line bg-paper text-ink hover:bg-canvas`,
  danger: `${CONTROL} border border-line bg-paper text-danger hover:border-danger/40 hover:bg-red-50`,
  /** Table-row scale. Same shape, one notch down, so a row never out-shouts the
      page's own actions. */
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
      {/* Every page's actions land here, in the same order and the same
          alignment: secondary first, primary last. */}
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

const BADGE: Record<string, string> = {
  DRAFT: "border-line bg-canvas text-ink-2",
  SENT: "border-blue-200 bg-blue-50 text-blue-800",
  ACCEPTED: "border-emerald-200 bg-emerald-50 text-emerald-800",
  REJECTED: "border-red-200 bg-red-50 text-red-800",
  EXPIRED: "border-amber-200 bg-amber-50 text-amber-800",
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

/** A company's mark. Its real logo once a file is set on the company; until
    then its code in the company's own letterhead colour — the same colour that
    comes off the printer, so a row is recognised before it is read. */
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

/** A company's mark and the document's own number, the way a document carries
    its reference: the mark says whose it is, the figures say which one. */
export function DocNumber({
  code,
  number,
  templateKey,
  logoUrl,
}: {
  code: string;
  number: string;
  templateKey: string;
  logoUrl?: string | null;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      {/* Fixed slot: codes are 2–4 letters wide, and without it the numbers
          down the column would start at a different x on every row. */}
      <span className="flex w-14 shrink-0">
        <CompanyLogo code={code} templateKey={templateKey} logoUrl={logoUrl} />
      </span>
      <span className="tnum text-[13px] font-semibold tracking-[0.02em]">{number}</span>
    </span>
  );
}
