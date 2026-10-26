/** Markdown helpers shared by the cover pages: user input is always rendered literally. */
import type { Party } from "./documents";

export function formatDate(isoDate: string): string {
  // Parse as UTC so the displayed day never shifts with the user's timezone.
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("en-US", {
    timeZone: "UTC",
    dateStyle: "long",
  });
}

/** Escapes markdown syntax so user input is always rendered literally. */
export function escapeMarkdown(value: string): string {
  return value.replace(/[\\`*_{}[\]()<>#+\-.!|~&:@]/g, "\\$&");
}

/** Escapes user input as inline markdown; line breaks become hard breaks (or `lineSeparator`). */
export function toInline(value: string, lineSeparator = "  \n"): string {
  return value
    .split("\n")
    .map((line) => escapeMarkdown(line.trim()))
    .filter(Boolean)
    .join(lineSeparator);
}

/** Signature table rows filled from each party; "Signature" and "Date" stay blank for signing. */
export const PARTY_ROWS: Record<string, keyof Party> = {
  "Print Name": "name",
  Title: "title",
  Company: "company",
  "Notice Address": "noticeAddress",
};

/** The signature table row `label` (a key of PARTY_ROWS), with each party's value. */
export function partyRow(label: string, party1: Party, party2: Party): string {
  const field = PARTY_ROWS[label];
  return `| ${label} | ${toInline(party1[field], ", ")} | ${toInline(party2[field], ", ")} |`;
}
