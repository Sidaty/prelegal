import { describe, expect, it } from "vitest";
import { EMPTY_DRAFT, type LegalDocument } from "./documents";
import { formatDate } from "./markdown";
import { fillCoverPage, toNdaData, type NdaData } from "./nda";
import { readTemplate, renderedText } from "./test-utils";

const coverPage = readTemplate("Mutual-NDA-coverpage.md");

const blankNda = toNdaData(EMPTY_DRAFT);

const data: NdaData = {
  ...blankNda,
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
    const blank = renderedText(fillCoverPage(coverPage, blankNda));
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

describe("formatDate", () => {
  it("does not shift the day across timezones", () => {
    expect(formatDate("2026-01-01")).toBe("January 1, 2026");
  });
});


describe("toNdaData", () => {
  const draft: LegalDocument = {
    ...EMPTY_DRAFT,
    type: "mutual-nda",
    party1: data.party1,
    terms: [
      { key: "effectiveDate", value: "2026-10-26" },
      { key: "mndaTerm", value: "untilTerminated" },
      { key: "confidentialityYears", value: "3" },
      { key: "governingLaw", value: "Delaware" },
    ],
  };

  it("reads the NDA fields from the draft's terms", () => {
    expect(toNdaData(draft)).toMatchObject({
      effectiveDate: "2026-10-26",
      mndaTerm: "untilTerminated",
      confidentialityTerm: "years",
      confidentialityYears: 3,
      governingLaw: "Delaware",
      party1: data.party1,
    });
  });

  it("defaults terms to 1 year and ignores dates that are not yyyy-mm-dd", () => {
    expect(toNdaData({ ...draft, terms: [{ key: "effectiveDate", value: "next Monday" }] })).toMatchObject({
      effectiveDate: "",
      mndaTerm: "expires",
      mndaTermYears: 1,
      confidentialityYears: 1,
    });
  });
});
