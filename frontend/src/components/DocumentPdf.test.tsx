import { writeFileSync } from "node:fs";
import { renderToBuffer } from "@react-pdf/renderer";
import { marked } from "marked";
import { describe, expect, it } from "vitest";
import { buildKeyTermsPage, DOCUMENTS, formatStandardTerms, type LegalDocument } from "@/lib/documents";
import { fillCoverPage, toNdaData } from "@/lib/nda";
import { readTemplate } from "@/lib/test-utils";
import { DocumentPdf } from "./DocumentPdf";

const party = { name: "Ada Lovelace", title: "CEO", company: "Acme Inc.", noticeAddress: "ada@acme.com" };

describe("DocumentPdf", () => {
  it.each(DOCUMENTS)("renders the filled $name to a PDF", async (definition) => {
    const draft: LegalDocument = {
      type: definition.id,
      party1: party,
      party2: party,
      terms: [{ key: "effectiveDate", value: "2026-10-26" }],
    };
    const coverPage = definition.coverPage
      ? fillCoverPage(readTemplate(definition.coverPage), toNdaData(draft))
      : buildKeyTermsPage(definition, draft);
    const standardTerms = formatStandardTerms(readTemplate(definition.standardTerms));

    const buffer = await renderToBuffer(
      <DocumentPdf title={definition.name} coverPage={marked.lexer(coverPage)} standardTerms={marked.lexer(standardTerms)} />,
    );

    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");
    if (process.env.PDF_OUT_DIR) writeFileSync(`${process.env.PDF_OUT_DIR}/${definition.id}.pdf`, buffer);
  });
});
