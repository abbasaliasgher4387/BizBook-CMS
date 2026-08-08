import { notFound } from "next/navigation";
import { updateBill } from "@/app/bill-actions";
import DocumentForm from "@/components/document-form";
import { PageHeader } from "@/components/ui";
import { inputDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function EditBillPage(props: PageProps<"/bills/[id]/edit">) {
  const { id } = await props.params;

  const [bill, companies, customers, products] = await Promise.all([
    prisma.bill.findUnique({
      where: { id },
      include: {
        items: { orderBy: { sortOrder: "asc" } },
        charges: { orderBy: { sortOrder: "asc" } },
        company: { select: { code: true } },
      },
    }),
    prisma.company.findMany({ orderBy: { name: "asc" } }),
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);
  if (!bill) notFound();

  return (
    <>
      <PageHeader
        title={`Edit ${bill.company.code}-B-${bill.number}`}
        subtitle="The bill number and the company cannot be changed. Everything else can be edited."
      />
      <DocumentForm
        kind="BILL"
        action={updateBill}
        submitLabel="Save changes"
        companies={companies.map((c) => ({ id: c.id, name: c.name, code: c.code }))}
        customers={customers.map((c) => ({ id: c.id, name: c.name }))}
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          unit: p.unit,
          defaultRate: Number(p.defaultRate),
        }))}
        values={{
          id: bill.id,
          companyId: bill.companyId,
          customerId: bill.customerId,
          date: inputDate(bill.date),
          until: inputDate(bill.dueDate),
          status: bill.status,
          poNumber: bill.poNumber ?? "",
          dcNumber: bill.dcNumber ?? "",
          notes: bill.notes ?? "",
          terms: bill.terms ?? "",
          items: bill.items.map((it) => ({
            productId: it.productId ?? "",
            description: it.description,
            unit: it.unit,
            quantity: String(Number(it.quantity)),
            rate: String(Number(it.rate)),
          })),
          charges: bill.charges.map((c) => ({
            label: c.label,
            // A percentage charge goes back into the % box, not the amount box:
            // re-saving must recompute it against whatever the lines now total.
            percent: c.percent === null ? "" : String(Number(c.percent)),
            amount: String(Number(c.amount)),
          })),
        }}
      />
    </>
  );
}
