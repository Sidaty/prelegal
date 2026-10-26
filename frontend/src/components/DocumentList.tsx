"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { findDefinition } from "@/lib/documents";
import { editedLabel, listDocuments, type DocumentSummary } from "@/lib/history";

const newDocumentClass =
  "rounded-md bg-submit px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-submit/90";

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-line bg-white px-6 py-16 text-center">
      <h2 className="text-lg font-semibold text-navy">No documents yet</h2>
      <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-muted">
        Tell the assistant what you need, such as an NDA with a new partner or a cloud service agreement for a
        customer. It drafts the agreement as you answer.
      </p>
      <Link href="/app/document/" className={`mt-6 inline-block ${newDocumentClass}`}>
        Draft your first document
      </Link>
    </div>
  );
}

/** The signed-in user's documents, most recently edited first. */
export function DocumentList() {
  const [documents, setDocuments] = useState<DocumentSummary[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    listDocuments().then(setDocuments, (e) => {
      console.error(e);
      setError(true);
    });
  }, []);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6">
      <div className="mb-8 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-navy">Your documents</h1>
        {!!documents?.length && (
          <Link href="/app/document/" className={newDocumentClass}>
            New document
          </Link>
        )}
      </div>
      {error && <p role="alert" className="text-[15px] text-red-700">Your documents could not be loaded. Reload the page to try again.</p>}
      {!documents && !error && <p role="status" className="text-[15px] text-muted">Loading your documents…</p>}
      {documents?.length === 0 && <EmptyState />}
      {!!documents?.length && (
        <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-white">
          {documents.map((document) => (
            <li key={document.id}>
              <Link
                href={`/app/document/?id=${document.id}`}
                className="flex flex-col gap-1 px-5 py-4 hover:bg-surface sm:flex-row sm:items-center sm:justify-between sm:gap-6"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium text-navy">{document.title}</span>
                  <span className="block text-sm text-muted">{findDefinition(document.type)?.name}</span>
                </span>
                <span className="shrink-0 text-sm text-muted">{editedLabel(document.updatedAt)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
