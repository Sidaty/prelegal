"use client";

import { marked } from "marked";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { GREETING, type ChatMessage } from "@/lib/chat";
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
import { documentTitle, openDocument, saveDocument } from "@/lib/history";
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
        if (current) onError("The document could not be loaded. Reload the page to try again.");
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

/** Where the draft lives: not saved until a document type is chosen, then saved after every answer. */
type SaveState = "unsaved" | "saving" | "saved" | "failed";

const SAVE_LABELS: Record<SaveState, string> = {
  unsaved: "",
  saving: "Saving…",
  saved: "Saved",
  failed: "Your latest changes could not be saved",
};

/** Drafts a new document, or continues the saved one given by `?id=`. */
export function DocumentCreator() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // The document opened with the page; later URL changes (after the first save) must not reload it.
  const [openedId] = useState(searchParams.get("id"));
  // The saved document's id, set by the first save of a new document.
  const idRef = useRef<number | undefined>(openedId ? Number(openedId) : undefined);
  // Saves run one after another: the next save knows the id the first one created, and an older save
  // never overwrites a newer one.
  const savesRef = useRef<Promise<void>>(Promise.resolve());
  const [opening, setOpening] = useState(openedId !== null);
  const [draft, setDraft] = useState<LegalDocument>(EMPTY_DRAFT);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [saveState, setSaveState] = useState<SaveState>(openedId === null ? "unsaved" : "saved");
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const definition = findDefinition(draft.type);
  const templates = useTemplates(definition, setError);

  useEffect(() => {
    if (!openedId) return;
    openDocument(Number(openedId))
      .then((saved) => {
        setDraft(saved.document);
        setMessages(saved.messages);
      })
      .catch((e) => {
        console.error(e);
        setError("This document could not be opened. It may belong to another account.");
      })
      .finally(() => setOpening(false));
  }, [openedId]);

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

  function handleTurn(conversation: ChatMessage[], updated: LegalDocument) {
    setMessages(conversation);
    setDraft(updated);
    if (!updated.type) return;
    setSaveState("saving");
    savesRef.current = savesRef.current.then(async () => {
      try {
        const saved = await saveDocument(idRef.current, updated, conversation);
        if (idRef.current === undefined) {
          idRef.current = saved.id;
          router.replace(`/app/document/?id=${saved.id}`);
        }
        setSaveState("saved");
      } catch (e) {
        console.error(e);
        setSaveState("failed");
      }
    });
  }

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
      setError("The PDF could not be generated. Try downloading it again.");
    } finally {
      setDownloading(false);
    }
  }

  if (opening) return <p className="px-6 py-10 text-center text-[15px] text-muted">Opening your document…</p>;

  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-navy">
              {definition ? documentTitle(draft) : "New document"}
            </h1>
            <p className="text-sm text-muted">
              {definition ? "Based on Common Paper standard terms" : "Tell the assistant what you need to get started"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <p role="status" aria-live="polite" className={`text-sm ${saveState === "failed" ? "text-red-700" : "text-muted"}`}>
              {error ?? SAVE_LABELS[saveState]}
            </p>
            <button
              type="button"
              onClick={downloadPdf}
              disabled={downloading || !pages}
              className="rounded-md bg-submit px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-submit/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {downloading ? "Generating…" : "Download PDF"}
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto grid w-full max-w-7xl flex-1 gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)]">
        <section aria-label="Chat with the assistant">
          <DocumentChat draft={draft} messages={messages} onTurn={handleTurn} />
        </section>
        <section aria-label="Document preview" className="min-w-0">
          <p className="mx-auto mb-4 max-w-[8.5in] border-l-4 border-accent bg-white px-4 py-3 text-sm leading-relaxed text-stone-700">
            This is a draft, not legal advice. Have a qualified lawyer review it before anyone signs.
          </p>
          {pages ? (
            <DocumentPreview {...pages} />
          ) : (
            <div className="mx-auto max-w-[8.5in] rounded-lg border border-dashed border-line bg-white px-8 py-24 text-center">
              <p className="text-[15px] text-muted">
                {definition ? "Loading the document…" : "Your document appears here as soon as you choose it in the chat."}
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
