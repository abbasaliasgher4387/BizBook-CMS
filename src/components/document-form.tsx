"use client";

// One form for both documents, switched by `kind`, rather than two drifting
// apart every time a field is added. The bill adds one panel: charges.
import { useState } from "react";
import { btn, fieldLabel, inputClass, sectionLabel, textareaClass } from "@/components/ui";
import { BILL_STATUSES, QUOTATION_STATUSES } from "@/lib/app";
import { chargeLine, chargeValue, money, round2 } from "@/lib/format";
import type { DocKind } from "@/lib/quotation-templates/types";

export type ItemValues = {
  productId: string;
  description: string;
  unit: string;
  quantity: string;
  rate: string;
};

/** A charge is either a percentage of the subtotal or a flat figure — never
    both. An empty `percent` means the typed `amount` is used as it stands. */
export type ChargeValues = {
  label: string;
  percent: string;
  amount: string;
};

export type DocumentFormValues = {
  id?: string;
  /** Bills only, and only when this one was billed from a quotation. */
  quotationId?: string;
  companyId: string;
  customerId: string;
  date: string; // yyyy-mm-dd
  /** Valid-until on a quotation, due date on a bill. */
  until: string;
  status: string;
  poNumber: string;
  dcNumber: string;
  notes: string;
  terms: string;
  items: ItemValues[];
  charges: ChargeValues[];
};

type Option = { id: string; name: string; code?: string | null };
type ProductOption = { id: string; name: string; unit: string; defaultRate: number };

const emptyItem: ItemValues = { productId: "", description: "", unit: "pcs", quantity: "1", rate: "0" };
/** Amount starts empty, not "0": a new row is typed into, and a zero sitting in
    the box means the first figure typed lands beside it — 4500 becomes 45000. */
const emptyCharge: ChargeValues = { label: "", percent: "", amount: "" };

/** The item table's column heading. Sits on the same 12-column grid as a row,
    so every heading is directly above the field it names. */
const COL = "text-[10.5px] font-semibold uppercase tracking-[0.07em] text-ink-3";

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-line bg-paper">
      <header className="border-b border-line-2 px-4 py-2.5">
        <h2 className={sectionLabel}>{title}</h2>
      </header>
      {children}
    </section>
  );
}

/** The typed row read as numbers, then through the same rule the server uses. */
function chargeAmount(c: ChargeValues, subtotal: number): number {
  const pct = c.percent.trim();
  return chargeValue(pct === "" ? null : Number(pct), Number(c.amount || 0), subtotal);
}

export default function DocumentForm({
  kind,
  action,
  companies,
  customers,
  products,
  values,
  submitLabel,
}: {
  kind: DocKind;
  action: (formData: FormData) => void;
  companies: Option[];
  customers: Option[];
  products: ProductOption[];
  values: DocumentFormValues;
  submitLabel: string;
}) {
  const bill = kind === "BILL";
  const [items, setItems] = useState<ItemValues[]>(values.items.length ? values.items : [emptyItem]);
  const [charges, setCharges] = useState<ChargeValues[]>(values.charges);

  const isEdit = Boolean(values.id);

  // Same arithmetic as the server action, so what is shown here is what is
  // saved. A quotation is the lines and nothing else; a bill adds its charges.
  const subtotal = round2(items.reduce((sum, it) => sum + Number(it.quantity || 0) * Number(it.rate || 0), 0));
  const chargeRows = charges.map((c) => chargeAmount(c, subtotal));
  const chargesTotal = round2(chargeRows.reduce((sum, n) => sum + n, 0));
  const total = round2(subtotal + (bill ? chargesTotal : 0));

  function patch(index: number, changes: Partial<ItemValues>) {
    setItems((rows) => rows.map((row, i) => (i === index ? { ...row, ...changes } : row)));
  }

  function patchCharge(index: number, changes: Partial<ChargeValues>) {
    setCharges((rows) => rows.map((row, i) => (i === index ? { ...row, ...changes } : row)));
  }

  function pickProduct(index: number, productId: string) {
    const p = products.find((x) => x.id === productId);
    if (!p) {
      patch(index, { productId: "" });
      return;
    }
    patch(index, { productId, description: p.name, unit: p.unit, rate: String(p.defaultRate) });
  }

  return (
    <form action={action} className="space-y-4">
      {values.id && <input type="hidden" name="id" value={values.id} />}
      {values.quotationId && <input type="hidden" name="quotationId" value={values.quotationId} />}

      <Panel title="Details">
        <div className="grid gap-x-4 gap-y-3 p-4 sm:grid-cols-3">
          <label className="block">
            <span className={fieldLabel}>
              Company<span className="text-danger"> *</span>
            </span>
            {isEdit ? (
              <>
                <input type="hidden" name="companyId" value={values.companyId} />
                <p className="flex h-8 items-center rounded-[5px] border border-line bg-canvas px-2.5 text-[13px] text-ink-2">
                  {companies.find((c) => c.id === values.companyId)?.name ?? "—"}
                </p>
                <span className="mt-1 block text-[11px] text-ink-3">Fixed once the number is issued.</span>
              </>
            ) : (
              <select name="companyId" required className={inputClass} defaultValue={values.companyId}>
                <option value="">Select a company</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} · {c.name}
                  </option>
                ))}
              </select>
            )}
          </label>

          <label className="block sm:col-span-2">
            <span className={fieldLabel}>
              Customer<span className="text-danger"> *</span>
            </span>
            <select name="customerId" required className={inputClass} defaultValue={values.customerId}>
              <option value="">Select a customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={fieldLabel}>Date</span>
            <input type="date" name="date" className={inputClass} defaultValue={values.date} />
          </label>
          <label className="block">
            <span className={fieldLabel}>{bill ? "Due date" : "Valid until"}</span>
            <input type="date" name="until" className={inputClass} defaultValue={values.until} />
          </label>
          <label className="block">
            <span className={fieldLabel}>Status</span>
            <select name="status" className={inputClass} defaultValue={values.status}>
              {(bill ? BILL_STATUSES : QUOTATION_STATUSES).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={fieldLabel}>PO number</span>
            <input name="poNumber" className={inputClass} defaultValue={values.poNumber} placeholder="Optional" />
          </label>
          <label className="block">
            <span className={fieldLabel}>DC number</span>
            <input name="dcNumber" className={inputClass} defaultValue={values.dcNumber} placeholder="Optional" />
          </label>
        </div>
      </Panel>

      <Panel title="Items">
        <div className="hidden gap-2 border-b border-line bg-canvas/60 px-3 py-1.5 sm:grid sm:grid-cols-12">
          {/* px-2.5 matches the inputs' own padding, so a heading sits exactly
              over the text of the field it names, not over the field's border. */}
          <span className={`${COL} px-2.5 sm:col-span-3`}>Product</span>
          <span className={`${COL} px-2.5 sm:col-span-3`}>Description</span>
          <span className={`${COL} px-2.5 sm:col-span-1`}>Unit</span>
          <span className={`${COL} px-2.5 text-right sm:col-span-1`}>Qty</span>
          <span className={`${COL} px-2.5 text-right sm:col-span-2`}>Rate</span>
          <span className={`${COL} text-right sm:col-span-1`}>Amount</span>
          <span className="sm:col-span-1" />
        </div>

        {items.map((row, i) => (
          <div
            key={i}
            className="grid items-center gap-2 border-b border-line-2 px-3 py-2 last:border-0 sm:grid-cols-12"
          >
            <input type="hidden" name="itemProductId" value={row.productId} />

            <select
              aria-label={`Product on line ${i + 1}`}
              className={`${inputClass} sm:col-span-3`}
              value={row.productId}
              onChange={(e) => pickProduct(i, e.target.value)}
            >
              <option value="">Custom item</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <input
              name="itemDescription"
              aria-label={`Description on line ${i + 1}`}
              placeholder="Description"
              className={`${inputClass} sm:col-span-3`}
              value={row.description}
              onChange={(e) => patch(i, { description: e.target.value })}
            />
            <input
              name="itemUnit"
              aria-label={`Unit on line ${i + 1}`}
              placeholder="Unit"
              className={`${inputClass} sm:col-span-1`}
              value={row.unit}
              onChange={(e) => patch(i, { unit: e.target.value })}
            />
            <input
              name="itemQuantity"
              aria-label={`Quantity on line ${i + 1}`}
              type="number"
              step="0.001"
              className={`${inputClass} tnum text-right sm:col-span-1`}
              value={row.quantity}
              onChange={(e) => patch(i, { quantity: e.target.value })}
            />
            <input
              name="itemRate"
              aria-label={`Rate on line ${i + 1}`}
              type="number"
              step="0.01"
              className={`${inputClass} tnum text-right sm:col-span-2`}
              value={row.rate}
              onChange={(e) => patch(i, { rate: e.target.value })}
            />

            <span className="tnum text-right text-[13px] font-medium sm:col-span-1">
              {money(round2(Number(row.quantity || 0) * Number(row.rate || 0)))}
            </span>

            <span className="flex justify-end sm:col-span-1">
              <button
                type="button"
                aria-label={`Remove line ${i + 1}`}
                className="grid h-7 w-7 place-items-center rounded-[4px] text-[16px] leading-none text-ink-3 transition-colors hover:bg-red-50 hover:text-danger disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink-3"
                disabled={items.length === 1}
                onClick={() => setItems((rows) => rows.filter((_, x) => x !== i))}
              >
                ×
              </button>
            </span>
          </div>
        ))}

        <div className="border-t border-line px-3 py-2.5">
          <button type="button" className={btn.ghost} onClick={() => setItems((rows) => [...rows, emptyItem])}>
            Add item
          </button>
        </div>
      </Panel>

      {bill && (
        <Panel title="Charges">
          {charges.length > 0 && (
            <div className="hidden gap-2 border-b border-line bg-canvas/60 px-3 py-1.5 sm:grid sm:grid-cols-12">
              <span className={`${COL} px-2.5 sm:col-span-6`}>Charge</span>
              <span className={`${COL} px-2.5 text-right sm:col-span-2`}>% of subtotal</span>
              <span className={`${COL} px-2.5 text-right sm:col-span-3`}>Amount</span>
              <span className="sm:col-span-1" />
            </div>
          )}

          {charges.map((row, i) => {
            // A percentage owns the amount box: typing in it would be ignored on
            // save, so the figure is shown as the answer rather than offered as
            // a field.
            const byPercent = row.percent.trim() !== "";
            return (
              <div
                key={i}
                className="grid items-center gap-2 border-b border-line-2 px-3 py-2 last:border-0 sm:grid-cols-12"
              >
                <input
                  name="chargeLabel"
                  aria-label={`Charge ${i + 1} name`}
                  placeholder="GST, Cartage, Labour, Discount…"
                  className={`${inputClass} sm:col-span-6`}
                  value={row.label}
                  onChange={(e) => patchCharge(i, { label: e.target.value })}
                />
                <input
                  name="chargePercent"
                  aria-label={`Charge ${i + 1} percentage`}
                  type="number"
                  step="0.01"
                  placeholder="—"
                  className={`${inputClass} tnum text-right sm:col-span-2`}
                  value={row.percent}
                  onChange={(e) => patchCharge(i, { percent: e.target.value })}
                />
                <input
                  name="chargeAmount"
                  aria-label={`Charge ${i + 1} amount`}
                  type="number"
                  step="0.01"
                  readOnly={byPercent}
                  className={`${inputClass} tnum text-right sm:col-span-3 ${byPercent ? "bg-canvas text-ink-2" : ""}`}
                  value={byPercent ? String(chargeRows[i]) : row.amount}
                  onChange={(e) => patchCharge(i, { amount: e.target.value })}
                />
                <span className="flex justify-end sm:col-span-1">
                  <button
                    type="button"
                    aria-label={`Remove charge ${i + 1}`}
                    className="grid h-7 w-7 place-items-center rounded-[4px] text-[16px] leading-none text-ink-3 transition-colors hover:bg-red-50 hover:text-danger"
                    onClick={() => setCharges((rows) => rows.filter((_, x) => x !== i))}
                  >
                    ×
                  </button>
                </span>
              </div>
            );
          })}

          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-line px-3 py-2.5">
            <button type="button" className={btn.ghost} onClick={() => setCharges((rows) => [...rows, emptyCharge])}>
              Add charge
            </button>
            <p className="max-w-lg text-[11.5px] leading-snug text-ink-3">
              Fill the percentage for GST and the like; leave it blank and type a figure for cartage. A negative amount
              is a discount. A charge with no name is dropped.
            </p>
          </div>
        </Panel>
      )}

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Panel title="Printed on the document">
          <div className="space-y-3 p-4">
            <label className="block">
              <span className={fieldLabel}>Notes</span>
              <textarea name="notes" rows={3} className={textareaClass} defaultValue={values.notes} />
            </label>
            <label className="block">
              <span className={fieldLabel}>Terms &amp; conditions</span>
              <textarea name="terms" rows={3} className={textareaClass} defaultValue={values.terms} />
            </label>
          </div>
        </Panel>

        <Panel title="Total">
          <dl className="p-4 text-[13px]">
            {bill ? (
              <>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-ink-2">Subtotal</dt>
                  <dd className="tnum">{money(subtotal)}</dd>
                </div>
                {charges.map((c, i) => (
                  <div key={i} className="mt-1 flex items-center justify-between gap-3">
                    {/* Exactly how the sheet will word it — the rate is part of
                        the printed line, not of the name that was typed. */}
                    <dt className="truncate text-ink-2">
                      {c.label.trim()
                        ? chargeLine(c.label.trim(), c.percent.trim() === "" ? null : Number(c.percent))
                        : "Unnamed charge — will be dropped"}
                    </dt>
                    <dd className="tnum">{money(chargeRows[i])}</dd>
                  </div>
                ))}
                <div className="mt-2.5 flex items-center justify-between gap-3 border-t border-line pt-2.5">
                  <dt className="text-[14px] font-semibold">Total</dt>
                  <dd className="tnum text-[16px] font-semibold">{money(total)}</dd>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[14px] font-semibold">Subtotal</dt>
                  <dd className="tnum text-[16px] font-semibold">{money(subtotal)}</dd>
                </div>
                <dd className="mt-1 text-[11.5px] text-ink-3">
                  The lines added up. Cartage and GST are charged on the bill.
                </dd>
              </>
            )}
          </dl>
        </Panel>
      </div>

      <div className="flex justify-end border-t border-line pt-4">
        <button className={btn.primary}>{submitLabel}</button>
      </div>
    </form>
  );
}
