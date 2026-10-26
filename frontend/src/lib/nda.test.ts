import { readFileSync } from "node:fs";
import { join } from "node:path";
import { marked, type Token } from "marked";
import { describe, expect, it } from "vitest";
import { DEFAULT_NDA, fillCoverPage, formatDate, formatStandardTerms, pdfFileName, type NdaData } from "./nda";

const templatesDir = join(__dirname, "../../../templates");
const coverPage = readFileSync(join(templatesDir, "Mutual-NDA-coverpage.md"), "utf8");
const standardTerms = readFileSync(join(templatesDir, "Mutual-NDA.md"), "utf8");

/** Text as rendered from the markdown, one line per block / list item / table row. */
function renderedText(md: string): string {
  const inline = (tokens: Token[] = []): string =>
    tokens
      .map((t) => {
        if (t.type === "checkbox") return t.checked ? "[x] " : "[ ] ";
        if (t.type === "br") return "\n";
        if (t.type === "html") return "";
        return "tokens" in t && t.tokens ? inline(t.tokens) : "text" in t ? t.text : "";
      })
      .join("");
  return marked
    .lexer(md)
    .flatMap((t): string[] => {
      if (t.type === "list") return t.items.map((item: { tokens: Token[] }) => inline(item.tokens));
      if (t.type === "table")
        return [t.header, ...t.rows].map((row: { tokens: Token[] }[]) => row.map((c) => inline(c.tokens)).join(" | "));
      return "tokens" in t ? [inline(t.tokens)] : [];
    })
    .join("\n");
}

const data: NdaData = {
  ...DEFAULT_NDA,
  purpose: "Exploring a joint venture.",
  effectiveDate: "2026-10-26",
  mndaTerm: "untilTerminated",
  mndaTermYears: 3,
  confidentialityTerm: "years",
  confidentialityYears: 2,
  governingLaw: "Delaware",
  jurisdiction: "courts located in New Castle, DE",
  modifications: "Section 8 does not apply.",
  party1: { name: "Ada Lovelace", title: "CEO", company: "Acme Inc.", noticeAddress: "ada@acme.com" },
  party2: { name: "Alan Turing", title: "CTO", company: "Globex | Labs", noticeAddress: "1 Main St\nSpringfield" },
};

describe("fillCoverPage", () => {
  const text = renderedText(fillCoverPage(coverPage, data));

  it("fills the business terms", () => {
    expect(text).toContain("Exploring a joint venture.");
    expect(text).toContain("October 26, 2026");
    expect(text).toContain("Governing Law: Delaware");
    expect(text).toContain("Jurisdiction: courts located in New Castle, DE");
    expect(text).toContain("Section 8 does not apply.");
    expect(text).not.toContain("List any modifications");
  });

  it("checks the selected term options", () => {
    expect(text).toContain("[ ] Expires 3 years from Effective Date.");
    expect(text).toContain("[x] Continues until terminated");
    expect(text).toContain("[x] 2 years from Effective Date");
    expect(text).toContain("[ ] In perpetuity.");
  });

  it("fills the signature table", () => {
    expect(text).toContain("Print Name | Ada Lovelace | Alan Turing");
    expect(text).toContain("Company | Acme Inc. | Globex | Labs");
    expect(text).toContain("Notice Address | ada@acme.com | 1 Main St, Springfield");
    expect(text).toMatch(/^Signature \|  \| $/m);
  });

  it("removes form hints", () => {
    expect(fillCoverPage(coverPage, data)).not.toContain("<label>");
  });

  it("keeps template placeholders for blank fields", () => {
    const blank = renderedText(fillCoverPage(coverPage, DEFAULT_NDA));
    expect(blank).toContain("[Today’s date]");
    expect(blank).toContain("[Fill in state]");
    expect(blank).toContain("[x] Expires 1 year from Effective Date.");
    expect(blank).toContain("None.");
  });

  it("renders user input literally, without markdown, HTML or replacement patterns", () => {
    const literal = "# *Foo* _bar_ <b>x</b> [link](http://a.b) www.x.io a@b.co & $& 1. - |";
    const filled = renderedText(
      fillCoverPage(coverPage, {
        ...data,
        purpose: literal,
        governingLaw: literal,
        party1: { ...data.party1, company: literal },
      }),
    );
    expect(filled).toContain(`Purpose\n${literal}`);
    expect(filled).toContain(`Governing Law: ${literal}`);
    expect(filled).toContain(`Company | ${literal} |`);
  });

  it("keeps line breaks of multi-line fields", () => {
    const filled = renderedText(fillCoverPage(coverPage, { ...data, modifications: "First.\n\nSecond." }));
    expect(filled).toContain("First.\nSecond.");
  });
});

describe("formatStandardTerms", () => {
  it("replaces cover page links with emphasized terms", () => {
    const formatted = formatStandardTerms(standardTerms);
    expect(formatted).not.toContain("coverpage_link");
    expect(formatted).toContain("the laws of the State of _Governing Law_");
  });
});

describe("formatDate", () => {
  it("does not shift the day across timezones", () => {
    expect(formatDate("2026-01-01")).toBe("January 1, 2026");
  });
});

describe("pdfFileName", () => {
  it("includes sanitized company names", () => {
    expect(pdfFileName(data)).toBe("Mutual-NDA_Acme-Inc_Globex-Labs.pdf");
    expect(pdfFileName({ ...data, party1: { ...data.party1, company: "Société Générale" } })).toBe(
      "Mutual-NDA_Société-Générale_Globex-Labs.pdf",
    );
    expect(pdfFileName(DEFAULT_NDA)).toBe("Mutual-NDA.pdf");
  });
});
