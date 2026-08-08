// A new bill, either from an accepted quotation (`?from=<id>`) or from nothing.
//
// From a quotation, the lines are copied — copied, not linked. Editing that
// quotation next month must not rewrite a bill already in the customer's hands,
// so from this point the two documents go their own ways and `quotationId`
// records only where this one came from.
import Link from "next/link";
import { notFound } from "next/navigation";
import { createBill } from "@/app/bill-actions";
import DocumentForm, { type ChargeValues } from "@/components/document-form";
import { EmptyState, PageHeader } from "@/components/ui";
import { inputDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function NewBillPage(props: PageProps<"/bills/new">) {
  const sp = await props.searchParams;
  const from = typeof sp.from === "string" ? sp.from : "";

  const [companies, customers, products, source] = await Promise.all([
    prisma.company.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.customer.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.product.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    from
      ? prisma.quotation.findUnique({
          where: { id: from },
          include: { items: { orderBy: { sortOrder: "asc" } }, company: true },
        })
      : null,
  ]);

  if (from && !source) notFound();

  if (companies.length === 0 || customers.length === 0) {
    return (
      <>
        <PageHeader title="New bill" />
        <EmptyState>
          Add a{" "}
          <Link href="/companies" className="underline">
            company
          </Link>{" "}
          and a{" "}
          <Link href="/customers" className="underline">
            customer
          </Link>{" "}
          first. A bill requires both.
        </EmptyState>
      </>
    );
  }

  // Whose GST rate to start from: the quotation's company, or the only company
  // there is. With several to choose from and no quotation there is nothing to
  // guess yet, and Add charge is one click away.
  const company = source?.company ?? (companies.length === 1 ? companies[0] : null);
  const gst = Number(company?.defaultGstPercent ?? 0);

  // The label is what the user typed; the rate lives in its own column and the
  // sheet composes "GST 18%" from the two. Change the rate and the printed line
  // follows, which it would not if the percentage were baked into the text.
  const charges: ChargeValues[] = gst > 0 ? [{ label: "GST", percent: String(gst), amount: "" }] : [];

  return (
    <>
      <PageHeader
        title="New bill"
        subtitle={
          source
            ? `Lines copied from quotation ${source.company.code}-${source.number}. Edit anything that changed, then add the charges.`
            : "Select a company and the bill number is assigned automatically. The bill prints on that company's design."
        }
      />
      <DocumentForm
        kind="BILL"
        action={createBill}
        submitLabel="Create bill"
        companies={companies.map((c) => ({ id: c.id, name: c.name, code: c.code }))}
        customers={customers.map((c) => ({ id: c.id, name: c.name }))}
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          unit: p.unit,
          defaultRate: Number(p.defaultRate),
        }))}
        values={{
          quotationId: source?.id,
          companyId: source?.companyId ?? (companies.length === 1 ? companies[0].id : ""),
          customerId: source?.customerId ?? "",
          date: inputDate(new Date()),
          // Left blank on purpose: not every bill has a credit period, and an
          // invented due date on a printed sheet is worse than none.
          until: "",
          status: "DRAFT",
          poNumber: source?.poNumber ?? "",
          dcNumber: source?.dcNumber ?? "",
          notes: source?.notes ?? "",
          terms: source?.terms ?? "",
          items:
            source?.items.map((it) => ({
              productId: it.productId ?? "",
              description: it.description,
              unit: it.unit,
              quantity: String(Number(it.quantity)),
              rate: String(Number(it.rate)),
            })) ?? [],
          charges,
        }}
      />
    </>
  );
}
