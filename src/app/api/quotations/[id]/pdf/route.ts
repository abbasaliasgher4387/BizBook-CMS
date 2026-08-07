// Downloads one quotation as a PDF. The PDF is the quotation page itself,
// printed by a headless browser — the app chrome is already .no-print, so what
// comes out is the sheet and nothing else.
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { originOf, pdfFilename, renderPdf } from "@/lib/pdf";
import { prisma } from "@/lib/prisma";

// Chromium cannot run on the edge runtime, and every download is a fresh render.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request, ctx: RouteContext<"/api/quotations/[id]/pdf">) {
  await requireUser();
  const { id } = await ctx.params;

  const quotation = await prisma.quotation.findUnique({
    where: { id },
    select: { number: true, company: { select: { code: true } } },
  });
  if (!quotation) notFound();

  const pdf = await renderPdf(`${originOf(req)}/quotations/${id}`, req.headers.get("cookie"));

  return new Response(pdf as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${pdfFilename(`${quotation.company.code}-${quotation.number}`)}"`,
      "Cache-Control": "no-store",
    },
  });
}
