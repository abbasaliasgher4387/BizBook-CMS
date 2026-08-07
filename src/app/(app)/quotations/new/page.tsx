import Link from "next/link";
import { createQuotation } from "@/app/actions";
import { EmptyState, PageHeader } from "@/components/ui";
import { inputDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import QuotationForm from "../quotation-form";

export const dynamic = "force-dynamic";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export default async function NewQuotationPage() {
  const [companies, customers, products] = await Promise.all([
    prisma.company.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.customer.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.product.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  if (companies.length === 0 || customers.length === 0) {
    return (
      <>
        <PageHeader title="New quotation" />
        <EmptyState>
          Add a{" "}
          <Link href="/companies" className="underline">
            company
          </Link>{" "}
          and a{" "}
          <Link href="/customers" className="underline">
            customer
          </Link>{" "}
          first. A quotation requires both.
        </EmptyState>
      </>
    );
  }

  const today = new Date();

  return (
    <>
      <PageHeader
        title="New quotation"
        subtitle="Select a company and the quotation number is assigned automatically. The quotation prints on that company's design."
      />
      <QuotationForm
        action={createQuotation}
        submitLabel="Create quotation"
        companies={companies.map((c) => ({ id: c.id, name: c.name, code: c.code }))}
        customers={customers.map((c) => ({ id: c.id, name: c.name }))}
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          unit: p.unit,
          defaultRate: Number(p.defaultRate),
        }))}
        values={{
          companyId: companies.length === 1 ? companies[0].id : "",
          customerId: "",
          date: inputDate(today),
          validUntil: inputDate(new Date(today.getTime() + THIRTY_DAYS_MS)),
          status: "DRAFT",
          poNumber: "",
          dcNumber: "",
          notes: "",
          terms: "",
          items: [],
        }}
      />
    </>
  );
}
