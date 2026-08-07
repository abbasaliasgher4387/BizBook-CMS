"use client";

import { useState } from "react";
import { btn, fieldLabel, inputClass, sectionLabel, textareaClass } from "@/components/ui";
import { money, round2 } from "@/lib/format";

export type ItemValues = {
  productId: string;
  description: string;
  unit: string;
  quantity: string;
  rate: string;
};

export type QuotationFormValues = {
  id?: string;
  companyId: string;
  customerId: string;
  date: string; // yyyy-mm-dd
  validUntil: string;
  status: string;
  poNumber: string;
  dcNumber: string;
  notes: string;
  terms: string;
  items: ItemValues[];
};

type Option = { id: string; name: string; code?: string | null };
type ProductOption = { id: string; name: string; unit: string; defaultRate: number };

const STATUSES = ["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED"];

export const emptyItem: ItemValues = { productId: "", description: "", unit: "pcs", quantity: "1", rate: "0" };

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

export default function QuotationForm({
  action,
  companies,
  customers,
  products,
  values,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  companies: Option[];
  customers: Option[];
  products: ProductOption[];
  values: QuotationFormValues;
  submitLabel: string;
}) {
  const [items, setItems] = useState<ItemValues[]>(values.items.length ? values.items : [emptyItem]);

  const isEdit = Boolean(values.id);

  // Same arithmetic as the server action, so what is shown here is what is saved.
  // A quotation is the lines and nothing else — GST and cartage belong to a bill,
  // so they are not asked for here and save as 0.
  const subtotal = round2(items.reduce((sum, it) => sum + Number(it.quantity || 0) * Number(it.rate || 0), 0));

  function patch(index: number, changes: Partial<ItemValues>) {
    setItems((rows) => rows.map((row, i) => (i === index ? { ...row, ...changes } : row)));
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
            <span className={fieldLabel}>Valid until</span>
            <input type="date" name="validUntil" className={inputClass} defaultValue={values.validUntil} />
          </label>
          <label className="block">
            <span className={fieldLabel}>Status</span>
            <select name="status" className={inputClass} defaultValue={values.status}>
              {STATUSES.map((s) => (
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
            <div className="flex items-center justify-between gap-3">
              <dt className="text-[14px] font-semibold">Subtotal</dt>
              <dd className="tnum text-[16px] font-semibold">{money(subtotal)}</dd>
            </div>
            <dd className="mt-1 text-[11.5px] text-ink-3">The lines added up. Nothing else is added.</dd>
          </dl>
        </Panel>
      </div>

      <div className="flex justify-end border-t border-line pt-4">
        <button className={btn.primary}>{submitLabel}</button>
      </div>
    </form>
  );
}
