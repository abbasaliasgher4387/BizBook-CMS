// Downloads one bill as a PDF. The PDF is the bill page itself, printed by a
// headless browser — the app chrome is already .no-print, so what comes out is
// the sheet and nothing else.
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { originOf, pdfError, pdfFilename, renderPdf } from "@/lib/pdf";
import { prisma } from "@/lib/prisma";

// Chromium cannot run on the edge runtime, and every download is a fresh render.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request, ctx: RouteContext<"/api/bills/[id]/pdf">) {
  await requireUser();
  const { id } = await ctx.params;

  const bill = await prisma.bill.findUnique({
    where: { id },
    select: { number: true, company: { select: { code: true } } },
  });
  if (!bill) notFound();

  let pdf: Uint8Array;
  try {
    pdf = await renderPdf(`${originOf(req)}/bills/${id}`, req.headers.get("cookie"));
  } catch (e) {
    return pdfError(e);
  }

  return new Response(pdf as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      // The same reference the sheet prints, so the file on disk and the paper
      // on the desk are recognisably one document.
      "Content-Disposition": `attachment; filename="${pdfFilename(`${bill.company.code}-B-${bill.number}`)}"`,
      "Cache-Control": "no-store",
    },
  });
}
