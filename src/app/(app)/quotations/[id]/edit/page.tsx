import { notFound } from "next/navigation";
import { updateQuotation } from "@/app/actions";
import { PageHeader } from "@/components/ui";
import { inputDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import QuotationForm from "../../quotation-form";

export const dynamic = "force-dynamic";

export default async function EditQuotationPage(props: PageProps<"/quotations/[id]/edit">) {
  const { id } = await props.params;

  const [quotation, companies, customers, products] = await Promise.all([
    prisma.quotation.findUnique({
      where: { id },
      include: { items: { orderBy: { sortOrder: "asc" } }, company: { select: { code: true } } },
    }),
    prisma.company.findMany({ orderBy: { name: "asc" } }),
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);
  if (!quotation) notFound();

  return (
    <>
      <PageHeader
        title={`Edit ${quotation.company.code}-${quotation.number}`}
        subtitle="The quotation number and the company cannot be changed. Everything else can be edited."
      />
      <QuotationForm
        action={updateQuotation}
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
          id: quotation.id,
          companyId: quotation.companyId,
          customerId: quotation.customerId,
          date: inputDate(quotation.date),
          validUntil: inputDate(quotation.validUntil),
          status: quotation.status,
          poNumber: quotation.poNumber ?? "",
          dcNumber: quotation.dcNumber ?? "",
          notes: quotation.notes ?? "",
          terms: quotation.terms ?? "",
          items: quotation.items.map((it) => ({
            productId: it.productId ?? "",
            description: it.description,
            unit: it.unit,
            quantity: String(Number(it.quantity)),
            rate: String(Number(it.rate)),
          })),
        }}
      />
    </>
  );
}
