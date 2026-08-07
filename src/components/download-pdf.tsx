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
      if (!res.ok) throw new Error(String(res.status));

      const url = URL.createObjectURL(await res.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("The PDF could not be generated. Use Print instead, and choose Save as PDF.");
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
