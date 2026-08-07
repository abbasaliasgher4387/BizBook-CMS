import { deleteProduct, saveProduct } from "@/app/actions";
import { EmptyState, Field, PageHeader, btn } from "@/components/ui";
import { money } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/* One grid, shared by the heading and by every row, so the columns stay in line
   while an opened row is still free to run the full width of the card. */
const ROW = "grid min-w-[38rem] grid-cols-[1fr_7rem_4rem_7rem_3rem] items-center gap-3 px-3";

export default async function ProductsPage() {
  const products = await prisma.product.findMany({ orderBy: { name: "asc" } });

  return (
    <>
      <PageHeader
        title="Products"
        subtitle="Choosing a product on a quotation fills in its description, unit and rate."
      />

      {products.length > 0 && (
        <div className="overflow-x-auto rounded-md border border-line bg-paper">
          <div
            className={`${ROW} border-b border-line bg-canvas/60 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.07em] text-ink-3`}
          >
            <span>Name</span>
            <span>Code</span>
            <span>Unit</span>
            <span className="text-right">Default rate</span>
            <span />
          </div>

          <div className="divide-y divide-line-2">
            {products.map((p) => (
              <details key={p.id} className="group">
                <summary
                  className={`${ROW} cursor-pointer list-none py-2.5 transition-colors hover:bg-canvas/60 [&::-webkit-details-marker]:hidden`}
                >
                  <span className="truncate text-[13px] font-medium">{p.name}</span>
                  <span className="truncate font-mono text-[12px] text-ink-2">{p.code ?? "—"}</span>
                  <span className="text-[12.5px] text-ink-2">{p.unit}</span>
                  <span className="tnum text-right text-[13px]">{money(Number(p.defaultRate))}</span>
                  <span className="text-right text-[12px] text-ink-3">
                    <span className="group-open:hidden">Edit</span>
                    <span className="hidden group-open:inline">Close</span>
                  </span>
                </summary>
                <div className="border-t border-line-2 bg-canvas/40 p-4">
                  <ProductForm product={p} />
                </div>
              </details>
            ))}
          </div>
        </div>
      )}

      {products.length === 0 && <EmptyState>No products yet. Add the first one below.</EmptyState>}

      <details
        open={products.length === 0}
        className="group mt-4 overflow-hidden rounded-md border border-dashed border-line bg-paper"
      >
        <summary className="cursor-pointer list-none px-3 py-2.5 text-[13px] font-medium text-ink-2 transition-colors hover:bg-canvas/60 [&::-webkit-details-marker]:hidden">
          <span className="group-open:hidden">Add a product</span>
          <span className="hidden group-open:inline">New product</span>
        </summary>
        <div className="border-t border-line-2 bg-canvas/40 p-4">
          <ProductForm product={null} />
        </div>
      </details>
    </>
  );
}

type Product = Awaited<ReturnType<typeof prisma.product.findMany>>[number];

function ProductForm({ product }: { product: Product | null }) {
  const formId = product ? `product-${product.id}` : "product-new";

  // Capped: a field wider than the value it holds is harder to read, not easier.
  return (
    <div className="max-w-3xl space-y-3.5">
      <form id={formId} action={saveProduct} className="grid gap-x-4 gap-y-3 sm:grid-cols-4">
        {product && <input type="hidden" name="id" value={product.id} />}
        <Field label="Name" name="name" required defaultValue={product?.name} className="sm:col-span-2" />
        <Field label="Code" name="code" defaultValue={product?.code} />
        <Field label="Unit" name="unit" defaultValue={product?.unit ?? "pcs"} placeholder="pcs / kg / sheet" />
        <Field
          label="Default rate"
          name="defaultRate"
          type="number"
          step="0.01"
          defaultValue={product ? Number(product.defaultRate) : undefined}
        />
      </form>

      <div className="flex items-center justify-between gap-3 border-t border-line pt-3.5">
        {product ? (
          <form action={deleteProduct}>
            <input type="hidden" name="id" value={product.id} />
            <button className={btn.danger}>Delete product</button>
          </form>
        ) : (
          <span />
        )}
        <button form={formId} className={btn.primary}>
          {product ? "Save changes" : "Create product"}
        </button>
      </div>
    </div>
  );
}
