// Every quotation design in one PDF — the pack to hand the client when asking
// "is this how your quotation should look?".
import { requireUser } from "@/lib/auth";
import { originOf, renderPdf } from "@/lib/pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  await requireUser();
  const pdf = await renderPdf(`${originOf(req)}/print/designs`, req.headers.get("cookie"));

  return new Response(pdf as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="quotation-designs.pdf"',
      "Cache-Control": "no-store",
    },
  });
}
