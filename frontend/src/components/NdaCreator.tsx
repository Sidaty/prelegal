"use client";

import { marked } from "marked";
import Link from "next/link";
import { useMemo, useState } from "react";
import { downloadBlob } from "@/lib/download";
import { DEFAULT_NDA, fillCoverPage, formatStandardTerms, pdfFileName, type NdaData } from "@/lib/nda";
import { NdaForm } from "./NdaForm";
import { NdaPreview } from "./NdaPreview";

interface NdaCreatorProps {
  coverPageTemplate: string;
  standardTermsTemplate: string;
}

export function NdaCreator({ coverPageTemplate, standardTermsTemplate }: NdaCreatorProps) {
  const [data, setData] = useState<NdaData>(DEFAULT_NDA);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const coverPage = useMemo(() => marked.lexer(fillCoverPage(coverPageTemplate, data)), [coverPageTemplate, data]);
  const standardTerms = useMemo(
    () => marked.lexer(formatStandardTerms(standardTermsTemplate)),
    [standardTermsTemplate],
  );

  async function downloadPdf() {
    setDownloading(true);
    setError(null);
    try {
      // Loaded on demand: react-pdf is large and only needed when downloading.
      const [{ pdf }, { NdaPdfDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./NdaPdfDocument"),
      ]);
      const blob = await pdf(<NdaPdfDocument coverPage={coverPage} standardTerms={standardTerms} />).toBlob();
      downloadBlob(blob, pdfFileName(data));
    } catch (e) {
      console.error(e);
      setError("Could not generate the PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-10 border-t-4 border-b border-t-accent border-b-stone-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div>
            <h1 className="text-lg font-semibold text-navy">Mutual NDA Creator</h1>
            <p className="text-xs text-muted">Based on the Common Paper Mutual NDA (Version 1.0)</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Always mounted so screen readers announce the error when it appears. */}
            <p role="status" aria-live="polite" className="text-sm text-red-600">
              {error}
            </p>
            <button
              type="button"
              onClick={downloadPdf}
              disabled={downloading}
              className="rounded-md bg-submit px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
            >
              {downloading ? "Generating…" : "Download PDF"}
            </button>
            <Link href="/" className="text-sm font-medium text-primary hover:underline">
              Sign out
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-7xl flex-1 gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <section aria-label="NDA details">
          <NdaForm data={data} onChange={setData} />
        </section>
        <section aria-label="Document preview" className="min-w-0">
          <NdaPreview coverPage={coverPage} standardTerms={standardTerms} />
        </section>
      </main>
    </div>
  );
}
