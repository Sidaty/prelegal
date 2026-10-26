/**
 * Fills the Common Paper Mutual NDA templates (see /templates) with the
 * information entered by the user. Templates stay the single source of truth:
 * we only substitute their placeholders, so any field left blank keeps the
 * original placeholder text (e.g. "[Fill in state]").
 */

export interface Party {
  name: string;
  title: string;
  company: string;
  noticeAddress: string;
}

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

const emptyParty: Party = { name: "", title: "", company: "", noticeAddress: "" };

export const DEFAULT_NDA: NdaData = {
  purpose: "Evaluating whether to enter into a business relationship with the other party.",
  effectiveDate: "",
  mndaTerm: "expires",
  mndaTermYears: 1,
  confidentialityTerm: "years",
  confidentialityYears: 1,
  governingLaw: "",
  jurisdiction: "",
  modifications: "",
  party1: emptyParty,
  party2: emptyParty,
};

/** Signature table rows filled from each party; "Signature" and "Date" stay blank for signing. */
const PARTY_ROWS: Record<string, keyof Party> = {
  "Print Name": "name",
  Title: "title",
  Company: "company",
  "Notice Address": "noticeAddress",
};

export function formatDate(isoDate: string): string {
  // Parse as UTC so the displayed day never shifts with the user's timezone.
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("en-US", {
    timeZone: "UTC",
    dateStyle: "long",
  });
}

function formatYears(years: number): string {
  return years === 1 ? "1 year" : `${years} years`;
}

/** Escapes markdown syntax so user input is always rendered literally. */
export function escapeMarkdown(value: string): string {
  return value.replace(/[\\`*_{}[\]()<>#+\-.!|~&:@]/g, "\\$&");
}

/** Escapes user input as inline markdown; line breaks become hard breaks (or `lineSeparator`). */
function toInline(value: string, lineSeparator = "  \n"): string {
  return value
    .split("\n")
    .map((line) => escapeMarkdown(line.trim()))
    .filter(Boolean)
    .join(lineSeparator);
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

  return md.replace(/^\| (Print Name|Title|Company|Notice Address) \|.*$/gm, (_, label: string) => {
    const field = PARTY_ROWS[label];
    return `| ${label} | ${toInline(data.party1[field], ", ")} | ${toInline(data.party2[field], ", ")} |`;
  });
}

/** Turns the cover-page references of the Standard Terms into emphasized defined terms. */
export function formatStandardTerms(template: string): string {
  return template.replace(/<span class="coverpage_link">(.*?)<\/span>/g, "_$1_");
}

export function pdfFileName(data: NdaData): string {
  const companies = [data.party1.company, data.party2.company]
    .map((company) => company.trim().replace(/[^\p{L}\p{N}-]+/gu, "-").replace(/^-+|-+$/g, ""))
    .filter(Boolean);
  return ["Mutual-NDA", ...companies].join("_") + ".pdf";
}
