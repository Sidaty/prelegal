/** The signed-in user's saved documents, each with the conversation that drafted it. */
import { api } from "./api";
import type { ChatMessage } from "./chat";
import { findDefinition, type LegalDocument } from "./documents";

export interface DocumentSummary {
  id: number;
  title: string;
  type: string;
  updatedAt: string;
}

export interface SavedDocument {
  id: number;
  title: string;
  document: LegalDocument;
  messages: ChatMessage[];
  updatedAt: string;
}

export function listDocuments(): Promise<DocumentSummary[]> {
  return api("/api/documents");
}

export function openDocument(id: number): Promise<SavedDocument> {
  return api(`/api/documents/${id}`);
}

/** Creates the document when it has no id yet, else updates it. */
export function saveDocument(id: number | undefined, draft: LegalDocument, messages: ChatMessage[]): Promise<SavedDocument> {
  const body = { title: documentTitle(draft), document: draft, messages };
  return id === undefined ? api("/api/documents", "POST", body) : api(`/api/documents/${id}`, "PUT", body);
}

/** e.g. "Cloud Service Agreement between Acme Inc. and Globex Corp." */
export function documentTitle(draft: LegalDocument): string {
  const name = findDefinition(draft.type)?.name ?? "Untitled document";
  const companies = [draft.party1.company, draft.party2.company].map((company) => company.trim()).filter(Boolean);
  if (companies.length === 2) return `${name} between ${companies[0]} and ${companies[1]}`;
  if (companies.length === 1) return `${name} with ${companies[0]}`;
  return name;
}

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["day", 86_400_000],
  ["hour", 3_600_000],
  ["minute", 60_000],
];

/** e.g. "Edited 5 minutes ago", or "Edited just now" under a minute. */
export function editedLabel(updatedAt: string, now = Date.now()): string {
  const elapsed = now - new Date(updatedAt).getTime();
  const match = UNITS.find(([, size]) => elapsed >= size);
  if (!match) return "Edited just now";
  const [unit, size] = match;
  return `Edited ${new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(-Math.floor(elapsed / size), unit)}`;
}
