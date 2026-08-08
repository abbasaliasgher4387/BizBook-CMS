// Every design in one PDF — the pack to hand the client when asking "is this how
// your quotation should look?", and with ?kind=bill, the same question about
// their bills.
import { requireUser } from "@/lib/auth";
import { originOf, pdfError, renderPdf } from "@/lib/pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  await requireUser();

  // Read and re-emit rather than forwarding the query string as it arrived, so
  // whatever reaches the headless browser is one of exactly two URLs.
  const kind = new URL(req.url).searchParams.get("kind") === "bill" ? "bill" : "quotation";

  let pdf: Uint8Array;
  try {
    pdf = await renderPdf(`${originOf(req)}/print/designs?kind=${kind}`, req.headers.get("cookie"));
  } catch (e) {
    return pdfError(e);
  }

  return new Response(pdf as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${kind}-designs.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
