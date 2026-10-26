"use client";

import { marked } from "marked";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { downloadBlob } from "@/lib/download";
import {
  buildKeyTermsPage,
  EMPTY_DRAFT,
  findDefinition,
  formatStandardTerms,
  pdfFileName,
  type DocumentDefinition,
  type LegalDocument,
} from "@/lib/documents";
import { fillCoverPage, toNdaData } from "@/lib/nda";
import { DocumentChat } from "./DocumentChat";
import { DocumentPreview } from "./DocumentPreview";

interface Templates {
  id: string;
  coverPage?: string;
  standardTerms: string;
}

async function fetchTemplate(fileName: string): Promise<string> {
  const response = await fetch(`/templates/${fileName}`);
  if (!response.ok) throw new Error(`Template ${fileName} failed to load with status ${response.status}`);
  return response.text();
}

/** Loads the templates of the chosen document; null until they are loaded, or if loading fails. */
function useTemplates(definition: DocumentDefinition | undefined, onError: (message: string) => void): Templates | null {
  const [templates, setTemplates] = useState<Templates | null>(null);
  useEffect(() => {
    if (!definition) return;
    // Ignores a slower response for a document the user has already switched away from.
    let current = true;
    Promise.all([
      definition.coverPage ? fetchTemplate(definition.coverPage) : undefined,
      fetchTemplate(definition.standardTerms),
    ])
      .then(([coverPage, standardTerms]) => current && setTemplates({ id: definition.id, coverPage, standardTerms }))
      .catch((e) => {
        console.error(e);
        if (current) onError("Could not load the document. Please reload the page.");
      });
    return () => {
      current = false;
    };
  }, [definition, onError]);
  return templates?.id === definition?.id ? templates : null;
}

/** The cover page as markdown: the template's own when it has one (Mutual NDA), else generated Key Terms. */
function coverPageMarkdown(definition: DocumentDefinition, templates: Templates, draft: LegalDocument): string {
  return templates.coverPage ? fillCoverPage(templates.coverPage, toNdaData(draft)) : buildKeyTermsPage(definition, draft);
}

export function DocumentCreator() {
  const [draft, setDraft] = useState<LegalDocument>(EMPTY_DRAFT);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const definition = findDefinition(draft.type);
  const templates = useTemplates(definition, setError);

  const pages = useMemo(
    () =>
      definition && templates
        ? {
            coverPage: marked.lexer(coverPageMarkdown(definition, templates, draft)),
            standardTerms: marked.lexer(formatStandardTerms(templates.standardTerms)),
          }
        : null,
    [definition, templates, draft],
  );

  async function downloadPdf() {
    if (!definition || !pages) return;
    setDownloading(true);
    setError(null);
    try {
      // Loaded on demand: react-pdf is large and only needed when downloading.
      const [{ pdf }, { DocumentPdf }] = await Promise.all([import("@react-pdf/renderer"), import("./DocumentPdf")]);
      const blob = await pdf(<DocumentPdf title={definition.name} {...pages} />).toBlob();
      downloadBlob(blob, pdfFileName(definition, draft));
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
            <h1 className="text-lg font-semibold text-navy">{definition?.name ?? "New legal document"}</h1>
            <p className="text-xs text-muted">Based on Common Paper standard agreements</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Always mounted so screen readers announce the error when it appears. */}
            <p role="status" aria-live="polite" className="text-sm text-red-600">
              {error}
            </p>
            <button
              type="button"
              onClick={downloadPdf}
              disabled={downloading || !pages}
              className="rounded-md bg-submit px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
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
        <section aria-label="Chat with the assistant">
          <DocumentChat draft={draft} onChange={setDraft} />
        </section>
        <section aria-label="Document preview" className="min-w-0">
          {pages ? (
            <DocumentPreview {...pages} />
          ) : (
            <p className="mx-auto max-w-md pt-24 text-center text-muted">
              {definition ? "Loading the document…" : "Your document will appear here once you have chosen it in the chat."}
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
