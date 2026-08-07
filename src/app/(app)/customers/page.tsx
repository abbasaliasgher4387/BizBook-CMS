import { deleteCustomer, saveCustomer } from "@/app/actions";
import { EmptyState, Field, PageHeader, btn, fieldLabel, textareaClass } from "@/components/ui";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const customers = await prisma.customer.findMany({ orderBy: { name: "asc" } });

  return (
    <>
      <PageHeader title="Customers" subtitle="One shared list. Every company quotes from it." />

      {customers.length > 0 && (
        <div className="divide-y divide-line-2 overflow-hidden rounded-md border border-line bg-paper">
          {customers.map((c) => {
            const meta = [c.contactPerson, c.phone].filter(Boolean).join(" · ");

            return (
              <details key={c.id} className="group">
                {/* Only the name and the contact wrap; Edit sits outside that box, so it
                    stays pinned right on every row. While it was inside the same wrap,
                    where it landed depended on how long the customer's name happened to
                    be — which is why one row looked nothing like the one above it. */}
                <summary className="flex cursor-pointer list-none items-center gap-x-3 px-3 py-2.5 transition-colors hover:bg-canvas/60 [&::-webkit-details-marker]:hidden">
                  <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-3 gap-y-0.5">
                    <span className="text-[13px] font-medium">{c.name}</span>
                    {meta && <span className="text-[12px] text-ink-2">{meta}</span>}
                  </span>
                  <span className="shrink-0 text-[12px] text-ink-3 group-open:hidden">Edit</span>
                  <span className="hidden shrink-0 text-[12px] text-ink-3 group-open:inline">Close</span>
                </summary>
                <div className="border-t border-line-2 bg-canvas/40 p-4">
                  <CustomerForm customer={c} />
                </div>
              </details>
            );
          })}
        </div>
      )}

      {customers.length === 0 && <EmptyState>No customers yet. Add the first one below.</EmptyState>}

      <details
        open={customers.length === 0}
        className="group mt-4 overflow-hidden rounded-md border border-dashed border-line bg-paper"
      >
        <summary className="cursor-pointer list-none px-3 py-2.5 text-[13px] font-medium text-ink-2 transition-colors hover:bg-canvas/60 [&::-webkit-details-marker]:hidden">
          <span className="group-open:hidden">Add a customer</span>
          <span className="hidden group-open:inline">New customer</span>
        </summary>
        <div className="border-t border-line-2 bg-canvas/40 p-4">
          <CustomerForm customer={null} />
        </div>
      </details>
    </>
  );
}

type Customer = Awaited<ReturnType<typeof prisma.customer.findMany>>[number];

function CustomerForm({ customer }: { customer: Customer | null }) {
  // Delete is its own form so the two actions never share a submit; the save
  // button reaches back into the edit form by id — plain HTML, no nesting.
  const formId = customer ? `customer-${customer.id}` : "customer-new";

  // Capped: a field wider than the value it holds is harder to read, not easier.
  return (
    <div className="max-w-3xl space-y-3.5">
      <form id={formId} action={saveCustomer} className="space-y-3.5">
        {customer && <input type="hidden" name="id" value={customer.id} />}

        <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
          <Field label="Customer name" name="name" required defaultValue={customer?.name} />
          <Field label="Contact person" name="contactPerson" defaultValue={customer?.contactPerson} />
          <Field label="Phone" name="phone" defaultValue={customer?.phone} />
          <Field label="Email" name="email" type="email" defaultValue={customer?.email} />
          <Field label="NTN" name="ntn" defaultValue={customer?.ntn} />
          <Field label="GST number" name="gstNumber" defaultValue={customer?.gstNumber} />
        </div>

        <label className="block">
          <span className={fieldLabel}>Address</span>
          <textarea name="address" rows={2} className={textareaClass} defaultValue={customer?.address ?? ""} />
        </label>
      </form>

      <div className="flex items-center justify-between gap-3 border-t border-line pt-3.5">
        {customer ? (
          <form action={deleteCustomer}>
            <input type="hidden" name="id" value={customer.id} />
            <button className={btn.danger}>Delete customer</button>
          </form>
        ) : (
          <span />
        )}
        <button form={formId} className={btn.primary}>
          {customer ? "Save changes" : "Create customer"}
        </button>
      </div>
    </div>
  );
}
