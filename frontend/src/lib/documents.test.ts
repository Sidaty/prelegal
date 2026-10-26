import { describe, expect, it } from "vitest";
import {
  buildKeyTermsPage,
  DOCUMENTS,
  EMPTY_DRAFT,
  findDefinition,
  formatStandardTerms,
  pdfFileName,
  type LegalDocument,
} from "./documents";
import { readTemplate, renderedText } from "./test-utils";

const csa = findDefinition("cloud-service-agreement")!;

const draft: LegalDocument = {
  type: "cloud-service-agreement",
  party1: { name: "Ada Lovelace", title: "CEO", company: "Acme Inc.", noticeAddress: "ada@acme.com" },
  party2: { name: "Alan Turing", title: "CTO", company: "Globex | Labs", noticeAddress: "1 Main St\nSpringfield" },
  terms: [
    { key: "effectiveDate", value: "2026-10-26" },
    { key: "governingLaw", value: "Delaware" },
    { key: "fees", value: "USD *12,000* per year" },
  ],
};

describe("DOCUMENTS", () => {
  it("defines the 11 supported documents, each with two parties and existing templates", () => {
    expect(DOCUMENTS).toHaveLength(11);
    for (const definition of DOCUMENTS) {
      expect(definition.parties).toHaveLength(2);
      expect(readTemplate(definition.standardTerms)).toMatch(/^# /);
      if (definition.coverPage) expect(readTemplate(definition.coverPage)).toMatch(/^# /);
    }
  });

  it("keeps the term keys the Mutual NDA cover page relies on", () => {
    expect(findDefinition("mutual-nda")!.terms.map((term) => term.key)).toEqual([
      "purpose",
      "effectiveDate",
      "mndaTerm",
      "mndaTermYears",
      "confidentialityTerm",
      "confidentialityYears",
      "governingLaw",
      "jurisdiction",
      "modifications",
    ]);
  });

  it("finds no definition until a document is chosen", () => {
    expect(findDefinition(EMPTY_DRAFT.type)).toBeUndefined();
  });
});

describe("buildKeyTermsPage", () => {
  const text = renderedText(buildKeyTermsPage(csa, draft));

  it("lists the key terms, with dates spelled out and placeholders for blanks", () => {
    expect(text).toContain("Cloud Service Agreement");
    expect(text).toContain("Effective Date | October 26, 2026");
    expect(text).toContain("Governing Law | Delaware");
    expect(text).toContain("General Cap Amount | [General Cap Amount]");
  });

  it("renders values literally", () => {
    expect(text).toContain("Fees | USD *12,000* per year");
  });

  it("fills the signature table with the parties' roles", () => {
    expect(text).toContain(" | Provider | Customer");
    expect(text).toContain("Company | Acme Inc. | Globex | Labs");
    expect(text).toContain("Notice Address | ada@acme.com | 1 Main St, Springfield");
    expect(text).toMatch(/^Signature \|  \| $/m);
  });
});

describe("formatStandardTerms", () => {
  it("leaves no template markup in any standard terms", () => {
    for (const definition of DOCUMENTS) {
      expect(formatStandardTerms(readTemplate(definition.standardTerms))).not.toContain("<span");
    }
  });

  it("emphasizes defined terms and bolds section titles", () => {
    const formatted = formatStandardTerms(readTemplate("CSA.md"));
    expect(formatted).toContain("During the _Subscription Period_ and");
    expect(formatted).toContain("**Access and Use.**");
  });
});

describe("pdfFileName", () => {
  it("names the document and the sanitized companies", () => {
    expect(pdfFileName(csa, draft)).toBe("Cloud-Service-Agreement_Acme-Inc_Globex-Labs.pdf");
    expect(pdfFileName(csa, EMPTY_DRAFT)).toBe("Cloud-Service-Agreement.pdf");
  });
});
