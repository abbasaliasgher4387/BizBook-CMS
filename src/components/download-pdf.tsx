"use client";

// Rendering a PDF takes a few seconds, so this cannot be a plain link: without
// a pending state the button looks broken while the server is still working.
import { useState } from "react";
import { btn } from "@/components/ui";

export default function DownloadPdf({
  href,
  fileName,
  label = "Download PDF",
  variant = "primary",
}: {
  href: string;
  fileName: string;
  label?: string;
  variant?: "primary" | "ghost";
}) {
  const [busy, setBusy] = useState(false);

  async function download() {
    setBusy(true);
    try {
      const res = await fetch(href);
      // The route sends the real reason as plain text. Showing it beats "could
      // not be generated", which is true of every possible failure and useless.
      if (!res.ok) throw new Error((await res.text()).trim() || `Server returned ${res.status}.`);

      const url = URL.createObjectURL(await res.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(
        `The PDF could not be generated.\n\n${e instanceof Error ? e.message : e}\n\nUse Print instead, and choose Save as PDF.`,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" className={btn[variant]} onClick={download} disabled={busy}>
      {busy ? "Preparing…" : label}
    </button>
  );
}
