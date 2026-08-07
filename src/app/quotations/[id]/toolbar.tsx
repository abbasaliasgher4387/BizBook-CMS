"use client";

// The three things that need the browser itself: window.print(), a confirm()
// before a delete that cannot be undone, and the PDF download.
import { deleteQuotation } from "@/app/actions";
import DownloadPdf from "@/components/download-pdf";
import { btn } from "@/components/ui";

// Same order as everywhere else in the app: destructive and secondary first,
// the action you actually came for last.
export default function Toolbar({ id, fileName }: { id: string; fileName: string }) {
  return (
    <div className="flex items-center gap-2">
      <form
        action={deleteQuotation}
        onSubmit={(e) => {
          if (!confirm("Delete this quotation permanently? This cannot be undone.")) e.preventDefault();
        }}
      >
        <input type="hidden" name="id" value={id} />
        <button className={btn.danger}>Delete</button>
      </form>

      <button type="button" className={btn.ghost} onClick={() => window.print()}>
        Print
      </button>

      <DownloadPdf href={`/api/quotations/${id}/pdf`} fileName={`${fileName}.pdf`} />
    </div>
  );
}
