/**
 * Fills the Common Paper Mutual NDA cover page template (see /templates) with the
 * information gathered in the chat. Templates stay the single source of truth:
 * we only substitute their placeholders, so any field left blank keeps the
 * original placeholder text (e.g. "[Fill in state]").
 */
import { isoDate, termValue, type LegalDocument, type Party } from "./documents";
import { formatDate, partyRow, toInline } from "./markdown";

export interface NdaData {
  purpose: string;
  /** ISO date (yyyy-mm-dd), empty when not chosen yet. */
  effectiveDate: string;
  mndaTerm: "expires" | "untilTerminated";
  mndaTermYears: number;
  confidentialityTerm: "years" | "perpetual";
  confidentialityYears: number;
  governingLaw: string;
  jurisdiction: string;
  modifications: string;
  party1: Party;
  party2: Party;
}

/** Reads the NDA fields from a draft's terms (keys in documents.json); terms default to 1 year. */
export function toNdaData(draft: LegalDocument): NdaData {
  const term = (key: string) => termValue(draft, key);
  return {
    purpose: term("purpose"),
    effectiveDate: isoDate(term("effectiveDate")),
    mndaTerm: term("mndaTerm") === "untilTerminated" ? "untilTerminated" : "expires",
    mndaTermYears: Number(term("mndaTermYears")) || 1,
    confidentialityTerm: term("confidentialityTerm") === "perpetual" ? "perpetual" : "years",
    confidentialityYears: Number(term("confidentialityYears")) || 1,
    governingLaw: term("governingLaw"),
    jurisdiction: term("jurisdiction"),
    modifications: term("modifications"),
    party1: draft.party1,
    party2: draft.party2,
  };
}

function formatYears(years: number): string {
  return years === 1 ? "1 year" : `${years} years`;
}

/** Replaces the first match of `placeholder` with `value`, unless `value` is blank. */
function fill(text: string, placeholder: RegExp, value: string): string {
  const inline = toInline(value);
  return inline ? text.replace(placeholder, () => inline) : text;
}

/** Applies `transform` to the body of the `### heading` section (up to the next `###`). */
function editSection(md: string, heading: string, transform: (body: string) => string): string {
  const start = md.indexOf(`### ${heading}\n`);
  if (start === -1) return md;
  const bodyStart = md.indexOf("\n", start) + 1;
  const next = md.indexOf("\n### ", bodyStart);
  const bodyEnd = next === -1 ? md.length : next;
  return md.slice(0, bodyStart) + transform(md.slice(bodyStart, bodyEnd)) + md.slice(bodyEnd);
}

/** Checks only the option at `selected` in a `- [x]` / `- [ ]` task list. */
function selectOption(body: string, selected: number): string {
  let index = 0;
  return body.replace(/^- \[[ x]\]\s+/gm, () => `- [${index++ === selected ? "x" : " "}] `);
}

export function fillCoverPage(template: string, data: NdaData): string {
  let md = template.replace(/\s*<label>.*?<\/label>/g, "");

  md = editSection(md, "Purpose", (body) => fill(body, /\[[^\]]+\]/, data.purpose));

  md = editSection(md, "Effective Date", (body) =>
    data.effectiveDate ? fill(body, /\[[^\]]+\]/, formatDate(data.effectiveDate)) : body,
  );

  md = editSection(md, "MNDA Term", (body) =>
    selectOption(body, data.mndaTerm === "expires" ? 0 : 1).replace(/\[\d+ year\(s\)\]/, () =>
      formatYears(data.mndaTermYears),
    ),
  );

  md = editSection(md, "Term of Confidentiality", (body) =>
    selectOption(body, data.confidentialityTerm === "years" ? 0 : 1).replace(
      /\[\d+ year\(s\)\]/,
      () => formatYears(data.confidentialityYears),
    ),
  );

  md = editSection(md, "Governing Law & Jurisdiction", (body) =>
    fill(fill(body, /\[Fill in state\]/, data.governingLaw), /\[Fill in city[^\]]*\]/, data.jurisdiction),
  );

  md = editSection(md, "MNDA Modifications", (body) =>
    body.replace(/^List any modifications to the MNDA$/m, () => toInline(data.modifications) || "None."),
  );

  return md.replace(/^\| (Print Name|Title|Company|Notice Address) \|.*$/gm, (_, label: string) =>
    partyRow(label, data.party1, data.party2),
  );
}
