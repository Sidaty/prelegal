/**
 * Supported document types (documents.json at the repository root) and the generic document
 * the AI fills in. Documents without a cover page template get a generated Key Terms page.
 */
import catalog from "../../../documents.json";
import { formatDate, PARTY_ROWS, partyRow, toInline } from "./markdown";

export interface Party {
  name: string;
  title: string;
  company: string;
  noticeAddress: string;
}

export interface Term {
  key: string;
  value: string;
}

/** A legal document being drafted; mirrors Document in the backend. `type` is a document id, or "" until chosen. */
export interface LegalDocument {
  type: string;
  party1: Party;
  party2: Party;
  terms: Term[];
}

export interface DocumentDefinition {
  id: string;
  name: string;
  description: string;
  /** Template of the document's own cover page; only the Mutual NDA has one. */
  coverPage?: string;
  standardTerms: string;
  parties: string[];
  terms: { key: string; label: string; description: string }[];
}

export const DOCUMENTS: DocumentDefinition[] = catalog.documents;

const emptyParty: Party = { name: "", title: "", company: "", noticeAddress: "" };

export const EMPTY_DRAFT: LegalDocument = { type: "", party1: emptyParty, party2: emptyParty, terms: [] };

export function findDefinition(type: string): DocumentDefinition | undefined {
  return DOCUMENTS.find((definition) => definition.id === type);
}

export function termValue(draft: LegalDocument, key: string): string {
  return draft.terms.find((term) => term.key === key)?.value ?? "";
}

/** Returns `value` if it is a yyyy-mm-dd date, else "". */
export function isoDate(value: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
}

/** A term value as inline markdown: dates spelled out, blanks shown as a bracketed placeholder. */
function termText(value: string, label: string): string {
  if (!value.trim()) return `\\[${label}\\]`;
  return isoDate(value) ? formatDate(value) : toInline(value);
}

/** Builds the Key Terms cover page that precedes the standard terms. */
export function buildKeyTermsPage(definition: DocumentDefinition, draft: LegalDocument): string {
  const [role1, role2] = definition.parties;
  const terms = definition.terms.map(({ key, label }) => `| ${label} | ${termText(termValue(draft, key), label)} |`);
  const parties = Object.keys(PARTY_ROWS).map((label) => partyRow(label, draft.party1, draft.party2));
  return [
    `# ${definition.name}`,
    `This ${definition.name} consists of these Key Terms and the Common Paper ${definition.name} Standard Terms that follow. The Key Terms control over any conflict with the Standard Terms.`,
    "## Key Terms",
    ["| Term | Value |", "| --- | --- |", ...terms].join("\n"),
    "## Signatures",
    [`|  | ${role1} | ${role2} |`, "| --- | --- | --- |", "| Signature |  |  |", ...parties, "| Date |  |  |"].join("\n"),
  ].join("\n\n");
}

/** Strips the template markup: defined terms become emphasized, section titles bold. */
export function formatStandardTerms(template: string): string {
  return template
    .replace(/<span class="[a-z]+_link"[^>]*>(.*?)<\/span>/g, "_$1_")
    .replace(/<span class="header_\d"[^>]*>(.*?)<\/span>/g, "**$1**")
    .replace(/<span[^>]*>(.*?)<\/span>/g, "$1");
}

export function pdfFileName(definition: DocumentDefinition, draft: LegalDocument): string {
  const parts = [definition.name, draft.party1.company, draft.party2.company]
    .map((part) => part.trim().replace(/[^\p{L}\p{N}-]+/gu, "-").replace(/^-+|-+$/g, ""))
    .filter(Boolean);
  return parts.join("_") + ".pdf";
}
